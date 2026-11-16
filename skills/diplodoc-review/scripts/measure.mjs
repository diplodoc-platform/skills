#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

const STATUSES = ['CORRECT', 'MISSING', 'CONTRADICTED', 'AMBIGUOUS', 'UNKNOWN'];
const KINDS = ['literal', 'schema', 'test', 'runtime', 'manual'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

const requireValue = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;

const priorityRank = (finding) => {
    const rank = PRIORITIES.indexOf(finding.priority ?? 'medium');

    requireValue(rank >= 0, `Unknown finding priority: ${finding.priority}`);

    return rank;
};

const prioritize = (findings) => {
    for (const finding of findings) {
        priorityRank(finding);
    }

    return [...findings].sort((a, b) => priorityRank(a) - priorityRank(b));
};

export function ledgerHash(data) {
    const canonical = (value) =>
        Array.isArray(value)
            ? value.map(canonical)
            : value && typeof value === 'object'
              ? Object.fromEntries(
                    Object.keys(value)
                        .sort()
                        .map((key) => [key, canonical(value[key])]),
                )
              : value;

    return createHash('sha256')
        .update(JSON.stringify(canonical(data)))
        .digest('hex');
}

export function searchHash(data) {
    return ledgerHash({
        revisions: data.revisions ?? {},
        corpus: [...(data.corpus ?? [])].sort(),
        facts: data.facts
            .filter((row) => ['CORRECT', 'CONTRADICTED'].includes(row.status))
            .map(({id, query, gold}) => ({id, query, gold}))
            .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    });
}

export function ratio(numerator, denominator) {
    return {
        value: denominator ? numerator / denominator : null,
        numerator,
        denominator,
        status: denominator ? 'measured' : 'not_measured',
    };
}

export function retrievalSummary(results, budgets) {
    const recall = (subset) =>
        Object.fromEntries(
            budgets.map((budget) => [
                String(budget),
                ratio(
                    subset.filter((row) => row.ttc !== null && row.ttc <= budget).length,
                    subset.length,
                ),
            ]),
        );

    const correct = results.filter((row) => row.status === 'CORRECT');
    const found = correct
        .flatMap((row) => (row.ttc === null ? [] : [row.ttc]))
        .sort((a, b) => a - b);

    const quantile = (p) => (found.length ? found[Math.ceil(p * found.length) - 1] : null);

    const median = found.length
        ? (found[Math.floor((found.length - 1) / 2)] + found[Math.floor(found.length / 2)]) / 2
        : null;

    return {
        metrics: Object.fromEntries(
            Object.entries(recall(results)).map(([budget, metric]) => [`Recall@${budget}`, metric]),
        ),
        correct_only_recall: recall(correct),
        ttc: {
            eligible: correct.length,
            found: found.length,
            censored: correct.length - found.length,
            budget: budgets.at(-1),
            median_found: median,
            p10_found: quantile(0.1),
            p25_found: quantile(0.25),
            p75_found: quantile(0.75),
            p90_found: quantile(0.9),
            min_found: found.at(0) ?? null,
            max_found: found.at(-1) ?? null,
            interpretation:
                'Conditional distribution among found correct facts; censored cases have no substituted cost',
        },
    };
}

function validateRetrieval(data, retrieval) {
    const budgets = retrieval.protocol?.budgets;

    requireValue(
        Array.isArray(budgets) &&
            budgets.length &&
            budgets.every(
                (value, index) =>
                    Number.isSafeInteger(value) &&
                    value > 0 &&
                    (!index || value > budgets[index - 1]),
            ),
        'Invalid retrieval budgets',
    );
    uniqueRows(retrieval.results, 'retrieval results');

    const eligible = new Map(
        data.facts
            .filter((row) => ['CORRECT', 'CONTRADICTED'].includes(row.status))
            .map((row) => [row.id, row]),
    );

    requireValue(
        retrieval.results.length === eligible.size,
        'Retrieval results do not cover the eligible fact IDs',
    );

    for (const row of retrieval.results) {
        const fact = eligible.get(row.id);

        requireValue(
            fact && ['CORRECT', 'CONTRADICTED'].includes(row.status) && row.query === fact.query,
            `Retrieval fact mismatch: ${row.id}`,
        );
        requireValue(
            row.ttc === null ||
                (Number.isSafeInteger(row.ttc) && row.ttc > 0 && row.ttc <= budgets.at(-1)),
            `Invalid TTC: ${row.id}`,
        );
        requireValue(
            row.censored === (row.ttc === null) &&
                (row.ttc === null
                    ? row.rank === null
                    : Number.isSafeInteger(row.rank) && row.rank > 0),
            `Invalid retrieval censoring/rank: ${row.id}`,
        );
    }

    const expected = retrievalSummary(retrieval.results, budgets);

    for (const key of ['metrics', 'correct_only_recall', 'ttc']) {
        requireValue(
            ledgerHash(retrieval[key]) === ledgerHash(expected[key]),
            `Retrieval ${key} disagrees with its raw observations`,
        );
    }
}

function uniqueRows(rows, label) {
    requireValue(Array.isArray(rows), `${label} must be an array`);

    const seen = new Set();

    for (const row of rows) {
        requireValue(row && nonempty(row.id), `${label}: every row needs an id`);
        requireValue(!seen.has(row.id), `${label}: duplicate id ${row.id}`);
        seen.add(row.id);
    }
}

export function validateLedger(data) {
    requireValue(data?.schema_version === 1, 'schema_version must be 1');
    requireValue(nonempty(data.scope), 'scope must describe the inspected sample');
    uniqueRows(data.facts, 'facts');

    for (const row of data.facts) {
        const name = `fact ${row.id}`;

        requireValue(STATUSES.includes(row.status), `${name}: unknown status`);
        requireValue(
            row.priority === undefined || PRIORITIES.includes(row.priority),
            `${name}: priority must be critical, high, medium or low`,
        );
        requireValue(
            nonempty(row.statement) && nonempty(row.area),
            `${name}: statement and area are required`,
        );
        requireValue(typeof row.condition === 'boolean', `${name}: condition must be boolean`);
        requireValue(
            row.expected === undefined || typeof row.expected === 'boolean',
            `${name}: expected must be boolean`,
        );
        requireValue(
            KINDS.includes(row.verification?.kind) && nonempty(row.verification?.evidence),
            `${name}: verification kind and evidence are required`,
        );

        if (row.status !== 'UNKNOWN') {
            requireValue(nonempty(row.product), `${name}: product source is required`);
        }

        requireValue(
            Array.isArray(row.documentation) && row.documentation.every(nonempty),
            `${name}: documentation must be an array of locations`,
        );

        if (['CORRECT', 'CONTRADICTED', 'AMBIGUOUS'].includes(row.status)) {
            requireValue(
                row.documentation.length > 0,
                `${name}: documented claims need a location`,
            );
        }
    }

    for (const [name, known, measured] of [
        ['examples', ['PASS', 'FAIL', 'NOT_TESTABLE', 'NOT_TESTED'], ['PASS', 'FAIL']],
        ['links', ['VALID', 'BROKEN', 'UNCHECKED', 'RESTRICTED'], ['VALID', 'BROKEN']],
    ]) {
        uniqueRows(data[name] ?? [], name);

        for (const row of data[name] ?? []) {
            requireValue(known.includes(row.status), `${name} ${row.id}: unknown status`);
            requireValue(
                nonempty(measured.includes(row.status) ? row.evidence : row.reason),
                `${name} ${row.id}: evidence or exclusion reason is required`,
            );

            if (name === 'links' && row.semantic !== undefined) {
                const semantic = row.semantic;
                requireValue(
                    ['RELEVANT', 'IRRELEVANT', 'UNKNOWN', 'NOT_APPLICABLE'].includes(
                        semantic?.status,
                    ),
                    `link ${row.id}: invalid semantic status`,
                );

                if (['RELEVANT', 'IRRELEVANT'].includes(semantic.status)) {
                    requireValue(
                        row.status === 'VALID',
                        `link ${row.id}: semantic labels need an accessible VALID target`,
                    );
                    requireValue(
                        nonempty(row.source) && nonempty(row.target) && nonempty(row.promise),
                        `link ${row.id}: semantic labels need source, target and promise`,
                    );
                    requireValue(
                        nonempty(semantic.evidence),
                        `link ${row.id}: semantic target evidence is required`,
                    );
                } else {
                    requireValue(
                        nonempty(semantic.reason),
                        `link ${row.id}: semantic exclusion reason is required`,
                    );
                }
            }
        }
    }

    return data;
}

export function loadLedger(path) {
    return validateLedger(JSON.parse(readFileSync(path, 'utf8')));
}

export function summarize(input, retrieval) {
    const data = validateLedger(input);
    const hash = ledgerHash(data);

    if (retrieval) {
        requireValue(
            retrieval.search_sha256
                ? retrieval.search_sha256 === searchHash(data)
                : retrieval.ledger_sha256 === hash,
            'Retrieval evidence belongs to a different ledger/search input; rerun search after query, gold or corpus changes',
        );
    }

    const verified = data.facts.filter((row) => row.status !== 'UNKNOWN');
    const expected = verified.filter((row) => row.expected !== false);
    const documented = verified.filter((row) => ['CORRECT', 'CONTRADICTED'].includes(row.status));
    const conditions = expected.filter((row) => row.condition);
    const counts = Object.fromEntries(
        STATUSES.map((status) => [
            status,
            data.facts.filter((row) => row.status === status).length,
        ]),
    );
    const annotationKinds = Object.fromEntries(
        KINDS.map((kind) => [
            kind,
            data.facts.filter((row) => row.verification.kind === kind).length,
        ]),
    );
    const examples = data.examples ?? [];
    const links = data.links ?? [];
    const tested = examples.filter((row) => ['PASS', 'FAIL'].includes(row.status));
    const checked = links.filter((row) => ['VALID', 'BROKEN'].includes(row.status));
    const semantic = links.filter((row) =>
        ['RELEVANT', 'IRRELEVANT'].includes(row.semantic?.status),
    );
    const metrics = {
        FCR: ratio(expected.filter((row) => row.status === 'CORRECT').length, expected.length),
        ERR: ratio(
            documented.filter((row) => row.status === 'CONTRADICTED').length,
            documented.length,
        ),
        CCR: ratio(conditions.filter((row) => row.status === 'CORRECT').length, conditions.length),
        EPR: ratio(tested.filter((row) => row.status === 'PASS').length, tested.length),
        LHR: ratio(checked.filter((row) => row.status === 'VALID').length, checked.length),
        'LHR-T': ratio(checked.filter((row) => row.status === 'VALID').length, checked.length),
        'LHR-S': ratio(
            semantic.filter((row) => row.semantic.status === 'RELEVANT').length,
            semantic.length,
        ),
    };

    if (retrieval) {
        requireValue(
            retrieval.metrics && retrieval.ttc && retrieval.protocol,
            'Incomplete retrieval evidence',
        );

        for (const [name, value] of Object.entries(retrieval.metrics)) {
            requireValue(/^Recall@[1-9]\d*$/.test(name), `Unexpected retrieval metric: ${name}`);
            requireValue(
                Number.isSafeInteger(value.numerator) &&
                    Number.isSafeInteger(value.denominator) &&
                    value.numerator >= 0 &&
                    value.denominator >= value.numerator,
                `Invalid counts for ${name}`,
            );
            requireValue(
                value.value === (value.denominator ? value.numerator / value.denominator : null),
                `Invalid ratio for ${name}`,
            );
            metrics[name] = value;
        }

        validateRetrieval(data, retrieval);

        const statuses = new Map(data.facts.map((row) => [row.id, row.status]));

        retrieval = {
            ...retrieval,
            ...retrievalSummary(
                retrieval.results.map((row) => ({...row, status: statuses.get(row.id)})),
                retrieval.protocol.budgets,
            ),
        };
    }

    const groups = new Map();

    for (const row of data.facts.filter((row) =>
        ['CONTRADICTED', 'MISSING', 'AMBIGUOUS'].includes(row.status),
    )) {
        const key = row.problem_id || row.id;

        if (!groups.has(key) || priorityRank(row) < priorityRank(groups.get(key))) {
            groups.set(key, {
                id: key,
                priority: row.priority ?? 'medium',
                status: row.status,
                statement: row.statement,
                product: row.product,
                documentation: row.documentation,
                recommendation: row.recommendation,
            });
        }
    }

    return {
        schema_version: 1,
        ledger_sha256: hash,
        scope: data.scope,
        revisions: data.revisions ?? {},
        unit: 'Normalized public facts; additional documented claims can set expected=false',
        metrics,
        counts,
        annotation_kinds: annotationKinds,
        coverage: {
            examples: {checked: tested.length, discovered: examples.length},
            links: {checked: checked.length, discovered: links.length},
            semantic_links: {
                checked: semantic.length,
                discovered: links.filter((row) => row.semantic?.status !== 'NOT_APPLICABLE').length,
            },
        },
        retrieval: retrieval
            ? {
                  protocol: retrieval.protocol,
                  correct_only_recall: retrieval.correct_only_recall,
                  ttc: retrieval.ttc,
              }
            : null,
        findings: prioritize([...groups.values()]),
        limitation:
            'Arithmetic is deterministic given supplied annotations. This script does not establish their truth, necessity, completeness, or causal effect on agents.',
    };
}

const escapeCell = (value) =>
    String(value ?? '')
        .replaceAll('|', '\\|')
        .replace(/\s+/g, ' ')
        .trim();

export function renderMarkdown(result, maxFindings = 5) {
    requireValue(
        Number.isInteger(maxFindings) && maxFindings >= 0,
        'max-findings must be a nonnegative integer',
    );

    const lines = [
        '# Documentation audit',
        '',
        `Scope: ${escapeCell(result.scope)}`,
        '',
        '| Metric | Result | Basis |',
        '| --- | --- | --- |',
    ];
    const recallNames = Object.keys(result.metrics)
        .filter((name) => name.startsWith('Recall@'))
        .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));

    for (const name of [
        'FCR',
        'ERR',
        'CCR',
        ...(recallNames.length ? recallNames : ['Recall@2000', 'Recall@4000', 'Recall@8000']),
        'TTC',
        'EPR',
        'LHR-T',
        'LHR-S',
    ]) {
        if (name === 'TTC') {
            const ttc = result.retrieval?.ttc;

            lines.push(
                `| TTC | ${ttc?.median_found == null ? 'N/A' : ttc.median_found} | ${ttc ? `Median among ${ttc.found} found; ${ttc.censored} censored at ${ttc.budget}; ${escapeCell(result.retrieval.protocol.tokenizer)}` : 'Retrieval not measured'} |`,
            );
            continue;
        }

        const metric = result.metrics[name];

        lines.push(
            `| ${name} | ${metric?.value == null ? 'N/A' : `${(100 * metric.value).toFixed(2)}%`} | ${metric ? `${metric.numerator}/${metric.denominator}` : 'Retrieval not measured'} |`,
        );

        if (name.startsWith('Recall@')) {
            const correct = result.retrieval?.correct_only_recall?.[name.slice(7)];

            if (correct) {
                lines.push(
                    `| Correct-only ${name} | ${correct.value == null ? 'N/A' : `${(100 * correct.value).toFixed(2)}%`} | ${correct.numerator}/${correct.denominator} |`,
                );
            }
        }
    }

    lines.push(
        '',
        `Execution coverage: ${result.coverage.examples.checked}/${result.coverage.examples.discovered} examples; technical-link coverage: ${result.coverage.links.checked}/${result.coverage.links.discovered}; semantic-link coverage: ${result.coverage.semantic_links.checked}/${result.coverage.semantic_links.discovered} applicable occurrences. Ambiguous: ${result.counts.AMBIGUOUS}; unknown: ${result.counts.UNKNOWN}.`,
    );

    const selected = prioritize(result.findings).slice(0, maxFindings);

    if (selected.length) {
        lines.push('', `Findings shown: ${selected.length}/${result.findings.length}.`);

        for (const item of selected) {
            lines.push(
                '',
                `- **${escapeCell(item.id)} (${item.priority ?? 'medium'}; ${item.status})**: ${escapeCell(item.statement)} Sources: ${escapeCell(item.documentation.join(', ') || 'coverage gap')}; ${escapeCell(item.product)}.${item.recommendation ? ` ${escapeCell(item.recommendation)}` : ''}`,
            );
        }
    }

    lines.push('', result.limitation);

    return lines.join('\n') + '\n';
}

