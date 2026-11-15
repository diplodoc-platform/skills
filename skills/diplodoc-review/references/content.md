# Content and update-review rubric

Use this for correctness and completeness. Content is evaluated relative to a
reader task and a versioned domain, not every conceivable fact about a product.

## Optional qualitative route

For a page or narrow change, establish the audience, product/version and
publication variant. Trace two or three reader tasks through prerequisites,
action, expected result and verification. State the sample. Distinguish raw
Markdown from rendered content and expanded includes.

Identify obstacles, then verify each against the same product scope. Check
equivalent wording and counterexamples; search beyond the first passage before
calling knowledge missing. With documents alone, assess internal consistency
and usability while leaving external product truth unverified.

For each substantive finding give its classification (confirmed defect,
evidence gap, usability risk or optional edit), priority, reader consequence,
document and supporting source locations, minimal correction and limits.
Critical priority requires a supported severe consequence, such as data loss.
Group repeated manifestations and sort by impact. Preserve valid facts,
conditions, units and modality. For examples, check every advertised runtime
and explicitly suggested parameter/configuration edit. Report important
untested areas; a style preference alone is optional.

## Build a justified fact inventory

One required fact contains one independently assessable behavior, its relevant
conditions, the reader need and its evidence. A condition and its resulting
value can form one fact; two independently wrong answers to different reader
questions usually need two facts. Keep the granularity stable across candidates.

| Field | Record |
| --- | --- |
| `id` | Stable identifier within the review |
| `statement` | Observable behavior, value or restriction with conditions |
| `necessity` | What the target reader cannot do or will do incorrectly without it |
| `critical` | Whether error/omission changes an essential way of using the product for this task, with a reason |
| `sources` | Document/code/spec location, revision, exact supporting quote and scope |

Rubric criticality identifies task-critical knowledge; it does not automatically
assign the report's highest severity. Rank each finding by its actual reader
consequence. Marking almost every fact critical adds little discrimination.
Preserve a saved rubric's declared labels when reporting historical results;
justify labels independently when constructing a new inventory.

For each relevant area, record `covered`, `not_applicable`, `missing` or
`uncertain`. Missing/uncertain areas limit acceptance of the inventory itself;
they are not automatically defects in the document being judged.

| Area | Questions |
| --- | --- |
| Activation and defaults | How is it enabled/disabled? What happens with no value? |
| Configuration | Which field/flag, owner, type, values and precedence apply? |
| Result | What is produced, where, in which format, with what observable effect? |
| Boundaries | Inclusive/exclusive limits, missing input, root/nested objects, exceptions? |
| Interactions | Other settings, caller and consumer behavior, fallback and error paths? |
| Compatibility | Which version, changed behavior, migration and retained instructions? |

Read the actual source that supports a requirement. A generator's analysis,
accepted PR, repaired candidate, model agreement or historical rubric is a
lead to inspect, not independent ground truth. Trace configuration through its
consumer where the outcome depends on call order, merge logic or fallback.

With documentation only, review internal consistency, usability and coverage
of explicitly requested tasks. Mark product correctness and completeness
against an unavailable external contract as unverified. An absent feature in
a bounded source excerpt does not establish its nonexistence elsewhere.

## Two complementary checks

**Required-fact coverage:** classify each required fact as `covered`, `missing`,
`incorrect` or `uncertain`. Check the rule with its conditions and defaults;
keyword presence is insufficient. A citation to another accessible page can
cover a fact if it is actually available to the intended reader.

**Written-claim verification:** inspect the claims the candidate actually makes,
including claims outside the expected inventory. Classify them as `supported`,
`contradicted` or `unsupported`. A contradictory claim requires evidence that
negates it in the same version and scope. Unsupported is not a synonym for
false. Count the same defect once in a headline total when fact and claim
records refer to the same problem; do not sum overlapping critical counters.

Coverage of all required facts can coexist with a dangerous invented option.
Conversely, every written statement can be supported while an essential step
is missing. Neither check substitutes for the other.

## Concrete semantic probes

Use applicable probes, not mandatory extra requirements for every document:

- **Defaults and overrides:** absent, explicit false, zero, empty and invalid
  values; CLI/config/environment precedence; selected profile versus global defaults.
- **Scope:** operation, object, nesting, version, language, role and audience.
  An import limit need not authorize a processing mode. A root-only option
  should not become a recursive promise.
- **Logic:** necessary versus sufficient conditions; AND/OR grouping; every
  versus any; negation scope; closed versus open lists of allowed combinations.
- **Limits:** units, conversion, inclusive boundaries, rounding, date/time zone,
  numeric representation and what the downstream interface actually accepts.
- **State and sequence:** initial versus final state; an existing capability
  versus one added by the change; stale cache, repeated calls, rollback,
  retries and partial failure. Two error paths may have different fallbacks.
- **Norm strength:** mandatory versus recommended; a conservative suggestion
  need not redefine product eligibility. Do not turn SHOULD into MUST.
- **Examples:** match the stated rule, version, conditions and expected output.
  Distinguish illustrative pseudocode from runnable examples and historical
  from current examples. An example does not establish behavior for all cases.

For finite decision tables, enumerating the relevant combinations can expose
a wrong factorization or precedence. If a tool calculation is needed, preserve
the operator, units and inputs rather than relying on mental conversion.

## Reviewing an update

Compare source behavior before/after, documentation before/after, and the
requested change. Identify each contradiction's origin:

| Origin | Meaning |
| --- | --- |
| `introduced` | The candidate newly asserts a wrong rule |
| `inherited` | The same wrong assertion was already present |
| `outdated` | Previously correct text no longer matches changed product behavior |
| `uncertain` | Available revisions do not establish the history |

Preserved text still needs verification. Removed claims are absent from the
current candidate, not current false claims. Check that removing a defect did
not remove unique valid knowledge, conditions, links or a necessary example.
Do not infer origin by subtracting total error counts before and after.

Classify actual diff fragments as related, unrelated or uncertain when update
scope matters. Keep formatting/content/mixed changes distinguishable. A
whitespace policy violation and a wrong API guarantee have different reader
consequences. An unchanged document can be the correct outcome when the
requested behavior was already documented.

## Evidence checks before reporting

Confirm the quote, location and revision; then check that the quote actually
supports the conclusion. Exact quote matching alone does not establish the
meaning of a rule. A stale source, ambiguous contract or failed extraction can
invalidate the evaluation without making the candidate wrong.

When several passages produce the same bad action, group their manifestations
under one root finding and list affected locations. Report an unsupported
requirement as an evidence gap with the missing authority needed to resolve it.
