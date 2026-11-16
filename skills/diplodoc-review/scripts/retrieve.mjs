#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFileSync, realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, isAbsolute, relative, resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {fileURLToPath, pathToFileURL} from 'node:url';

import {
    ledgerHash,
    loadLedger,
    requireValue,
    retrievalSummary,
    searchHash,
    validateLedger,
} from './measure.mjs';

const lexical = (text) =>
    text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .match(/[\p{L}\p{N}_]+/gu) ?? [];

async function tokenizerFor(name, modulePath) {
    if (name === 'unicode-words') {
        return {
            count: (text) => (text.match(/[\p{L}\p{N}_]+/gu) ?? []).length,
            description: 'unicode-words lexical tokens (not BPE or model tokens)',
        };
    }

    requireValue(name === 'cl100k_base', 'tokenizer must be cl100k_base or unicode-words');

    let module;
    let moduleURL;

    try {
        if (modulePath) {
            moduleURL = pathToFileURL(resolve(modulePath)).href;
        } else {
            try {
                moduleURL = pathToFileURL(
                    createRequire(resolve(process.cwd(), 'package.json')).resolve('js-tiktoken'),
                ).href;
            } catch {
                moduleURL = import.meta.resolve('js-tiktoken');
            }
        }

        module = await import(moduleURL);
    } catch {
        throw new Error(
            'cl100k_base requires js-tiktoken. Use an existing installation with --tokenizer-module /path/to/js-tiktoken/dist/index.js; no automatic install or approximate fallback is performed.',
        );
    }

    const getEncoding = module.getEncoding ?? module.default?.getEncoding;

    requireValue(
        typeof getEncoding === 'function',
        'Tokenizer module must export js-tiktoken getEncoding',
    );

    const encoding = getEncoding('cl100k_base');
    let version = 'version unknown';
    let folder = dirname(fileURLToPath(moduleURL));

    for (let step = 0; step < 4; step++, folder = dirname(folder)) {
        try {
            const manifest = JSON.parse(readFileSync(resolve(folder, 'package.json'), 'utf8'));

            if (manifest.name === 'js-tiktoken') {
                version = manifest.version;
                break;
            }
        } catch {}
    }

    return {
        count: (text) => encoding.encode(text, [], []).length,
        description: `cl100k_base (js-tiktoken ${version})`,
    };
}

function loadCorpus(root, paths) {
    requireValue(
        Array.isArray(paths) && paths.length > 0,
        'Provide a nonempty explicit corpus path list',
    );

    const base = realpathSync(root);
    const seen = new Set();

    return [...paths].sort().map((path) => {
        requireValue(
            typeof path === 'string' &&
                path &&
                !isAbsolute(path) &&
                !path.includes('\\') &&
                !path.split('/').includes('..'),
            `Invalid corpus path: ${path}`,
        );

        const absolute = realpathSync(resolve(base, path));

        requireValue(
            !isAbsolute(relative(base, absolute)) && !relative(base, absolute).startsWith('..'),
            `Corpus path leaves root: ${path}`,
        );
        requireValue(!seen.has(absolute), `Duplicate corpus path: ${path}`);
        seen.add(absolute);

        const raw = readFileSync(absolute);
        const text = raw.toString('utf8').replace(/\r\n?/g, '\n');
        const points = Array.from(text);
        const starts = [0];

        for (let index = 0; index < points.length; index++) {
            if (points[index] === '\n') {
                starts.push(index + 1);
            }
        }

        return {path, text, points, starts, sha256: createHash('sha256').update(raw).digest('hex')};
    });
}

