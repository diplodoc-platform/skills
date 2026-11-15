# Measurements and saved-run interpretation

Load this before assigning numbers or interpreting a benchmark. The metric
names below follow the review brief's terminology; they are not a claim of a
universal industry standard. Confirm the definitions in use. A requested
acronym alone does not justify substituting another convenient measurement.

## Prerequisites and operational definitions

| Name | Possible declared calculation | Required evidence and boundary |
| --- | --- | --- |
| FCR, necessary-fact coverage | Covered required facts / all required facts in scope | Independently justified inventory, necessity, stable atomic units and coverage labels. Missing/incorrect/uncertain stay visible. |
| ERR, erroneous-claim rate | Contradicted extracted claims / all extracted claims | Verified claim extraction and source-based labels. Unsupported is separate; ERR is not automatically `1 - supportedRate`. Unextracted claims limit whole-document inference. |
| CCR, condition coverage | Covered applicable condition cases / inventoried applicable cases | Explicit condition/exception inventory and a declared unit, such as rule-condition or behavioral case. Mere mention of a condition is insufficient. |
| Recall, retrieval completeness | Relevant items returned at the declared cutoff / relevant gold items | Query/task, relevance labels, corpus/version, item granularity, cutoff and retrieval protocol. Full-context input does not measure retrieval Recall. |
| TTC, retrieval cost in this rubric | Declared search time, tokens, calls or steps required to locate needed information | Search boundary and events; separate successful, failed and censored searches. Declare the unit. **Total run tokens are not TTC.** |
| EPR, example execution success | Examples meeting the expected outcome / executed eligible examples | Actual executions, environment/version and expected behavior. Also give executed/eligible coverage; a small tested subset does not establish all examples work. |
| LHR, checked-link health | Valid targets/anchors / checked links | Link inventory and actual resolution/check results for the relevant publication. Also give checked/discovered coverage. Distinguish broken, restricted, redirected and unchecked targets. |

These are operational choices, not retroactively established formulas for the
research corpus. If a different definition is supplied, preserve it and state
its scope. Do not silently redefine TTC as total token consumption.

Use `measured`, `not_measured`, `inconclusive` or `not_applicable` with a reason.
An empty or unknown denominator yields no rate. Zero executed examples or
checked links means unmeasured, not 0% or 100%. A genuinely inapplicable metric
is not a failed check. Without a closed relevance set, do not report Recall.

For a rate, give numerator, denominator, unit, source/version, selection scope
and unknowns. A score over a sampled or model-extracted inventory is conditional
on that inventory's adequacy. Do not change fact granularity to improve a rate.
Report facets separately rather than assigning arbitrary weights to one score.

## Keep evaluation layers separate

- Mechanical checks: parse/build, patch application, allowed paths, literal
  checks, link resolution and exact quote validation.
- Semantic assessment: necessary-fact coverage, claim truth, conditions,
  retained knowledge and observed task behavior.
- Procedure outcome: valid response, completed run, unresolved items,
  applicable policy, and final acceptance decision.

A model judge's raw PASS can coexist with issues or an overall failed check.
Inspect the actual issues and the gate definition. Different historical
evaluators used different gates. A regex match may miss an incorrect
qualification or reject a valid paraphrase. A real quote may not support the
claim attributed to it. A frozen test can pass while missing a boundary defect.

Preserve the original primary result and report later diagnostics separately.
Do not rewrite historical scores after seeing a new test. A manually reviewed
case, a model-generated label and an independently checked reference have
different evidential status.

## Cost, failure and comparison

Keep Input, Output, separately reported reasoning usage, Total, latency,
search/read calls and task success distinct. Verify the provider's definitions:
reasoning may be included in Output; unavailable usage is unknown, not zero.
If only Input+Output is available, label their sum as derived. Extra Input is
not evidence of extra reasoning or worse comprehension. Runtime can change
because of cache, concurrency, service capacity or tools.

Track planned, started, completed, technically valid, scored and paired units.
Timeouts, invalid output schemas, inaccessible sources and interrupted starts
are technical missingness, not semantic errors. Keep format errors separate
from content errors where the evaluation distinguishes them. Do not silently
retry failures or erase attempted runs. Review requests do not authorize new
model trials, searches or execution beyond the user's existing scope.

For comparisons, record task/document, model, tools, context regime, prompt,
budget, repetitions and source versions. Repeated answers to one task or PR
are clustered observations. Shared baselines and reused controls are not new
independent tasks. A/A noise, ceiling effects, small samples, changed protocols,
early stopping and multiple comparisons limit interpretation. Do not pool
incompatible protocols as a causal effect or select a successful posthoc
contrast as confirmatory evidence.

Historical A/B/C/D labels are operational protocol categories, not universal
quality grades or significance tests. Consult their exact success, cost and
repetition thresholds. A cost category may be driven only by Input; an
inconclusive category is not proof of no effect. Preserve any multiplicity
correction and distinguish exploratory from confirmatory observations.

## Attribution before conclusions

Distinguish rule existence, delivery, retrieval, interpretation and application.
A log that a file was opened does not establish attention, understanding or
use of the target norm. A defect outside the changed rule does not establish
that the presentation change caused it. A run's success can reflect task hints
or prior knowledge rather than documentation use.

Before attributing a difference to representation, check that the target rule
was needed and delivered, and that tasks, output interfaces and complete
behavioral meaning were comparable. A changed interface requirement, an
omitted semantic dependency or a task that already supplies the answer can
invalidate that interpretation even when the run itself completed correctly.

Observational task logs can suggest issues and supply realistic cases. Without
appropriate comparisons and independently checked outcomes, they do not
establish universal document quality, causal effects or criterion weights.
Absence of a detected effect is not proof of equivalence or no effect.