export function renderReport(data, retrieval, maxFindings = 5) {
    const result = summarize(data, retrieval);
    const compact = renderMarkdown(result, 0).trimEnd().split('\n');
    const metrics = compact.slice(
        compact.findIndex((line) => line.startsWith('| Metric')),
        -2,
    );
    const lines = [
        '# Documentation audit',
        '',
        '## 1. Scope',
        '',
        data.scope,
        '',
        `Revisions: ${JSON.stringify(result.revisions)}. Ledger SHA-256: ${result.ledger_sha256}.`,
        '',
        '## 2. Metrics',
        '',
        ...metrics,
        '',
        '## 3. Functional areas',
        '',
        '| Area | Correct | Missing | Contradicted | Ambiguous | Unknown |',
        '| --- | --- | --- | --- | --- | --- |',
    ];

    for (const area of [...new Set(data.facts.map((row) => row.area))].sort()) {
        lines.push(
            `| ${escapeCell(area)} | ${STATUSES.map((status) => data.facts.filter((row) => row.area === area && row.status === status).length).join(' | ')} |`,
        );
    }

    lines.push(
        '',
        '## 4. Problems',
        '',
        `Showing ${Math.min(maxFindings, result.findings.length)}/${result.findings.length} groups; the appendix retains every fact and observation.`,
    );

    for (const item of result.findings.slice(0, maxFindings)) {
        const members = data.facts.filter((row) => (row.problem_id || row.id) === item.id);

        lines.push(
            '',
            `- **${escapeCell(item.id)} (${item.priority}; ${item.status})**: ${escapeCell(item.statement)}`,
        );

        for (const row of members) {
            lines.push(
                `  - ${escapeCell(row.id)}: ${escapeCell(row.documentation.join(', ') || 'coverage gap')}; ${escapeCell(row.product)}. ${escapeCell(row.verification.kind)}: ${escapeCell(row.verification.evidence)}${row.recommendation ? ` Correction: ${escapeCell(row.recommendation)}` : ''}`,
            );
        }
    }

    lines.push(
        '',
        '## 5. Method',
        '',
        'FCR = correct expected / verified expected; ERR = contradicted / (correct + contradicted) documented; CCR = correct expected conditions / verified expected conditions. UNKNOWN is excluded; AMBIGUOUS reduces coverage. EPR = passed / tested examples; LHR-T = valid / technically checked link occurrences; LHR-S = relevant / semantically checked applicable occurrences. Semantic labels require the source promise and target evidence. Exclusions remain in the coverage counts.',
        '',
        retrieval
            ? `Retrieval protocol: ${JSON.stringify(retrieval.protocol)}. TTC percentiles: ${JSON.stringify(result.retrieval.ttc)}.`
            : 'Recall and TTC were not measured.',
        '',
        'The appendix is a machine-readable replay input. Save its ledger and retrieval objects as JSON, then run measure.mjs ledger.json --retrieval retrieval.json --format report. Rechecking the observations requires the recorded source revisions and original product checks.',
        '',
        '## 6. Conclusions',
        '',
        `${result.counts.CONTRADICTED} contradicted, ${result.counts.MISSING} missing, ${result.counts.AMBIGUOUS} ambiguous and ${result.counts.UNKNOWN} unknown facts in the selected sample. These rates do not establish agent comprehension or whole-product quality.`,
        '',
        result.limitation,
        '',
        '## Replay appendix',
        '',
        '```json',
        JSON.stringify({ledger: data, retrieval: retrieval ?? null}),
        '```',
    );

    return lines.join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const {values, positionals} = parseArgs({
            allowPositionals: true,
            options: {
                help: {type: 'boolean'},
                retrieval: {type: 'string'},
                format: {type: 'string', default: 'json'},
                'max-findings': {type: 'string', default: '5'},
            },
        });

        if (values.help) {
            console.log(
                'Usage: node measure.mjs ledger.json [--retrieval retrieval.json] [--format json|markdown|report] [--max-findings 5]',
            );
        } else {
            requireValue(positionals.length === 1, 'Provide one ledger.json path; see --help');
            requireValue(
                ['json', 'markdown', 'report'].includes(values.format),
                'format must be json, markdown or report',
            );

            const data = loadLedger(positionals[0]);
            const retrieval = values.retrieval
                ? JSON.parse(readFileSync(values.retrieval, 'utf8'))
                : undefined;
            const result = summarize(data, retrieval);

            process.stdout.write(
                values.format === 'report'
                    ? renderReport(data, retrieval, Number(values['max-findings']))
                    : values.format === 'markdown'
                      ? renderMarkdown(result, Number(values['max-findings']))
                      : JSON.stringify(result, null, 2) + '\n',
            );
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
