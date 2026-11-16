# Quantitative product-contract audit

Assess documentation against verified product contracts and a declared inventory.
Use local checks without new LLM trials. Consult
[measurements.md](measurements.md) for saved-run interpretation and comparisons.

Prioritize fact correctness, condition coverage and meaningful example checks.
Full mode completes every metric phase in the declared scope. Link quality
has technical (LHR-T) and semantic (LHR-S) components; preserve both denominators.

## Procedure

1. Record the selected documentation, language/publication, relevant package
   revisions and existing dirty changes. For a metapackage record each involved
   repository, not only the parent HEAD. Distinguish built artifacts from source.
2. Enumerate relevant **public contracts from the product**: visible CLI options,
   exported API/schema fields, defaults, enumerations, conditions, overrides,
   exceptions and results. Select a bounded representative scope if exhaustive
   inspection is impractical. Hidden flags and internal classes are not required
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
intermediate inputs, fixtures and output; preserve the original documents.

## Efficient execution

Use one temporary workspace with a ledger, product observations and retrieval
output. The deliverable is a report, not a new audit framework.

1. Select functional areas from the public interface, record the inventory and
   corpus before labeling, and keep stable fact IDs and granularity. When
   comparing runs, reuse that profile (facts, languages, examples, link unit,
   queries and gold); report new discoveries separately. Flag-presence checks
   and behavioral contracts are different populations, not interchangeable
   ways to improve a percentage.
2. Inspect each area once: read targeted doc/code ranges, collect schema/default
   values together, and write evidence directly to ledger records. Batch
   independent probes and native build checks; keep complete logs in the
   workspace and return summaries plus failures to the model. Reuse installed
   product exports/tests instead of constructing a general-purpose harness.
3. For each example record the behavioral assertion, not just exit status.
   Inventory source-page link occurrences once with `links.mjs`, reuse build
   findings and inspect target content. Keep the fixed source-page scope and
   untested occurrences visible; do not collect only known broken links.
4. Freeze queries/gold, run retrieval once, then aggregate and generate the
   report with the commands below. Read summaries instead of full JSON ledgers,
   search results or bundled script source. For a single-file deliverable use
   `--format report`: it writes all six sections and a compact replay appendix.
   Edit only the narrative/headings for the requested language and findings;
   the generated appendix retains the full machine evidence without a second
   handwritten ledger, report generator or reproduction script.
5. Validate the final ledger/report once against the frozen inputs; rerun only
   checks affected by a changed dependency. A completed check is not repeated
   merely to rewrite its description. Source or publication changes require
   rechecking the affected observations. Do not narrow coverage to meet a time
   budget, hide UNKNOWNs or replace semantic assertions with exit=0.

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

Keep audited project dependencies unchanged. An installation restriction, failed
setup or unavailable required product version is a blocker with actual evidence.
Unprepared questions, gold or link inventories are unfinished work. Do not fetch
new product versions silently or remove difficult cases after labeling.

## Ledger contract, version 1

The helpers use Node.js 18.19+ and do not mutate inputs or execute document code.
They print results to stdout. Give `measure.mjs` a JSON object with:

- `schema_version: 1`, `scope`: a nonempty description of the inspected sample;
  optional `revisions` records source and publication versions.
- Optional `audit`: `{mode: "full"|"short", blockers: {"TTC": {reason, evidence}}}`.
  Full is the default. Blocker keys are metric names from the DQS table; cite an
  attempted check, access restriction, version probe or explicit user constraint.
  A convenience choice such as "not requested" is not a blocker. Each affected
  metric needs its own entry; blockers do not remove unknowns from score bounds.
- `facts`: normalized public-fact records. Required fields: `id`, `area`,
  `statement`, boolean `condition`, `status`, `product` source location,
  `documentation` location array, and `verification: {kind, evidence}`.
- Fact statuses: `CORRECT`, `MISSING`, `CONTRADICTED`, `AMBIGUOUS`, `UNKNOWN`.
  `UNKNOWN` has no verified denominator contribution; `AMBIGUOUS` assumes a
  known expected contract but an indeterminate document statement.
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

For example, a fact in the synthetic DocuBox fixture can be represented as:

```json
{
  "id": "profile-default", "area": "defaults", "condition": true,
  "statement": "The default profile is Standard", "status": "CORRECT",
  "product": "contract.md:5", "documentation": ["docs/guide.md:3"],
  "verification": {"kind": "literal", "evidence": "The supplied contract and page state Standard"}
}
```

This quantitative profile calculates FCR from verified **expected** facts,
ERR from `CORRECT + CONTRADICTED` documented facts, and CCR from verified
expected condition facts. Missing and ambiguous facts reduce coverage but are
not confirmed erroneous claims. UNKNOWN is separate. Keep additional unsupported
claims in the qualitative claim audit; absence of evidence is not contradiction.
Fractions are primary; a zero denominator gives N/A. The helpers report
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
Use `--tokenizer-module` for an existing module. Use the isolated setup above when needed and allowed. `--tokenizer unicode-words`
is a dependency-free lexical diagnostic; its counts are **not BPE/model tokens**
and cannot be compared to cl100k budgets or used silently as a substitute.

```sh
node /path/to/diplodoc-review/scripts/retrieve.mjs ledger.json \
  --root /path/to/project --budgets 4000 > retrieval.json
node /path/to/diplodoc-review/scripts/links.mjs pages.json \
  --root /path/to/existing-build > links.json
node /path/to/diplodoc-review/scripts/measure.mjs ledger.json \
  --retrieval retrieval.json --format report > report.md
node /path/to/diplodoc-review/scripts/quality.mjs ledger.json \
  --mode full --retrieval retrieval.json > quality.json
```

Run these in the temporary directory. Ledger/retrieval JSON inputs must resolve
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

For EPR, inspect each candidate before execution, fix its source fingerprint,
prepare a minimal isolated fixture and assert the expected behavior/content
with the installed product. Exit=0 alone is insufficient. Do not run a mutable
document line through a shell or inherit unnecessary secrets. Exclude unavailable
services, credentials and environments as NOT_TESTABLE. State tested/candidate
coverage and any difference from the normal product configuration.

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
unavailable observations N/A instead of adding machinery merely to fill rates.

`quality.mjs` emits common offline JSON: scope/revisions, explanation,
measurements with raw counts and evidence, and `dqs-v1` assessment. It uses
correct-only Recall@4000 and censors later/not-found TTC observations at 4000.
Lexical diagnostics cannot provide BPE costs. Evidence defaults to three
problem-first excerpts per metric (up to 2000 characters each); use
`--evidence-limit` to change that limit and retain the full ledger for replay.
An integration adapter may consume `measurements`/`explanation` and add its own
project/snapshot envelope. This helper performs no submission or network calls.
For valid inputs it emits JSON even when checks remain unfinished. Full mode
exits 3 for unfinished checks, 0 for completed
or explicitly blocked audits, and 2 for invalid inputs. Short mode (`--mode short`)
emits no DQS assessment. A blocked run must be reported as blocked, with its
remaining checks and evidence; do not describe it as a completed scored audit.

## Compact output

Default main body: a short scoped conclusion, one metric table with fractions
and N/A reasons, up to five problems grouped by consequence with doc/product
locations, and a short protocol/limitations paragraph. Aim for roughly 600
words of narrative when the requested scope permits. Give found/censored TTC,
correct-only Recall, and EPR/LHR checked/discovered coverage alongside the rates.
Optional full ledger goes into an authorized side artifact or compact appendix
when one self-contained file is required. User output constraints take priority.
Reference helper versions/hashes and commands instead of copying their code.
