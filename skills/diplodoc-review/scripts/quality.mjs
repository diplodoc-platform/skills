#!/usr/bin/env node
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

import {loadJson, loadLedger, summarize} from './measure.mjs';

const WEIGHTS = {
    FCR: 20,
    ERR: 20,
    CCR: 15,
    'Recall@4000': 10,
    TTC: 10,
    EPR: 10,
    'LHR-T': 5,
    'LHR-S': 10,
};
const checkedLink = (row) => ['VALID', 'BROKEN'].includes(row.status);
const checkedSemantic = (row) => ['RELEVANT', 'IRRELEVANT'].includes(row.semantic?.status);
const excerpt = (value) =>
    String(value).length > 2000 ? String(value).slice(0, 1999) + '…' : String(value);

function selectEvidence(rows, limit) {
    const problem = (row) =>
        ['CONTRADICTED', 'MISSING', 'AMBIGUOUS', 'FAIL', 'BROKEN'].includes(row.status) ||
        row.semantic?.status === 'IRRELEVANT';

    return [...rows.filter(problem), ...rows.filter((row) => !problem(row))].slice(0, limit);
}

function evidenceFor(row) {
    if (row.verification) {
        return {
            source: excerpt(row.documentation[0] ?? row.product ?? row.id),
            expected: excerpt(row.statement),
            observed: excerpt(`${row.status}: ${row.verification.evidence}`),
        };
    }

    return {
        source: excerpt(row.source ?? row.id),
        expected: ['PASS', 'FAIL'].includes(row.status)
            ? 'The example produces its documented result.'
            : 'The target document and anchor are accessible.',
        observed: excerpt(row.evidence),
        ...(row.target ? {target: excerpt(row.target)} : {}),
    };
}

function rate(name, metric, rows, eligible, evidenceLimit, absentReason, inapplicable = false) {
    const measured = metric.denominator > 0;
    let status = inapplicable ? 'not_applicable' : 'not_measured';

    if (measured) {
        status = 'measured';
    }

    return {
        status,
        numerator: metric.numerator,
        denominator: metric.denominator,
        eligible,
        explanation: measured
            ? `${name}: ${metric.numerator}/${metric.denominator}; ${eligible - metric.denominator} unmeasured of ${eligible} inventoried items.`
            : absentReason,
        evidence: measured ? selectEvidence(rows, evidenceLimit).map(evidenceFor) : [],
    };
}

function penaltyFraction(name, value) {
    if (name === 'ERR') {
        return Math.min(1, value / 0.2);
    }

    if (name === 'TTC') {
        return Math.max(0, Math.min(1, (value - 1000) / 3000));
    }

    return 1 - value;
}

function tierFor(dqs) {
    if (dqs === null) {
        return null;
    }

    const tiers = [
        [95, 'S'],
        [85, 'A'],
        [70, 'B'],
        [55, 'C'],
    ];

    return tiers.find(([minimum]) => dqs >= minimum)?.[1] ?? 'D';
}

function assessQuality(measurements) {
    const metrics = {};

    for (const [name, weight] of Object.entries(WEIGHTS)) {
        const input = measurements[name];
        let value = input.status === 'measured' ? input.numerator / input.denominator : null;
        let counts = {
            numerator: input.numerator,
            denominator: input.denominator,
            eligible: input.eligible,
            unknown: input.eligible - input.denominator,
        };

        if (name === 'TTC') {
            const costs = input.samples
                .flatMap(({tokens}) => (tokens === null ? [] : [tokens]))
                .sort((a, b) => a - b);
            value = costs.length
                ? (costs[Math.floor((costs.length - 1) / 2)] +
                      costs[Math.floor(costs.length / 2)]) /
                  2
                : null;
            counts = {
                unit: 'tokens',
                budget: 4000,
                tokenizer: input.tokenizer,
                eligible: measurements['Recall@4000'].eligible,
                checked: input.samples.length,
                unknown: measurements['Recall@4000'].eligible - input.samples.length,
                found: costs.length,
                censored: input.samples.length - costs.length,
            };
        }

        metrics[name] = {
            status: input.status,
            value,
            ...counts,
            max_penalty: weight,
            penalty: value === null ? null : weight * penaltyFraction(name, value),
            explanation: input.explanation,
        };
    }

    const known = Object.values(metrics).filter(
        (metric) => metric.penalty !== null && metric.unknown === 0,
    );
    const measuredWeight = known.reduce((sum, metric) => sum + metric.max_penalty, 0);
    const maximum = Math.max(0, 100 - known.reduce((sum, metric) => sum + metric.penalty, 0));
    const dqs = measuredWeight === 100 ? maximum : null;

    return {
        scoring_version: 'dqs-v1',
        dqs,
        tier: tierFor(dqs),
        measured_weight: measuredWeight,
        score_range: {min: Math.max(0, maximum - (100 - measuredWeight)), max: maximum},
        metrics,
    };
}