function chunksFor(document, limit, count) {
    const {path, points} = document;

    const payload = (start, end) =>
        `${path}@${start}:${end}\n${points.slice(start, end).join('')}\n\n`;

    const chunks = [];

    const emit = (start, end) => {
        const body = payload(start, end);

        requireValue(count(body) <= limit, 'Chunk exceeds token limit');
        chunks.push({path, start, end, payload: body});
    };

    let start = 0;
    let end = 0;
    const endings = document.starts.slice(1);

    if (endings.at(-1) !== points.length) {
        endings.push(points.length);
    }

    for (const next of endings) {
        if (count(payload(start, next)) <= limit) {
            end = next;
            continue;
        }

        if (end > start) {
            emit(start, end);
            start = end;
        }

        while (count(payload(start, next)) > limit) {
            let low = start;
            let high = next;

            while (low < high) {
                const middle = Math.ceil((low + high) / 2);

                if (count(payload(start, middle)) <= limit) {
                    low = middle;
                } else {
                    high = middle - 1;
                }
            }

            requireValue(
                low > start,
                `Chunk limit ${limit} is too small for the label and one Unicode character of ${path}`,
            );
            emit(start, low);
            start = low;
        }

        end = next;
    }

    if (end > start) {
        emit(start, end);
    }

    return chunks;
}

function goldFor(fact, documents) {
    requireValue(
        Array.isArray(fact.gold) && fact.gold.length > 0,
        `${fact.id}: nonempty gold ranges are required`,
    );

    return fact.gold.map((span) => {
        const document = documents.get(span.path);

        requireValue(document, `${fact.id}: gold target is not in the corpus: ${span.path}`);

        const lineCount = document.starts.length - (document.points.at(-1) === '\n' ? 1 : 0);

        requireValue(
            Number.isInteger(span.start_line) &&
                Number.isInteger(span.end_line) &&
                span.start_line >= 1 &&
                span.end_line >= span.start_line &&
                span.end_line <= lineCount,
            `${fact.id}: invalid inclusive gold line range`,
        );

        return {
            path: span.path,
            start: document.starts[span.start_line - 1],
            end: document.starts[span.end_line] ?? document.points.length,
        };
    });
}

function covered(span, seen) {
    let cursor = span.start;

    for (const [start, end] of [...(seen.get(span.path) ?? [])].sort((a, b) => a[0] - b[0])) {
        if (start > cursor) {
            return false;
        }

        if (end > cursor) {
            cursor = end;
        }

        if (cursor >= span.end) {
            return true;
        }
    }

    return false;
}

