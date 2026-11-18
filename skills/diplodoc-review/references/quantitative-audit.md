# Quantitative product-contract audit

Assess documentation against verified product contracts and a declared inventory.
No new LLM trials. See [measurements.md](measurements.md) for saved-run comparisons.

Full mode completes every metric phase in the declared scope. Link quality
has technical (LHR-T) and semantic (LHR-S) components; preserve both denominators.

## Procedure

1. Record the selected documentation, language/publication, relevant package
   revisions and existing dirty changes. For a metapackage record each involved
   repository, not only the parent HEAD. Distinguish built artifacts from source.
2. Enumerate relevant **public contracts from the product**: visible CLI options,
   exported API/schema fields, defaults, enumerations, conditions, overrides,
   exceptions and results. Cover the declared interface; a bounded sample needs
   an explicit selection rule and cannot silently replace it. Hidden flags are not required
   documentation. A flag name's presence establishes less than its behavior.
3. Check the corresponding document statements. Use literal/schema assertions,
   existing tests or isolated product probes where appropriate. Record the
   semantic mapping separately from the machine evidence; do not convert an
   unconfirmed suspicion into a confirmed contradiction.
   A configuration snapshot proves stored values, not emitted behavior. Claims
   about rendered content or effective precedence need an output assertion or
   a complete downstream call path; name the input and observed result.
   Before MISSING, search the declared corpus beyond the initial references;
   record the search terms and scope in the evidence. For CONTRADICTED, quote
   a proposition about the same subject and conditions: an unclear flag/effect
   referent or an undefined table dash is ambiguity/omission, not an explicit
   false promise. A correct statement elsewhere can resolve an omission.
4. Build the ledger below. Deduplicate translations/repeated assertions into
   normalized fact IDs. If one normative passage conflicts with the verified
   contract, preserve that contradiction even when another passage is correct.
   Keep each independently falsifiable rule atomic: a default and a maximum are
   separate facts. A CORRECT label needs evidence for the statement's scope.
   Universal promises require the relevant type, boundary and override paths;
   one successful configuration does not establish all precedence rules. Check
   string/numeric limits and CLI/config conflicts when both forms are public.
   Preserve a false universal claim even if a narrower statement is correct.
5. Calculate all facets: FCR/ERR/CCR, retrieval Recall/TTC, example EPR and
   technical/semantic LHR. Prepare questions/gold, execute safe example assertions
   and inventory links before aggregation. Reuse native build diagnostics; a
   warnings list alone is not a checked-link denominator.
6. Run `quality.mjs` and finish its `completion.remaining` checks. The full audit
   is complete only when every phase is complete or explicitly inapplicable;
   remaining work with evidenced constraints is blocked. `not_run` and `partial`
   are unfinished, never a successful full audit. Give the compact report below.

A request to perform quantitative measurements authorizes the relevant local
calculations and isolated product checks within the stated restrictions. It
does not authorize arbitrary shell commands copied from documents, live
publication or experimental model runs. Use a fresh temporary directory for
fixtures; preserve the original documents and retain accepted audit artifacts.

## Efficient execution

Use `.diplodoc-review/` at the project root, outside the audited corpus, for the
accepted ledger, retrieval and quality JSON; use temporary fixtures for probes.
Inspect the baseline first and reuse unchanged observations. On the first audit,
enumerate interface areas in path/name order; prefer a complete inventory or
record the exact sampled IDs and selection rule before inspecting defects.

1. Select functional areas from the public interface, record the inventory and
   corpus before labeling, and keep stable fact IDs and granularity. When
   comparing runs, reuse that profile (facts, languages, examples, link unit,
   queries and gold); report new discoveries separately. Flag-presence checks
   and behavioral contracts are different populations, not interchangeable
   ways to improve a percentage.
2. Inspect each area once, write observations directly to ledger records and
   batch independent probes/build checks. Keep full logs in the workspace;
   reuse installed product exports/tests and return summaries plus failures.
3. For each example record the behavioral assertion, not just exit status.
   Inventory source-page link occurrences once with `links.mjs`, reuse build
   findings and inspect target content. Keep the fixed source-page scope and
   untested occurrences visible; do not collect only known broken links.
4. Freeze queries/gold and run retrieval once, then use the commands below.
   Read summaries instead of full ledgers or helper source. For a single-file
   deliverable, `--format report` includes the machine replay appendix; adapt
   narrative/headings without rewriting its evidence.
5. Validate once against frozen inputs; rerun only checks affected by changed
   sources/dependencies. Do not narrow coverage for time, hide UNKNOWNs or
   substitute exit=0 for semantic assertions.

