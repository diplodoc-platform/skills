#!/usr/bin/env node
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

import {compareText, loadJson, loadLedger, roundScore, summarize} from './measure.mjs';
import {buildReproducibility, checkBaseline} from './reproducibility.mjs';

export {checkBaseline} from './reproducibility.mjs';

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
const noApplicableFacts = (facts, population) => facts.length > 0 && population.length === 0;
const excerpt = (value) =>
    String(value).length > 2000 ? String(value).slice(0, 1999) + '…' : String(value);

function selectEvidence(rows, limit) {
    const problem = (row) =>
        ['CONTRADICTED', 'MISSING', 'AMBIGUOUS', 'FAIL', 'BROKEN'].includes(row.status) ||
        row.semantic?.status === 'IRRELEVANT';

    return [...rows.filter(problem), ...rows.filter((row) => !problem(row))].slice(0, limit);
}

function evidenceFor(row, text) {
    if (row.verification) {
        return {
            source: excerpt(row.documentation[0] ?? row.product ?? row.id),
            expected: excerpt(row.report?.expected ?? row.statement),
            observed: excerpt(
                row.report?.observed ?? `${row.status}: ${row.verification.evidence}`,
            ),
        };
    }

    return {
        source: excerpt(row.source ?? row.id),
        expected:
            row.report?.expected ??
            (['PASS', 'FAIL'].includes(row.status)
                ? text(
                      'The example produces its documented result.',
                      'Пример даёт описанный результат.',
                  )
                : text(
                      'The target document and anchor are accessible.',
                      'Целевой документ и якорь доступны.',
                  )),
        observed: excerpt(row.report?.observed ?? row.evidence),
        ...(row.target ? {target: excerpt(row.target)} : {}),
    };
}

function retrievalEvidenceFor(row, cost, text) {
    let observed = text('No retrieval observation.', 'Поисковое наблюдение отсутствует.');

    if (cost === null || cost > 4000) {
        observed = text(
            'Not found within 4000 BPE tokens.',
            'Факт не найден в пределах 4000 BPE-токенов.',
        );
    } else if (cost !== undefined) {
        observed = text(
            `Found after ${cost} BPE tokens.`,
            `Факт найден после ${cost} BPE-токенов.`,
        );
    }

    return {
        source: excerpt(row.documentation[0] ?? row.id),
        expected: excerpt(
            text(
                `Query: ${row.query}; budget: 4000 BPE tokens.`,
                `Запрос: ${row.query}; бюджет: 4000 BPE-токенов.`,
            ),
        ),
        observed,
    };
}

