#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {dirname, isAbsolute, relative, resolve, sep} from 'node:path';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

import {compareText, loadJson, requireValue} from './measure.mjs';

export {requireValue} from './measure.mjs';

export const SOURCE_GROUPS = ['documentation', 'product', 'external'];

export function comparePaths(first, second) {
    return compareText(first.path, second.path);
}

export function sourcePath(value) {
    requireValue(
        typeof value === 'string' &&
            value?.length > 0 &&
            !value?.includes('\\') &&
            !value?.includes('\0') &&
            !isAbsolute(value) &&
            value?.split('/').every((part) => part && part !== '.' && part !== '..'),
        'Source paths must be nonempty repository-relative paths without traversal.',
    );

    return value;
}

function versionTokens(environment) {
    requireValue(
        environment && typeof environment === 'object' && !Array.isArray(environment),
        'environment must be an object of version tokens.',
    );

    for (const [name, value] of Object.entries(environment)) {
        requireValue(
            /^[a-z][a-z0-9_.-]*$/.test(name) &&
                typeof value === 'string' &&
                /^[a-zA-Z0-9_.+:-]{1,200}$/.test(value),
            'Environment entries must be version tokens, not prose or paths.',
        );
    }

    return {...environment};
}

export function validateSnapshot(snapshot) {
    requireValue(snapshot?.version === 1, 'source_snapshot.version must be 1.');
    requireValue(
        Object.keys(snapshot).every(
            (key) =>
                key === 'version' ||
                key === 'environment' ||
                SOURCE_GROUPS.some((group) => group === key),
        ),
        'source_snapshot accepts only source manifests and environment versions.',
    );
    const result = {version: 1};

    for (const group of SOURCE_GROUPS) {
        const rows = snapshot[group] ?? [];
        requireValue(Array.isArray(rows), `source_snapshot.${group} must be an array.`);
        const paths = new Set();

        result[group] = rows
            .map((row) => {
                requireValue(row && typeof row === 'object', 'Invalid source manifest entry.');
                const path = sourcePath(row.path);
                requireValue(!paths.has(path), `Duplicate ${group} source: ${path}`);
                requireValue(
                    Object.keys(row).every((key) => key === 'path' || key === 'sha256') &&
                        (row.sha256 === null ||
                            (typeof row.sha256 === 'string' && /^[a-f0-9]{64}$/.test(row.sha256))),
                    `Invalid SHA-256 entry: ${group}/${path}`,
                );
                paths.add(path);

                return {path, sha256: row.sha256};
            })
            .sort(comparePaths);
    }

    requireValue(
        result.documentation.length + result.product.length > 0,
        'A source snapshot requires documentation or product files.',
    );
    result.environment = versionTokens(snapshot.environment ?? {});

    return result;
}

function inside(root, path) {
    const local = relative(root, path);
    requireValue(
        !isAbsolute(local) && local !== '..' && !local.startsWith(`..${sep}`),
        'Source files and symlinks must stay inside their declared root.',
    );
}

function rejectDangling(path) {
    try {
        requireValue(
            !lstatSync(path).isSymbolicLink(),
            'Dangling source symlinks cannot identify deleted files.',
        );
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

function fingerprint(root, path) {
    const absolute = resolve(root, sourcePath(path));
    inside(root, absolute);
    let canonical;

    try {
        canonical = realpathSync(absolute);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }

        rejectDangling(absolute);
        let parent = dirname(absolute);

        while (parent !== root) {
            try {
                inside(root, realpathSync(parent));

                return {path, sha256: null};
            } catch (parentError) {
                if (parentError.code !== 'ENOENT') {
                    throw parentError;
                }

                rejectDangling(parent);
            }

            parent = dirname(parent);
        }

        return {path, sha256: null};
    }

    inside(root, canonical);
    requireValue(statSync(canonical).isFile(), `Source must be a regular file: ${path}`);

    return {path, sha256: createHash('sha256').update(readFileSync(canonical)).digest('hex')};
}

export function captureSnapshot(manifest, roots) {
    requireValue(
        manifest &&
            typeof manifest === 'object' &&
            !Array.isArray(manifest) &&
            Object.keys(manifest).every(
                (key) => key === 'environment' || SOURCE_GROUPS.some((group) => group === key),
            ),
        'Source manifest accepts documentation, product, external and environment only.',
    );
    versionTokens(manifest.environment === undefined ? {} : manifest.environment);
    const snapshot = {
        version: 1,
        environment: {...manifest.environment, node: process.versions.node},
    };

    for (const group of SOURCE_GROUPS) {
        const paths = manifest[group] ?? [];
        requireValue(Array.isArray(paths), `${group} source manifest must be an array.`);
        const root = realpathSync(roots[group] ?? process.cwd());
        requireValue(statSync(root).isDirectory(), `Invalid ${group} source root.`);
        snapshot[group] = paths.map((path) => fingerprint(root, path));
    }

    return validateSnapshot(snapshot);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const {values, positionals} = parseArgs({
            allowPositionals: true,
            options: {
                help: {type: 'boolean'},
                manifest: {type: 'string'},
                root: {type: 'string', default: '.'},
                'product-root': {type: 'string'},
                'external-root': {type: 'string'},
            },
        });

        if (values.help) {
            console.log(
                'Usage: node sources.mjs ledger.json --manifest sources.json [--root .] [--product-root .] [--external-root .]',
            );
        } else {
            requireValue(
                positionals.length === 1 && values.manifest,
                'Provide ledger.json and --manifest sources.json.',
            );
            const data = loadJson(positionals[0]);
            const manifest = loadJson(values.manifest);
            data.source_snapshot = captureSnapshot(manifest, {
                documentation: values.root,
                product: values['product-root'] ?? values.root,
                external: values['external-root'] ?? values.root,
            });
            process.stdout.write(JSON.stringify(data, null, 2) + '\n');
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