## Readiness

Before expensive checks, compare documented prerequisites with the actual product
snapshot and verify helpers with `retrieve.mjs --check` and `links.mjs --check`.
The helpers resolve dependencies from the audit workspace or skill installation.
Reuse installed `js-tiktoken`/`cheerio`; full-mode setup may install pinned copies
in the temporary workspace when network/package installation is allowed:

```sh
npm install --prefix . --no-save --package-lock=false --ignore-scripts \
  --no-audit --no-fund js-tiktoken@1.0.21 cheerio@1.0.0
```

Keep audited project dependencies unchanged. Before declaring a blocker, try
available equivalent checks: build the pinned product in isolation, inspect
rendered HTML/HTTP responses or use installed tooling instead of requiring a
browser. An installation restriction, failed setup or unavailable required
version needs actual evidence. Unprepared questions, gold or link inventories
are unfinished work. Do not change the audited product version or remove
difficult cases after labeling.

## Ledger contract, version 1

Helpers use Node.js 18.19+ and never mutate/execute inputs. Give `measure.mjs` JSON with:

- `schema_version: 1`, `scope`: a nonempty description of the inspected sample.
  Full audits require a generated `source_snapshot`; `revisions` is diagnostic.
- Optional `audit`: `{mode: "full"|"short", blockers: {"TTC": {reason, evidence}}}`.
  Full is the default. Blocker keys are metric names from the DSQ table; cite an
  attempted check, access restriction, version probe or explicit user constraint.
  A convenience choice such as "not requested" is not a blocker. Each affected
  metric needs its own entry; blockers do not remove unknowns from penalties.
- `facts`: normalized public-fact records. Required fields: `id`, `area`,
  `statement`, boolean `condition`, `status`, `product` source location,
  `documentation` location array, and `verification: {kind, evidence}`.
- Fact statuses: `CORRECT`, `MISSING`, `CONTRADICTED`, `AMBIGUOUS`, `UNKNOWN`.
  `UNKNOWN` has no verified denominator contribution; `AMBIGUOUS` assumes a
  known expected contract but an indeterminate document statement.
- Protected facts need `unit: {subject, property, when: {}}`; `condition` follows
  the predicate. Inputs, dependencies and origins follow reproducibility.md.
- `verification.kind`: `literal`, `schema`, `test`, `runtime` or `manual`.
  `evidence` states the actual assertion/result or manual verification basis.
  Evidence presence is validated; its semantic truth is the reviewer's job.
- `expected` defaults to true. Use false for an additional documented claim
  outside the required-fact inventory; it can affect ERR but not FCR/CCR.
- Optional `problem_id` groups multiple manifestations; optional `recommendation`
  provides the corrective action. Keep stable fact granularity across versions.
- Give findings an explicit `priority`: `critical`, `high`, `medium` or `low`,
  justified by reader consequence. Legacy records without it default to `medium`.
  A group uses its highest member priority and that member's summary. Reports
  sort groups by priority before applying the finding limit; ties retain input
  order. Priority changes presentation, not metric numerators or denominators.
- Optional `examples`: records with unique `id`, status `PASS`, `FAIL`,
  `NOT_TESTABLE` or `NOT_TESTED`; tested records need `evidence`, exclusions need
  `reason`. Count actual documentation examples, not arbitrary product tests.
- Optional `links`: occurrence records with unique `id`, technical status
  `VALID`, `BROKEN`, `UNCHECKED` or `RESTRICTED`; checked records need `evidence`
  from the stock checker, exclusions need `reason`. Repeated hrefs at different
  locations remain distinct. JSON `LHR` remains a legacy alias for `LHR-T`.
- Optional link `semantic`: status `RELEVANT`, `IRRELEVANT`, `UNKNOWN` or
  `NOT_APPLICABLE`. Checked semantic labels require technical `VALID`, `source`,
  resolved `target`, the source `promise` and `semantic.evidence` describing
  whether the target fulfills it. Other semantic statuses need `semantic.reason`.
  Omitted semantic observations remain unknown, not successful. Examples may
  include `source`; an optional ledger `explanation` supplies the main conclusion.
