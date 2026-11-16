import {compareText, ledgerHash, normalizedUnit, roundScore} from './measure.mjs';
import {SOURCE_GROUPS, requireValue, sourcePath, validateSnapshot} from './sources.mjs';

const sorted = (rows) => [...rows].sort((a, b) => compareText(a.id, b.id));

function dependencies(row, snapshot) {
    const declared = row.dependencies;

    if (declared === undefined) {
        return Object.fromEntries(SOURCE_GROUPS.map((group) => [group, ['*']]));
    }

    requireValue(
        declared &&
            typeof declared === 'object' &&
            !Array.isArray(declared) &&
            Object.keys(declared).every((group) => SOURCE_GROUPS.some((known) => known === group)),
        `${row.id}: dependencies must name source namespaces.`,
    );

    const result = {};
    let count = 0;

    for (const group of SOURCE_GROUPS) {
        const paths = declared[group] ?? [];

        requireValue(Array.isArray(paths), `${row.id}: dependency paths must be arrays.`);
        requireValue(new Set(paths).size === paths.length, `${row.id}: duplicate dependencies.`);

        if (paths.includes('*')) {
            requireValue(paths.length === 1, `${row.id}: wildcard must be the only dependency.`);
        } else {
            const known = new Set(snapshot[group].map(({path}) => path));

            for (const path of paths) {
                sourcePath(path);
                requireValue(
                    known.has(path),
                    `${row.id}: dependency absent from snapshot: ${group}/${path}`,
                );
            }
        }

        count += paths.includes('*') ? snapshot[group].length : paths.length;
        result[group] = [...paths].sort(compareText);
    }

    requireValue(count > 0, `${row.id}: explicit dependencies cannot be empty.`);

    return result;
}

function inputHash(declared, snapshot, groups = SOURCE_GROUPS, includeEnvironment = true) {
    const selected = includeEnvironment ? {environment: snapshot.environment} : {};

    for (const group of groups) {
        const paths = declared[group] ?? [];
        const known = new Map(snapshot[group].map((row) => [row.path, row.sha256]));

        selected[group] = paths.includes('*')
            ? snapshot[group]
            : paths.map((path) => ({path, sha256: known.get(path) ?? null}));
    }

    return ledgerHash(selected);
}

function makeCheck(kind, row, snapshot, definition, result) {
    let declared = dependencies(row, snapshot);
    let origin;

    if (kind === 'link' || kind === 'example') {
        requireValue(
            row.origin,
            `${kind} ${row.id}: explicit source origin dependencies are required.`,
        );
        origin = dependencies({id: row.id, dependencies: row.origin}, snapshot);
        declared = Object.fromEntries(
            SOURCE_GROUPS.map((group) => {
                const paths = [...new Set([...declared[group], ...origin[group]])];

                return [
                    group,
                    paths.some((path) => path === '*') ? ['*'] : paths.sort(compareText),
                ];
            }),
        );
    }

    return {
        kind,
        dependencies: declared,
        inputs_hash: inputHash(declared, snapshot),
        definition_hash: ledgerHash(definition),
        result_hash: ledgerHash(result),
        ...(origin ? {origin} : {}),
    };
}

function method(protocol) {
    if (!protocol) {
        return null;
    }

    return Object.fromEntries(
        ['algorithm', 'k1', 'b', 'tokenizer', 'chunk_tokens', 'budgets'].map((key) => [
            key,
            protocol[key],
        ]),
    );
}

function measurementResults(measurements) {
    return Object.fromEntries(
        Object.entries(measurements).map(([name, row]) => [
            name,
            name === 'TTC'
                ? {
                      status: row.status,
                      tokenizer: row.tokenizer,
                      samples: sorted(
                          row.samples.map((sample) => ({...sample, id: sample.fact_id})),
                      ),
                  }
                : {
                      status: row.status,
                      numerator: row.numerator,
                      denominator: row.denominator,
                      eligible: row.eligible,
                  },
        ]),
    );
}

export function buildReproducibility(data, measurements, protocol) {
    const legacy = {
        version: 'audit-profile-legacy',
        guarded: false,
        inventory_hash: ledgerHash({scope: data.scope, facts: data.facts.map(({id}) => id)}),
    };

    return data.source_snapshot ? buildGuardedProfile(data, measurements, protocol) : legacy;
}

