#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFileSync, realpathSync, statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {extname, isAbsolute, relative, resolve, sep} from 'node:path';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

import {compareText, loadJson} from './measure.mjs';

const digest = (text) => createHash('sha256').update(text).digest('hex');
const compact = (text) => String(text).replace(/\s+/g, ' ').trim().slice(0, 2000);

async function parserFor() {
    for (const from of [
        createRequire(resolve(process.cwd(), 'package.json')),
        createRequire(import.meta.url),
    ]) {
        let entry;

        try {
            entry = from.resolve('cheerio');
        } catch {
            continue;
        }

        const parser = await import(pathToFileURL(entry).href);

        if (typeof parser.load !== 'function') {
            throw new TypeError('The installed cheerio package must export load');
        }

        return {load: parser.load, entry, version: from('cheerio/package.json').version};
    }

    throw new Error(
        'Link inventory requires cheerio. Reuse an installed package or install cheerio@1.0.0 in the audit workspace with --ignore-scripts; no automatic install is performed.',
    );
}

function containedFile(root, path) {
    const file = realpathSync(resolve(root, path));
    const local = relative(root, file);

    if (isAbsolute(local) || local === '..' || local.startsWith(`..${sep}`)) {
        throw new Error('Build input leaves the declared root');
    }

    if (!statSync(file).isFile()) {
        throw new Error('Build input must be a regular file');
    }

    return file;
}

function pageFor(root, path, load) {
    const file = containedFile(root, path);
    const text = readFileSync(file, 'utf8');
    const shell = load(text);
    const state = shell('script#diplodoc-state').text();
    let content = text;

    if (state) {
        const decoded = state
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&amp;', '&');
        const data = JSON.parse(decoded).data;

        if (typeof data?.html !== 'string') {
            throw new TypeError(
                `No rendered article HTML in ${path}; use rendered static output or record a concrete inventory blocker`,
            );
        }

        content = data.html;
    }

    const $ = load(content);
    const anchors = new Set(
        $('[id], a[name]')
            .toArray()
            .flatMap((node) => [$(node).attr('id'), $(node).attr('name')])
            .filter(Boolean),
    );

    return {file, sha256: digest(text), $, anchors, base: shell('base[href]').attr('href')};
}

function localTarget(root, path) {
    const candidates = [path];

    if (!extname(path)) {
        candidates.push(`${path}.html`, `${path.replace(/\/$/, '')}/index.html`);
    }

    for (const candidate of candidates) {
        try {
            return {path: candidate, file: containedFile(root, candidate)};
        } catch (error) {
            if (
                !['ENOENT', 'ENOTDIR'].includes(error.code) &&
                error.message !== 'Build input must be a regular file'
            ) {
                throw error;
            }
        }
    }

    return null;
}

function checkTarget(root, target, base, pageURL, getPage) {
    const url = new URL(target, pageURL);

    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
        return {
            status: 'UNCHECKED',
            reason: 'Target is outside this build; no network request was made.',
        };
    }

    const path = decodeURIComponent(url.pathname.slice(base.pathname.length)) || 'index.html';
    const found = localTarget(root, path);

    if (!found) {
        return {
            status: 'BROKEN',
            evidence: `No target file or declared HTML route in the build: ${path}`,
        };
    }

    if (url.hash && !['.html', '.htm'].includes(extname(found.path))) {
        return {
            status: 'UNCHECKED',
            reason: 'The target exists, but this checker cannot verify fragments in a non-HTML document.',
        };
    }

    const anchor = decodeURIComponent(url.hash.slice(1));
    const hash = digest(readFileSync(found.file));
    const extra = {resolved_target: found.path + url.hash, target_sha256: hash};

    if (anchor && !getPage(found.path).anchors.has(anchor)) {
        return {
            ...extra,
            status: 'BROKEN',
            evidence: `Target exists but the rendered anchor is absent: ${anchor}`,
        };
    }

    return {
        ...extra,
        status: 'VALID',
        evidence: `Resolved a file${anchor ? ' and rendered anchor' : ''} within the declared build.`,
    };
}