- Every actionable finding needs a concrete correction in the JSON, not only
  the final prose. Facts/examples/links carry `recommendation` and `priority`. For other
  findings add top-level `recommendations`: `{id, priority, sources: [location],
  problem, recommendation}`. IDs are stable; texts must explain the defect and
  concrete correction. The compact JSON retains up to 100 recommendations,
  with nonempty texts up to 2000 characters; preserve further detail in the ledger.
  Set `row.report.problem` to a concise defect description in the report language;
  cite the exact input/options/observation, keeping a passing control separate from
  its failing counterexample. Describe the saved result, not an assertion's label.
  For existing frozen records, optional `row.report.expected`/`observed` and
  `audit.report_scope` localize presentation without changing statements, queries,
  verdicts or the profile. Links use `row.report` for technical evidence and
  `row.semantic.report.expected`/`observed` for relevance; keep these facets separate.
  The output retains `canonical_scope` for integrations when display scope differs.
  Set `audit.report_language: "ru"` for Russian helper
  messages; the default is `en`. Free-text ledger fields still require localization.

For example, a fact in the synthetic DocuBox fixture can be represented as:

```json
{
  "id": "profile-default", "area": "defaults", "condition": false,
  "unit": {"subject": "profile", "property": "default", "when": {}},
  "statement": "The default profile is Standard", "status": "CORRECT",
  "product": "contract.md:5", "documentation": ["docs/guide.md:3"],
  "query": "Which profile is used by default?",
  "gold": [{"path": "docs/guide.md", "start_line": 3, "end_line": 3}],
  "verification": {"kind": "literal", "evidence": "The supplied contract and page state Standard"}
}
```

This quantitative profile calculates FCR from verified **expected** facts,
ERR from `CORRECT + CONTRADICTED` documented facts, and CCR from verified
expected condition facts. Missing and ambiguous facts reduce coverage but are
not confirmed erroneous claims. UNKNOWN is separate. Keep additional unsupported
claims in the qualitative claim audit; absence of evidence is not contradiction.
Fractions are primary; zero checked items give no observed rate, and N/A
requires a complete inventory with no applicable items. The helpers report
annotation kinds and checked/discovered coverage for EPR/LHR.

## Reproducible retrieval

Add an explicit `corpus` array of paths relative to `--root`. Include only the
intended corpus; record whether source Markdown, unpublished files, languages,
frontmatter and includes are included. The helper indexes raw file content,
without executing templates or expanding includes, and records file hashes.

In full mode create a natural reader question from each verified contract,
without copying the answer or selecting wording after seeing retrieval rankings.
Each CORRECT/CONTRADICTED fact needs a fixed `query` and nonempty `gold` array:
`[{"path":"docs/guide.md","start_line":3,"end_line":3}]`. Lines are inclusive.
Each range must include the full statement with its qualification. An alternative
range can represent a translation. The union of delivered chunks must cover
at least one full range; partial mentions are not automatically relevant.
For flag-availability facts, document whether relevance is the whole line or
an exact flag occurrence. This helper uses full ranges, not automatic synonyms.

Protocol: labeled chunks `path@start:end\n<body>\n\n`, Unicode code-point
offsets after CRLF normalization, line-first splitting, no overlap, default
512 budget tokens. BM25 uses k1=1.5 and b=0.75, camelCase splitting, lowercase,
Unicode letters/numbers/underscore, lexical chunk length, no stemming or
translation. It scores the labeled payload. Unique query terms are sorted;
ties use path then start. This avoids random summation order. Lowercase is not
full Unicode casefold; record the difference when comparing another protocol.

Delivery uses whole chunks in rank order, re-tokenizes the entire concatenated
stream and stops before the first over-budget chunk. Default budgets: 2000,
4000, 8000. Recall includes the selected CORRECT/CONTRADICTED statements;
`correct_only_recall` separately measures correct knowledge. Searching erroneous
instructions successfully is not successful knowledge acquisition.

TTC is the first prefix that completely covers a correct fact's gold. Non-found
cases are censored, never assigned the maximum budget as a measured cost.
Median/percentiles are explicitly conditional on found correct facts; no
unconditional percentile is inferred automatically.

The default tokenizer is `cl100k_base`, using an available `js-tiktoken`
installation (tested with 1.0.21). It has no automatic network/install fallback.
Use `--tokenizer-module` for an existing module or the isolated setup above.
`--tokenizer unicode-words` is a lexical diagnostic, **not BPE/model tokens**;
never compare it to cl100k budgets or silently substitute it.

```sh
node /path/to/diplodoc-review/scripts/retrieve.mjs .diplodoc-review/ledger.json \
  --root . --budgets 4000 > .diplodoc-review/retrieval.json
node /path/to/diplodoc-review/scripts/links.mjs .diplodoc-review/pages.json \
  --root /path/to/existing-build > .diplodoc-review/links.json
node /path/to/diplodoc-review/scripts/measure.mjs .diplodoc-review/ledger.json \
  --retrieval .diplodoc-review/retrieval.json --format report > .diplodoc-review/report.md
node /path/to/diplodoc-review/scripts/quality.mjs .diplodoc-review/ledger.json \
  --mode full --retrieval .diplodoc-review/retrieval.json > .diplodoc-review/quality.next.json
```