function buildGuardedProfile(data, measurements, protocol) {
    const snapshot = validateSnapshot(data.source_snapshot);
    const documents = new Map(snapshot.documentation.map((row) => [row.path, row.sha256]));
    const corpus = [...(data.corpus ?? [])].sort(compareText);

    for (const path of corpus) {
        requireValue(documents.has(path), `Corpus file absent from source_snapshot: ${path}`);
    }

    for (const row of protocol?.files ?? []) {
        requireValue(
            documents.get(row.path) === row.sha256,
            `Retrieval uses a different source file: ${row.path}`,
        );
    }

    const checks = {};
    const units = new Set();

    for (const row of data.facts) {
        const key = normalizedUnit(row);

        requireValue(!units.has(key), `Duplicate normalized fact unit: ${row.id}`);
        units.add(key);
        checks[`fact:${row.id}`] = makeCheck(
            'fact',
            row,
            snapshot,
            {
                unit: row.unit,
                statement: row.statement,
                condition: row.condition,
                expected: row.expected ?? true,
                query: row.query ?? null,
            },
            {
                status: row.status,
                gold: [...(row.gold ?? [])].sort((a, b) =>
                    compareText(ledgerHash(a), ledgerHash(b)),
                ),
                claim_candidate:
                    ['UNKNOWN', 'AMBIGUOUS'].includes(row.status) && row.documentation.length > 0,
            },
        );
    }

    for (const row of data.examples ?? []) {
        checks[`example:${row.id}`] = makeCheck(
            'example',
            row,
            snapshot,
            {source: row.source ?? null},
            {status: row.status},
        );
    }

    for (const row of data.links ?? []) {
        checks[`link:${row.id}`] = makeCheck(
            'link',
            row,
            snapshot,
            {source: row.source, target: row.target, promise: row.promise},
            {status: row.status, semantic: row.semantic?.status},
        );
    }

    const measured = measurementResults(measurements);

    checks.retrieval = makeCheck(
        'retrieval',
        {id: 'retrieval'},
        snapshot,
        {method: method(protocol)},
        {recall: measured['Recall@4000'], ttc: measured.TTC},
    );

    const inventoryHash = ledgerHash({
        scope: data.scope,
        facts: sorted(
            data.facts
                .filter((row) => row.expected !== false)
                .map((row) => ({
                    id: row.id,
                    unit: row.unit,
                    query: row.query ?? null,
                })),
        ),
        method: method(protocol),
    });

    return {
        version: 'audit-profile-v2',
        guarded: true,
        inventory_hash: inventoryHash,
        snapshot_hash: ledgerHash({inventory_hash: inventoryHash, sources: snapshot}),
        sources: snapshot,
        corpus,
        checks,
        measurement_hash: ledgerHash(measured),
        verdict_hash: ledgerHash(
            Object.fromEntries(
                Object.entries(checks)
                    .filter(([key]) => key !== 'retrieval')
                    .map(([key, row]) => [key, row.result_hash]),
            ),
        ),
    };
}

function changed(check, previous, current, groups = SOURCE_GROUPS, origin = false) {
    const declared = origin ? check.origin : check.dependencies;

    return (
        inputHash(declared, previous, groups, !origin) !==
        inputHash(declared, current, groups, !origin)
    );
}

export function checkBaseline(result, baseline) {
    if (result.assessment === null) {
        return;
    }

    const current = result.profile;
    const previous = baseline.profile;

    requireValue(
        current?.guarded && previous?.guarded,
        'Protected replay requires source_snapshot and normalized units; migrate legacy arithmetic with --recalibrate.',
    );
    validateSnapshot(current.sources);
    validateSnapshot(previous.sources);
    requireValue(
        baseline.assessment?.scoring_version === result.assessment.scoring_version &&
            previous.version === current.version &&
            previous.inventory_hash === current.inventory_hash,
        'Audit profile changed; reuse the saved required units/queries or explicitly --recalibrate.',
    );

    for (const group of SOURCE_GROUPS) {
        requireValue(
            ledgerHash(previous.sources[group].map(({path}) => path)) ===
                ledgerHash(current.sources[group].map(({path}) => path)),
            `Source manifest scope changed for ${group}; retain deleted paths as null or explicitly --recalibrate.`,
        );
    }

    requireValue(
        ledgerHash(Object.keys(previous.sources.environment).sort(compareText)) ===
            ledgerHash(Object.keys(current.sources.environment).sort(compareText)),
        'Environment manifest scope changed; reuse declared version inputs or explicitly --recalibrate.',
    );

    const documentsBefore = new Map(
        previous.sources.documentation.map((row) => [row.path, row.sha256]),
    );
    const documentsAfter = new Map(
        current.sources.documentation.map((row) => [row.path, row.sha256]),
    );
    const before = new Set(previous.corpus);
    const after = new Set(current.corpus);

    for (const path of new Set([...before, ...after])) {
        if (before.has(path) !== after.has(path)) {
            requireValue(
                before.has(path)
                    ? documentsAfter.get(path) === null
                    : documentsBefore.get(path) === null,
                `Retrieval scope changed without a source addition or deletion: ${path}`,
            );
        }
    }

    for (const key of new Set([...Object.keys(previous.checks), ...Object.keys(current.checks)])) {
        checkOne(key, previous.checks[key], current.checks[key], previous.sources, current.sources);
    }

    requireValue(
        previous.measurement_hash !== current.measurement_hash ||
            (roundScore(baseline.assessment.dqs) === roundScore(result.assessment.dqs) &&
                baseline.assessment.tier === result.assessment.tier),
        'Identical measurements changed their score; declare a new scoring policy before acceptance.',
    );
}

function checkOne(key, old, next, previous, current) {
    if (!old || !next) {
        const record = old ?? next;
        const originChanged = record.origin
            ? changed(record, previous, current, SOURCE_GROUPS, true)
            : changed(record, previous, current);

        requireValue(originChanged, `${key}: unchanged origin cannot add or remove a check.`);

        return;
    }

    requireValue(
        ledgerHash(old.dependencies) === ledgerHash(next.dependencies) &&
            ledgerHash(old.origin ?? null) === ledgerHash(next.origin ?? null),
        `${key}: registered dependencies and origin changed; explicitly --recalibrate with evidence.`,
    );

    if (old.origin && old.definition_hash !== next.definition_hash) {
        requireValue(
            changed(old, previous, current, SOURCE_GROUPS, true),
            `${key}: the source definition changed without changed origin inputs.`,
        );
    }

    if (old.kind === 'fact' && old.definition_hash !== next.definition_hash) {
        requireValue(
            changed(old, previous, current, ['product']),
            `${key}: the product contract changed without changed product inputs.`,
        );
    }

    requireValue(
        changed(old, previous, current) ||
            (old.definition_hash === next.definition_hash && old.result_hash === next.result_hash),
        `${key}: unchanged inputs have different definitions, verdicts, gold or dependencies.`,
    );
}