export async function runRetrieval(root, input, options = {}) {
    const data = validateLedger(input);
    const budgets = [...new Set(options.budgets ?? [2000, 4000, 8000])].sort((a, b) => a - b);
    const chunkTokens = options.chunkTokens ?? 512;

    requireValue(
        budgets.length && budgets.every((x) => Number.isSafeInteger(x) && x > 0),
        'Budgets must be positive safe integers',
    );
    requireValue(
        Number.isSafeInteger(chunkTokens) && chunkTokens > 0,
        'chunkTokens must be a positive safe integer',
    );

    const tokenizer = await tokenizerFor(
        options.tokenizer ?? 'cl100k_base',
        options.tokenizerModule,
    );
    const corpus = loadCorpus(root, data.corpus);
    const documents = new Map(corpus.map((document) => [document.path, document]));
    const chunks = corpus.flatMap((document) => chunksFor(document, chunkTokens, tokenizer.count));
    const terms = chunks.map((chunk) => {
        const frequencies = new Map();

        for (const term of lexical(chunk.payload)) {
            frequencies.set(term, (frequencies.get(term) ?? 0) + 1);
        }

        return frequencies;
    });
    const lengths = terms.map((frequencies) =>
        [...frequencies.values()].reduce((sum, value) => sum + value, 0),
    );
    const average = lengths.reduce((sum, value) => sum + value, 0) / Math.max(chunks.length, 1);
    const documentFrequency = new Map();

    for (const frequencies of terms) {
        for (const term of frequencies.keys()) {
            documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
        }
    }

    const results = [];

    for (const fact of data.facts.filter((row) =>
        ['CORRECT', 'CONTRADICTED'].includes(row.status),
    )) {
        requireValue(
            typeof fact.query === 'string' && fact.query.trim(),
            `${fact.id}: nonempty fixed query is required`,
        );

        const queryTerms = [...new Set(lexical(fact.query))].sort();

        requireValue(queryTerms.length, `${fact.id}: query has no lexical terms`);

        const gold = goldFor(fact, documents);
        const ranking = chunks
            .map((chunk, index) => {
                let score = 0;

                for (const term of queryTerms) {
                    const frequency = terms[index].get(term) ?? 0;

                    if (!frequency) {
                        continue;
                    }

                    const df = documentFrequency.get(term);
                    const idf = Math.log(1 + (chunks.length - df + 0.5) / (df + 0.5));

                    score +=
                        (idf * frequency * 2.5) /
                        (frequency + 1.5 * (0.25 + (0.75 * lengths[index]) / average));
                }

                return {...chunk, score};
            })
            .filter((chunk) => chunk.score > 0)
            .sort(
                (a, b) =>
                    b.score - a.score ||
                    (a.path < b.path ? -1 : a.path > b.path ? 1 : 0) ||
                    a.start - b.start,
            );
        let stream = '';
        let ttc = null;
        let rank = null;
        const seen = new Map();
        let delivered = 0;

        for (const chunk of ranking) {
            const next = stream + chunk.payload;
            const cost = tokenizer.count(next);

            if (cost > budgets.at(-1)) {
                break;
            }

            stream = next;
            delivered++;

            if (!seen.has(chunk.path)) {
                seen.set(chunk.path, []);
            }

            seen.get(chunk.path).push([chunk.start, chunk.end]);

            if (gold.some((span) => covered(span, seen))) {
                ttc = cost;
                rank = delivered;
                break;
            }
        }

        results.push({
            id: fact.id,
            status: fact.status,
            query: fact.query,
            ttc,
            rank,
            censored: ttc === null,
            top: ranking
                .slice(0, 3)
                .map((chunk) => ({path: chunk.path, start: chunk.start, end: chunk.end})),
        });
    }

    return {
        schema_version: 1,
        ledger_sha256: ledgerHash(data),
        search_sha256: searchHash(data),
        protocol: {
            algorithm: 'BM25',
            k1: 1.5,
            b: 0.75,
            tokenizer: tokenizer.description,
            chunk_tokens: chunkTokens,
            offsets: 'Unicode code points; LF-normalized UTF-8 text',
            corpus: 'Explicit raw files; includes not expanded',
            ordering:
                'score descending, path ascending, start ascending; sorted unique query terms',
            delivery:
                'Whole labeled chunks; tokenize the concatenated stream; stop at the first over-budget result',
            documents: corpus.length,
            chunks: chunks.length,
            budgets,
            files: corpus.map(({path, sha256}) => ({path, sha256})),
        },
        ...retrievalSummary(results, budgets),
        results,
    };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const {values, positionals} = parseArgs({
            allowPositionals: true,
            options: {
                help: {type: 'boolean'},
                check: {type: 'boolean'},
                root: {type: 'string'},
                tokenizer: {type: 'string', default: 'cl100k_base'},
                'tokenizer-module': {type: 'string'},
                budgets: {type: 'string', default: '2000,4000,8000'},
                'chunk-tokens': {type: 'string', default: '512'},
            },
        });

        if (values.help) {
            console.log(
                'Usage: node retrieve.mjs ledger.json --root /corpus/root [--tokenizer cl100k_base|unicode-words] [--tokenizer-module /path/to/js-tiktoken/dist/index.js] [--budgets 2000,4000,8000] [--chunk-tokens 512]; use --check to verify the tokenizer without a ledger',
            );
        } else if (values.check) {
            const tokenizer = await tokenizerFor(values.tokenizer, values['tokenizer-module']);

            console.log(JSON.stringify({ready: true, tokenizer: tokenizer.description}));
        } else {
            requireValue(
                positionals.length === 1 && values.root,
                'Provide one ledger path and --root; see --help',
            );

            const result = await runRetrieval(values.root, loadLedger(positionals[0]), {
                tokenizer: values.tokenizer,
                tokenizerModule: values['tokenizer-module'],
                budgets: values.budgets.split(',').map(Number),
                chunkTokens: Number(values['chunk-tokens']),
            });

            process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 2;
    }
}