function validatePages(input) {
    if (
        !Array.isArray(input.pages) ||
        !input.pages.length ||
        input.pages.some((path) => typeof path !== 'string' || !path.trim())
    ) {
        throw new Error('Provide a nonempty pages array of build-relative HTML paths');
    }

    if (new Set(input.pages).size !== input.pages.length) {
        throw new Error('Duplicate source pages are not allowed');
    }

    for (const path of input.pages) {
        if (
            isAbsolute(path) ||
            path.includes('\\') ||
            path.split('/').includes('..') ||
            !['.html', '.htm'].includes(extname(path).toLowerCase())
        ) {
            throw new Error(`Source pages must be build-relative HTML paths: ${path}`);
        }
    }
}

export async function collectLinks(input, root) {
    validatePages(input);

    const parser = await parserFor();
    const directory = realpathSync(root);
    const base = new URL(input.base_url ?? 'https://audit.invalid/__build__/');

    if (
        !['https:', 'http:'].includes(base.protocol) ||
        !base.pathname.endsWith('/') ||
        base.search ||
        base.hash
    ) {
        throw new Error(
            'base_url must be an HTTP(S) publication root ending with /, without a query or fragment',
        );
    }

    const cache = new Map();
    const getPage = (path) => {
        if (!cache.has(path)) {
            cache.set(path, pageFor(directory, path, parser.load));
        }

        return cache.get(path);
    };
    const links = [];
    const excluded = [];
    const pages = [];
    const seenPages = new Set();

    for (const path of [...input.pages].sort(compareText)) {
        const page = getPage(path);

        if (seenPages.has(page.file)) {
            throw new Error(`Source pages alias the same file: ${path}`);
        }

        seenPages.add(page.file);
        const pageURL = new URL(path.split('/').map(encodeURIComponent).join('/'), base);
        const effectiveURL = page.base ? new URL(page.base, pageURL) : pageURL;
        const occurrences = page.$('a[href]').not('.yfm-anchor[aria-hidden="true"]').toArray();
        pages.push({path, sha256: page.sha256, occurrences: occurrences.length});

        for (const [index, node] of occurrences.entries()) {
            const element = page.$(node);
            const target = element.attr('href');
            const source = `${path}:link-${index + 1}`;

            if (/^(?:mailto|tel):/i.test(target)) {
                excluded.push({
                    source,
                    target,
                    reason: 'Contact URI, outside the document-link inventory.',
                });
                continue;
            }

            const text = compact(
                element.text() ||
                    element.attr('aria-label') ||
                    element.find('img').attr('alt') ||
                    '',
            );
            const context = compact(element.closest('p, li, td, dd, figcaption').text() || text);
            let checked;

            try {
                checked = checkTarget(directory, target, base, effectiveURL, getPage);
            } catch (error) {
                checked = {
                    status: 'UNCHECKED',
                    reason: `Target was not inspected: ${error.message}`,
                };
            }

            links.push({
                id: 'link-' + digest(`${path}\0${index}\0${target}`).slice(0, 20),
                source,
                target,
                link_text: text,
                promise: context,
                source_sha256: page.sha256,
                ...checked,
                semantic: {
                    status: 'UNKNOWN',
                    reason: 'Compare the source promise with the actual target content; technical success does not establish relevance.',
                },
            });
        }
    }

    return {
        schema_version: 1,
        protocol: {
            root: directory,
            base_url: base.href,
            parser: 'cheerio',
            parser_version: parser.version,
            parser_entry: parser.entry,
            sources: 'Explicit built HTML pages; Diplodoc embedded article HTML when present',
            unit: 'Reader-visible link occurrence; hidden YFM permalinks and contact URIs excluded',
            local_routes:
                'Exact file, then .html and /index.html for extensionless paths; no network calls',
        },
        pages,
        discovered: links.length,
        checked: links.filter((row) => ['VALID', 'BROKEN'].includes(row.status)).length,
        links,
        excluded,
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const {values, positionals} = parseArgs({
            allowPositionals: true,
            options: {help: {type: 'boolean'}, check: {type: 'boolean'}, root: {type: 'string'}},
        });

        if (values.help) {
            console.log(
                'Usage: node links.mjs pages.json --root /build/root | node links.mjs --check',
            );
        } else if (values.check) {
            const parser = await parserFor();
            console.log(
                JSON.stringify({
                    ready: true,
                    parser: 'cheerio',
                    version: parser.version,
                    entry: parser.entry,
                }),
            );
        } else {
            if (positionals.length !== 1 || !values.root) {
                throw new Error('Provide one pages.json path and --root; see --help');
            }

            const result = await collectLinks(loadJson(positionals[0]), values.root);
            process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