Capture source_snapshot with sources.mjs before these commands; see reproducibility.md.
Run at the project root and preserve the baseline while editing a working copy.
Accept quality.next.json as quality.json only after checks/blockers are complete.

Ledger/retrieval/baseline JSON inputs must resolve
to regular files within the current directory or its descendants; symlinks
cannot escape that boundary. `measure.mjs` without retrieval evidence
still computes FCR/ERR/CCR/EPR/LHR. `--format markdown` gives a shorter summary;
`--format json` gives machine-readable metrics. The full report's JSON appendix
contains the ledger and retrieval objects for arithmetic replay; replay does
not independently prove the annotations or product observations.

The search fingerprint covers source revisions, eligible IDs, queries, gold
and corpus paths.
Evidence text, example/link observations and CORRECT-to-CONTRADICTED relabeling
do not require reranking; the aggregator refreshes correct-only Recall/TTC from
the current labels. Reuse requires unchanged corpus contents and protocol,
verified against recorded source revisions/file hashes. Changes to corpus,
queries, gold or eligible facts require fresh retrieval. Older retrieval files
without this fingerprint retain strict whole-ledger matching.

## EPR and LHR collection

For EPR, inspect candidates, fix source fingerprints and assert expected behavior
in isolated fixtures with the pinned product. Exit=0 is insufficient. Do not run
mutable document lines through a shell or inherit unnecessary secrets. Mark
unavailable environments NOT_TESTABLE; give coverage and configuration differences.

`links.mjs` reads an explicit manifest such as
`{"pages":["ru/settings.html"],"base_url":"https://example.org/docs/"}`.
Choose pages before inspecting findings. Give the actual publication root when
known; otherwise the helper uses a synthetic build prefix and leaves targets
outside it unchecked. It parses existing built HTML with `cheerio`, including
Diplodoc's embedded article state, and respects `<base href>`. Exact local files,
HTML routes and anchors are checked offline; external or unreadable targets stay
UNCHECKED. Contact URIs and hidden generated permalinks are listed/excluded by
the declared protocol. Unsupported unrendered page formats fail explicitly.

Retain the manifest and inventory hashes; copy its `links` array to the ledger.
Occurrence IDs preserve repeated hrefs at different positions. Reuse an inventory
only while source/target hashes and publication protocol match. `promise` is a
candidate source context, and semantic observations start UNKNOWN. Inspect the
actual target, record RELEVANT/IRRELEVANT with evidence, or NOT_APPLICABLE with a
specific reason for links without an information promise. Inspect external
links with available permitted tools or record a blocker; do not infer success
from their presence. Unknown and inaccessible links remain in coverage counts.

For LHR-T, reuse yfmlint/build results with a checked-occurrence denominator;
no diagnostics alone does not prove link health. For LHR-S, compare each source
promise with the resolved target's actual content in the same publication.
A redirect alone is not a defect; technical inaccessibility does not prove
semantic irrelevance. Report checked/applicable coverage and unknowns. Keep
unavailable observations unknown; use N/A only when there is no applicable
information promise. Do not invent observations merely to fill rates.

`quality.mjs` emits scope/revisions, raw measurements/evidence, recommendations,
profile hashes and one assessment. Unmeasured FCR leaves DSQ and tier null.
Recall is correct-only and TTC censors misses at 4000. Lexical diagnostics
cannot provide BPE costs. Evidence defaults to three problem-first excerpts
per metric, up to 2000 characters each. Adjust with `--evidence-limit` and retain
the full ledger. Integration adapters consume
`measurements`/`explanation`/`recommendations` and `profile.inventory_hash`.
The helper makes no network calls. Valid inputs emit JSON even when unfinished:
exit 3 means unfinished checks, 0 completed/explicitly blocked, 2 invalid input.
Short mode emits no DSQ. Report blocked runs with remaining checks/evidence;
a concrete conservative score does not make a blocked audit complete.

## Compact output

Give a scoped conclusion, metric table, DSQ/tier when available, up to five
prioritized problems with sources/corrections, and protocol/limitations. Include fractions,
N/A reasons, found/censored TTC and checked/eligible coverage. Retain full
evidence in artifacts or the replay appendix; reference helper versions/commands.