function rate(
    name,
    metric,
    rows,
    eligible,
    evidenceLimit,
    absentReason,
    text,
    inapplicable = false,
) {
    const measured = metric.denominator > 0;
    let status = inapplicable ? 'not_applicable' : 'not_measured';
    let explanation = absentReason;

    if (inapplicable) {
        explanation = text(
            `${name}: no applicable items in the declared inventory.`,
            `${name}: в объявленном реестре нет применимых пунктов.`,
        );
    }

    if (measured) {
        status = 'measured';
        explanation = text(
            `${name}: ${metric.numerator}/${metric.denominator}; ${eligible - metric.denominator} unmeasured of ${eligible} inventoried items.`,
            `${name}: ${metric.numerator}/${metric.denominator}; не проверено ${eligible - metric.denominator} из ${eligible} пунктов реестра.`,
        );
    }

    return {
        status,
        numerator: metric.numerator,
        denominator: metric.denominator,
        eligible,
        explanation,
        evidence: measured
            ? selectEvidence(rows, evidenceLimit).map((row) => evidenceFor(row, text))
            : [],
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

function metricCounts(name, input, recall) {
    if (name !== 'TTC') {
        return {
            numerator: input.numerator,
            denominator: input.denominator,
            eligible: input.eligible,
            unknown: input.eligible - input.denominator,
        };
    }

    const found = input.samples.filter(({tokens}) => tokens !== null).length;

    return {
        unit: 'tokens',
        budget: 4000,
        tokenizer: input.tokenizer,
        eligible: recall.eligible,
        checked: input.samples.length,
        unknown: recall.eligible - input.samples.length,
        found,
        censored: input.samples.length - found,
    };
}

function metricValue(name, input) {
    if (name !== 'TTC') {
        return input.status === 'measured' ? input.numerator / input.denominator : null;
    }

    const costs = input.samples
        .flatMap(({tokens}) => (tokens === null ? [] : [tokens]))
        .sort((a, b) => a - b);

    if (!costs.length) {
        return null;
    }

    return (costs[Math.floor((costs.length - 1) / 2)] + costs[Math.floor(costs.length / 2)]) / 2;
}

function assessMetric(name, input, recall) {
    const weight = WEIGHTS[name];
    const value = metricValue(name, input);
    const counts = metricCounts(name, input, recall);
    let penalty = weight;

    if (input.status === 'not_applicable') {
        penalty = 0;
    } else if (name === 'TTC') {
        if (value !== null && counts.unknown === 0) {
            penalty = weight * penaltyFraction(name, value);
        }
    } else if (counts.eligible > 0) {
        const worst = (counts.numerator + (name === 'ERR' ? counts.unknown : 0)) / counts.eligible;

        penalty = weight * penaltyFraction(name, worst);
    }

    return {
        status: input.status,
        value,
        ...counts,
        max_penalty: weight,
        penalty,
        explanation: input.explanation,
    };
}

function assessQuality(measurements) {
    const metrics = Object.fromEntries(
        Object.keys(WEIGHTS).map((name) => [
            name,
            assessMetric(name, measurements[name], measurements['Recall@4000']),
        ]),
    );
    const values = Object.values(metrics);
    const measuredWeight = values
        .filter((metric) => metric.value !== null)
        .reduce((sum, metric) => sum + metric.max_penalty, 0);
    const completeWeight = values
        .filter(
            (metric) =>
                metric.status === 'not_applicable' || (metric.eligible > 0 && metric.unknown === 0),
        )
        .reduce((sum, metric) => sum + metric.max_penalty, 0);
    const dqs = Math.max(0, 100 - values.reduce((sum, metric) => sum + metric.penalty, 0));

    return {
        scoring_version: 'dqs-v2',
        unknown_policy: 'maximum_penalty',
        dqs: roundScore(dqs),
        tier: tierFor(dqs),
        measured_weight: measuredWeight,
        complete_weight: completeWeight,
        metrics,
    };
}

function compareIds(first, second) {
    return compareText(first.id, second.id);
}

function compactText(value) {
    return typeof value === 'string' && /\S/.test(value) && value?.length <= 2000;
}

function validatePresentation(data) {
    if (data.audit?.report_scope !== undefined && !compactText(data.audit.report_scope)) {
        throw new Error(
            'audit.report_scope requires nonempty presentation text up to 2000 characters.',
        );
    }

    for (const row of [...data.facts, ...(data.examples ?? []), ...(data.links ?? [])]) {
        for (const [presentation, fields] of [
            [row.report, ['expected', 'observed', 'problem']],
            [row.semantic?.report, ['expected', 'observed']],
        ]) {
            if (presentation === undefined) {
                continue;
            }

            if (
                !presentation ||
                typeof presentation !== 'object' ||
                Array.isArray(presentation) ||
                Object.entries(presentation).some(
                    ([key, value]) => !fields.includes(key) || !compactText(value),
                )
            ) {
                throw new Error(
                    'row.report and semantic.report require supported nonempty text fields up to 2000 characters.',
                );
            }
        }
    }
}

function recommendationsFor(data) {
    const recommendations = [...(data.recommendations ?? [])];

    for (const row of [...data.facts, ...(data.examples ?? []), ...(data.links ?? [])]) {
        if (!row.recommendation?.trim()) {
            continue;
        }

        recommendations.push({
            id: row.id,
            priority: row.priority ?? 'medium',
            sources: [
                ...new Set([...(row.documentation ?? []), row.product, row.source].filter(Boolean)),
            ],
            problem: excerpt(
                row.report?.problem ??
                    `${row.status}: ${row.statement ?? row.promise ?? row.source}. ${row.verification?.evidence ?? row.evidence ?? row.reason ?? ''}`,
            ),
            recommendation: row.recommendation,
        });
    }

    const ids = new Set();

    for (const row of recommendations) {
        if (
            typeof row.id !== 'string' ||
            !row.id.trim() ||
            row.id.length > 200 ||
            ids.has(row.id) ||
            !['critical', 'high', 'medium', 'low'].includes(row.priority) ||
            !Array.isArray(row.sources) ||
            !row.sources.length ||
            row.sources.length > 20 ||
            [row.problem, row.recommendation, ...row.sources].some((value) => !compactText(value))
        ) {
            throw new Error(
                'Recommendations require unique IDs, priority, sources, problem and recommendation (up to 2000 characters per text).',
            );
        }

        ids.add(row.id);
    }

    if (recommendations.length > 100) {
        throw new Error(
            'Keep at most 100 recommendations in the compact quality report; retain the full ledger.',
        );
    }

    return recommendations.sort(compareIds);
}

function auditBlockers(data) {
    const blockers = data.audit?.blockers ?? {};

    if (!blockers || typeof blockers !== 'object' || Array.isArray(blockers)) {
        throw new Error('audit.blockers must be an object keyed by metric name');
    }

    for (const [name, blocker] of Object.entries(blockers)) {
        if (!Object.hasOwn(WEIGHTS, name)) {
            throw new Error(`Unknown blocker metric: ${name}`);
        }

        if (
            !blocker ||
            typeof blocker.reason !== 'string' ||
            !blocker.reason.trim() ||
            typeof blocker.evidence !== 'string' ||
            !blocker.evidence.trim()
        ) {
            throw new Error(
                `audit.blockers.${name} requires a concrete reason and evidence of the constraint or attempted check`,
            );
        }
    }

    return blockers;
}

function completionCheck(name, input, recall, blocker) {
    const counts = metricCounts(name, input, recall);
    const checked = counts.checked ?? counts.denominator;
    const result = {checked, eligible: counts.eligible};

    if (input.status === 'not_applicable') {
        return {...result, status: 'not_applicable', reason: input.explanation};
    }

    if (counts.eligible > 0 && checked === counts.eligible) {
        return {...result, status: 'complete'};
    }

    if (blocker) {
        return {...result, status: 'blocked', reason: blocker.reason, evidence: blocker.evidence};
    }

    return {...result, status: checked ? 'partial' : 'not_run', reason: input.explanation};
}

function auditCompletion(data, measurements, mode) {
    if (!['full', 'short'].includes(mode)) {
        throw new Error('mode must be full or short');
    }

    const blockers = auditBlockers(data);
    const checks = Object.fromEntries(
        Object.keys(WEIGHTS).map((name) => [
            name,
            completionCheck(name, measurements[name], measurements['Recall@4000'], blockers[name]),
        ]),
    );
    const remaining = Object.keys(checks).filter(
        (name) => !['complete', 'not_applicable'].includes(checks[name].status),
    );
    let status = 'complete';

    if (remaining.length) {
        status = remaining.every((name) => checks[name].status === 'blocked')
            ? 'blocked'
            : 'incomplete';
    }

    if (mode === 'short') {
        status = 'short';
    }

    return {mode, status, checks, remaining};
}

export function prepareQuality(
    data,
    retrieval,
    evidenceLimit = 3,
    mode = data.audit?.mode ?? 'full',
) {
    if (!Number.isInteger(evidenceLimit) || evidenceLimit < 1 || evidenceLimit > 100) {
        throw new Error('evidence-limit must be an integer between 1 and 100');
    }

    validatePresentation(data);

    const reportLanguage = new Intl.Locale(data.audit?.report_language ?? 'en').language;
    const reportScope = data.audit?.report_scope ?? data.scope;
    const text = (english, russian) => (reportLanguage === 'ru' ? russian : english);
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
        rate(name, result.metrics[name], rows, eligible, evidenceLimit, reason, text, inapplicable);
    const measurements = {
        FCR: makeRate(
            'FCR',
            verified,
            expected.length,
            text('No verified required facts.', 'Необходимые факты не проверены.'),
        ),
        ERR: makeRate(
            'ERR',
            documented,
            claims.length,
            text('No verified documented claims.', 'Утверждения документации не проверены.'),
            noApplicableFacts(data.facts, claims),
        ),
        CCR: makeRate(
            'CCR',
            verified.filter((row) => row.condition),
            conditions.length,
            text('No verified applicable conditions.', 'Применимые условия не проверены.'),
            noApplicableFacts(data.facts, conditions),
        ),
        EPR: makeRate(
            'EPR',
            tested,
            examples.length,
            text(
                'Examples were not executed or no inventory was supplied.',
                'Примеры не проверены либо их реестр не задан.',
            ),
            Array.isArray(data.examples) && examples.length === 0,
        ),
        'LHR-T': makeRate(
            'LHR-T',
            technical,
            links.length,
            text(
                'Links were not technically checked or no inventory was supplied.',
                'Ссылки не проверены технически либо их реестр не задан.',
            ),
            Array.isArray(data.links) && links.length === 0,
        ),
        'LHR-S': makeRate(
            'LHR-S',
            semantic,
            semanticEligible.length,
            text(
                'Source promises and target relevance were not checked.',
                'Соответствие целевых страниц обещаниям ссылок не проверено.',
            ),
            Array.isArray(data.links) && semanticEligible.length === 0,
        ),
    };

    measurements['LHR-S'].evidence = selectEvidence(semantic, evidenceLimit).map((row) => ({
        source: excerpt(row.source),
        target: excerpt(row.target),
        expected: excerpt(row.semantic.report?.expected ?? row.promise),
        observed: excerpt(row.semantic.report?.observed ?? row.semantic.evidence),
    }));

    const correct = data.facts.filter((row) => row.status === 'CORRECT');
    const retrievalEligible =
        correct.length + data.facts.filter((row) => row.status === 'UNKNOWN').length;
    const tokenizer = /^(cl100k_base|o200k_base)(?:\s|$)/.exec(
        String(result.retrieval?.protocol.tokenizer ?? ''),
    )?.[1];
    const supported = Boolean(tokenizer && result.retrieval.correct_only_recall['4000']);
    const searchReason = text(
        'Correct-only retrieval at 4000 BPE tokens was not measured; run retrieve.mjs with --budgets 4000 and a supported tokenizer.',
        'Поиск корректных фактов в пределах 4000 BPE-токенов не измерен; запустите retrieve.mjs с --budgets 4000 и поддерживаемым токенизатором.',
    );
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
        retrievalEligible,
        evidenceLimit,
        searchReason,
        text,
        supported && retrievalEligible === 0,
    );

    const retrievalEvidence = (row) => retrievalEvidenceFor(row, costs.get(row.id), text);

    measurements['Recall@4000'].evidence = supported
        ? correct.slice(0, evidenceLimit).map(retrievalEvidence)
        : [];

    let costStatus = found ? 'measured' : 'not_measured';
    let costExplanation = searchReason;

    if (supported) {
        costExplanation = text(
            `${found}/${correct.length} verified correct facts found within 4000 tokens; ${retrievalEligible - correct.length} unverified facts may change the eligible population. Misses remain censored.`,
            `Найдено ${found}/${correct.length} подтверждённых корректных фактов в пределах 4000 токенов; ещё ${retrievalEligible - correct.length} непроверенных фактов могут изменить применимую совокупность. Ненайденные факты учитываются как цензурированные наблюдения.`,
        );
    }

    if (supported && retrievalEligible === 0) {
        costStatus = 'not_applicable';
        costExplanation = text(
            'Completed retrieval has no correct or unverified facts eligible for correct-only TTC.',
            'Поиск завершён: корректных или непроверенных фактов, применимых к TTC, нет.',
        );
    }

    measurements.TTC = {
        status: costStatus,
        samples,
        tokenizer: tokenizer ?? 'cl100k_base',
        explanation: costExplanation,
        evidence: found
            ? correct
                  .filter((row) => costs.get(row.id) !== null && costs.get(row.id) <= 4000)
                  .slice(0, evidenceLimit)
                  .map(retrievalEvidence)
            : [],
    };

    return {
        schema_version: 1,
        report_language: reportLanguage,
        verification_status: 'unverified',
        scope: reportScope,
        canonical_scope: data.scope,
        revisions: data.revisions ?? {},
        ledger_sha256: result.ledger_sha256,
        retrieval_protocol: result.retrieval?.protocol ?? null,
        profile: buildReproducibility(data, measurements, result.retrieval?.protocol ?? null),
        explanation: excerpt(
            data.explanation ??
                text(
                    `${reportScope}. Facts: ${result.counts.CORRECT} correct, ${result.counts.CONTRADICTED} contradicted, ${result.counts.MISSING} missing, ${result.counts.AMBIGUOUS} ambiguous, ${result.counts.UNKNOWN} unknown.`,
                    `${reportScope}. Факты: корректных — ${result.counts.CORRECT}, с противоречиями — ${result.counts.CONTRADICTED}, пропущенных — ${result.counts.MISSING}, неоднозначных — ${result.counts.AMBIGUOUS}, непроверенных — ${result.counts.UNKNOWN}.`,
                ),
        ),
        measurements,
        recommendations: recommendationsFor(data),
        assessment: mode === 'short' ? null : assessQuality(measurements),
        completion: auditCompletion(data, measurements, mode),
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const {values, positionals} = parseArgs({
            allowPositionals: true,
            options: {
                help: {type: 'boolean'},
                retrieval: {type: 'string'},
                mode: {type: 'string'},
                baseline: {type: 'string', default: '.diplodoc-review/quality.json'},
                recalibrate: {type: 'boolean'},
                replay: {type: 'boolean'},
                'evidence-limit': {type: 'string', default: '3'},
            },
        });

        if (values.help) {
            console.log(
                'Usage: node quality.mjs ledger.json [--retrieval retrieval.json] [--mode full|short] [--baseline .diplodoc-review/quality.json] [--recalibrate] [--replay] [--evidence-limit 3]',
            );
        } else {
            if (positionals.length !== 1) {
                throw new Error('Provide one ledger.json path; see --help');
            }

            const data = loadLedger(positionals[0]);
            const retrieval = values.retrieval ? loadJson(values.retrieval) : undefined;
            const result = prepareQuality(
                data,
                retrieval,
                Number(values['evidence-limit']),
                values.mode,
            );

            if (result.assessment !== null && !values.replay && !result.profile.guarded) {
                throw new Error(
                    'Full audits require source_snapshot from sources.mjs and normalized fact units. Use --replay only for legacy arithmetic.',
                );
            }

            if (values.replay && values.recalibrate) {
                throw new Error('--replay cannot accept a new calibrated baseline.');
            }

            if (values.replay) {
                result.profile.guarded = false;
                result.replay_only = true;
            }

            if (!values.replay && !values.recalibrate && existsSync(values.baseline)) {
                checkBaseline(result, loadJson(values.baseline));
            }

            process.stdout.write(JSON.stringify(result, null, 2) + '\n');

            if (result.completion.status === 'incomplete') {
                console.error(
                    `Full audit incomplete: ${result.completion.remaining.join(', ')}. Complete the checks or record concrete blockers in audit.blockers.`,
                );
                process.exitCode = 3;
            }
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