export function prepareQuality(data, retrieval, evidenceLimit = 3) {
    if (!Number.isInteger(evidenceLimit) || evidenceLimit < 1 || evidenceLimit > 100) {
        throw new Error('evidence-limit must be an integer between 1 and 100');
    }

    const result = summarize(data, retrieval);
    const expected = data.facts.filter((row) => row.expected !== false);
    const verified = expected.filter((row) => row.status !== 'UNKNOWN');
    const conditions = expected.filter((row) => row.condition);
    const claims = data.facts.filter(
        (row) =>
            ['CORRECT', 'CONTRADICTED'].includes(row.status) ||
            (['UNKNOWN', 'AMBIGUOUS'].includes(row.status) && row.documentation.length > 0),
    );
    const documented = claims.filter((row) => ['CORRECT', 'CONTRADICTED'].includes(row.status));
    const examples = data.examples ?? [];
    const tested = examples.filter((row) => ['PASS', 'FAIL'].includes(row.status));
    const links = data.links ?? [];
    const technical = links.filter(checkedLink);
    const semanticEligible = links.filter((row) => row.semantic?.status !== 'NOT_APPLICABLE');
    const semantic = links.filter(checkedSemantic);
    const makeRate = (name, rows, eligible, reason, inapplicable = false) =>
        rate(name, result.metrics[name], rows, eligible, evidenceLimit, reason, inapplicable);
    const measurements = {
        FCR: makeRate('FCR', verified, expected.length, 'No verified required facts.'),
        ERR: makeRate('ERR', documented, claims.length, 'No verified documented claims.'),
        CCR: makeRate(
            'CCR',
            verified.filter((row) => row.condition),
            conditions.length,
            'No verified applicable conditions.',
            data.facts.length > 0 && conditions.length === 0,
        ),
        EPR: makeRate(
            'EPR',
            tested,
            examples.length,
            'Examples were not executed or no inventory was supplied.',
            Array.isArray(data.examples) && examples.length === 0,
        ),
        'LHR-T': makeRate(
            'LHR-T',
            technical,
            links.length,
            'Links were not technically checked or no inventory was supplied.',
            Array.isArray(data.links) && links.length === 0,
        ),
        'LHR-S': makeRate(
            'LHR-S',
            semantic,
            semanticEligible.length,
            'Source promises and target relevance were not checked.',
            Array.isArray(data.links) && semanticEligible.length === 0,
        ),
    };
    measurements['LHR-S'].evidence = selectEvidence(semantic, evidenceLimit).map((row) => ({
        source: excerpt(row.source),
        target: excerpt(row.target),
        expected: excerpt(row.promise),
        observed: excerpt(row.semantic.evidence),
    }));

    const correct = data.facts.filter((row) => row.status === 'CORRECT');
    const tokenizer = /^(cl100k_base|o200k_base)(?:\s|$)/.exec(
        String(result.retrieval?.protocol.tokenizer ?? ''),
    )?.[1];
    const supported = Boolean(tokenizer && result.retrieval.correct_only_recall['4000']);
    const searchReason =
        'Correct-only retrieval at 4000 BPE tokens was not measured; run retrieve.mjs with --budgets 4000 and a supported tokenizer.';
    const costs = new Map((retrieval?.results ?? []).map((row) => [row.id, row.ttc]));
    const samples = supported
        ? correct.map((row) => ({
              fact_id: row.id,
              tokens:
                  costs.get(row.id) !== null && costs.get(row.id) <= 4000
                      ? costs.get(row.id)
                      : null,
          }))
        : [];
    const found = samples.filter(({tokens}) => tokens !== null).length;
    const searchMetric = supported
        ? result.retrieval.correct_only_recall['4000']
        : {numerator: 0, denominator: 0};
    measurements['Recall@4000'] = rate(
        'Recall@4000',
        searchMetric,
        correct,
        correct.length,
        evidenceLimit,
        searchReason,
    );
    measurements.TTC = {
        status: found ? 'measured' : 'not_measured',
        samples,
        tokenizer: tokenizer ?? 'cl100k_base',
        explanation: supported
            ? `${found}/${correct.length} correct facts found within 4000 tokens; misses remain censored.`
            : searchReason,
        evidence: found
            ? correct
                  .filter((row) => costs.get(row.id) !== null && costs.get(row.id) <= 4000)
                  .slice(0, evidenceLimit)
                  .map(evidenceFor)
            : [],
    };

    return {
        schema_version: 1,
        verification_status: 'unverified',
        scope: data.scope,
        revisions: data.revisions ?? {},
        ledger_sha256: result.ledger_sha256,
        retrieval_protocol: result.retrieval?.protocol ?? null,
        explanation: excerpt(
            data.explanation ??
                `${data.scope}. Facts: ${result.counts.CORRECT} correct, ${result.counts.CONTRADICTED} contradicted, ${result.counts.MISSING} missing, ${result.counts.AMBIGUOUS} ambiguous, ${result.counts.UNKNOWN} unknown.`,
        ),
        measurements,
        assessment: assessQuality(measurements),
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const {values, positionals} = parseArgs({
            allowPositionals: true,
            options: {
                help: {type: 'boolean'},
                retrieval: {type: 'string'},
                'evidence-limit': {type: 'string', default: '3'},
            },
        });

        if (values.help) {
            console.log(
                'Usage: node quality.mjs ledger.json [--retrieval retrieval.json] [--evidence-limit 3]',
            );
        } else {
            if (positionals.length !== 1) {
                throw new Error('Provide one ledger.json path; see --help');
            }

            const data = loadLedger(positionals[0]);
            const retrieval = values.retrieval ? loadJson(values.retrieval) : undefined;
            process.stdout.write(
                JSON.stringify(
                    prepareQuality(data, retrieval, Number(values['evidence-limit'])),
                    null,
                    2,
                ) + '\n',
            );
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
