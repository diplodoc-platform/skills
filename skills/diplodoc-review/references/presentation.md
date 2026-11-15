# Presentation, structure and delivery

These K01–K24 questions preserve the research's normalized criterion IDs.
They are candidates for diagnosis, not independent proven laws or score weights.
Apply a question only where the documented mechanism exists. Distinguish a
confirmed contradiction from a plausible usability risk and an optional edit.

## Task path and publication

Trace the target task from the intended entry point: navigation/search,
prerequisites, rule, action, result and verification. Check meaningful headings,
links, anchors, examples and cross-page conditions in that path. For a sampled
review, identify the selected tasks/pages and the uninspected remainder.

For Diplodoc, establish source versus built content, TOC scope, language,
audience, presets/conditions, includes and visible navigation. A reusable include
does not need to be a standalone TOC page. An intentionally excluded or hidden
page is not automatically an orphan. Follow a referenced condition through the
actual publication before declaring it missing. Resolve anchors with the host's
rules; do not assume every host uses the same slug algorithm.

When available, use yfm for markup, diplodoc-project for publication structure
and diplodoc-cli for build diagnostics. Otherwise inspect the corresponding
versioned configuration/schema/source. This review does not require those
skills or an internal MCP service to be installed.

## Criterion map

| ID | Question to investigate | Evidence boundary |
| --- | --- | --- |
| K01 | Must the reader reconstruct a necessary final state or derived consequence? | An explicit derived result may help a concrete task; one synthetic effect does not generalize to every inference. |
| K02 | Does a numeric representation match the interface and permitted tools? | Large hex conversions without tools do not establish a general decimal-only rule. |
| K03 | Are keys explicitly paired with values, or recoverable only by list position? | Show the ambiguous or error-prone mapping; list length alone is not a confirmed error. |
| K04 | Is the rule's applicability qualifier available where the rule is used? | A shared qualifier or footnote can be correct and efficient; distinguish qualification from separate dependent rules. |
| K05 | Is normative precedence explicit, including when display order differs? | Explicit numeric priority can remain unambiguous with reversed rows; identify actual ambiguity or observed risk. |
| K06 | Are negative conditions scoped correctly? | Negation is not inherently worse; direction of historical effects varied. |
| K07 | Can terms, aliases, translations and canonical interface names be linked? | Accept valid synonyms; a literal-match scorer's rejection is not evidence of misunderstanding. |
| K08 | Can the reader combine separated dependent rules? | Distinguish distance from truncation, missing delivery, absolute position and task irrelevance. |
| K09 | Is the decision procedure sufficient to apply the rules? | A procedure and declarative rules can both work; no universal algorithm-over-prose preference. |
| K10 | Can the reader assemble all jointly required conditions? | A checklist repeats prerequisites; it is different from adding a new rule or derived result. |
| K11 | Is there a usable navigation/search path to required information? | Full-context delivery cannot test search or link-following effectiveness. |
| K12 | Do exact repeats add a purpose or unnecessary input? | Report measured input cost separately; repeats do not establish lost understanding. |
| K13 | Is a necessary block delivered and discoverable at its location? | Position effects are not universal; distinguish a moved block from context truncation. |
| K14 | Are operations, versions and audiences kept distinguishable across rule groups? | Interleaving with clear labels is not inherently incorrect; do not invent version behavior. |
| K15 | Is an inclusive/exclusive boundary unambiguous in words or symbols? | Preserve the comparison and units; correct symbolic and verbal forms are both acceptable. |
| K16 | Is the universe closed before absence is interpreted as prohibition? | An incomplete allowed list does not imply all other combinations are forbidden. |
| K17 | Are jointly applicable factors combined correctly? | A factorized table must preserve every relevant combination and exception. |
| K18 | Does hierarchy express the intended grouping and scope? | Flat structure can work; broken anchors and lost scope are separate concrete defects. |
| K19 | Are requirements and recommendations distinguishable? | Preserve modality; do not promote a recommendation to a mandatory prerequisite. |
| K20 | Can table axes and labels be read reliably for the task? | Transposition has no established universally better direction; raw and rendered tables differ. |
| K21 | Does a table or linear explanation preserve named relations? | No general preference for tables or prose; compare actual facts, defaults and negative cases. |
| K22 | Is the example's status, version and relation to a boundary recoverable? | A correct global registry can replace a local label; adding labels can merely add input. |
| K23 | Can wording be shortened without losing distinct facts or qualifications? | Length is not a semantic quality score; distinguish verbosity from a new explanation. |
| K24 | Does task-irrelevant context obscure or increase the cost of needed material? | Extra supplied text increases Input; a comprehension or retrieval effect requires separate evidence. |

## Additional questions retained from the extended bank

These unresolved candidates and ambiguous mappings are not silently merged
into K01–K24 or counted as additional confirmed effects:

| Research ID | Check | Important distinction |
| --- | --- | --- |
| C46 | Direction of implication and necessary/sufficient conditions | Not merely negation or a preference for explicit conclusions |
| C47 | Universal/existential quantifiers | Every, any and at least one must retain their meaning |
| C48 | AND/OR grouping and parentheses | A clarifying formula can also add repetition; separate those changes |
| C50 | Cardinality and exclusivity, such as exactly one or XOR | An explicit exclusivity label and a table change are different interventions; do not infer a closed universe |
| C52 | Pronoun and cross-reference antecedents | A unique referent is different from an alias dictionary |
| C53 | Formal notation for a relation, such as an arrow with a legend | A change in notation is different from reordering procedural steps |
| C74 | A calculation expressed as a formula or prose | Preserve units, operators and scope; this is distinct from changing numeric encoding or boundary inclusion |
| C84 | A ready serialized literal versus rules for constructing it | Escaping layers and a precomputed answer can change the information supplied, not merely presentation |
| C86 | A formal procedure derived from a prefix or ordering rule | Check whether the procedure materializes a consequence or changes the formalism; do not assume a new normative order |
| C88 | Informative page/section titles | Search value differs from hierarchy or link existence |
| C95 | Meaning carried by note/warning/container styling | Compare raw and rendered delivery; a visual container alone is not a new fact |
| C96 | Includes, variables and preprocessing | Raw source may require assembly that a rendered page already provides |
| C97 | Tabs versus labeled sections | Interactive visibility and raw-source availability are different delivery conditions |
| C98 | A rule carried by a code comment or adjacent prose | Preserve executable code and inspect where the product rule is available; this differs from moving a whole example |

## Interpreting a presentation finding

Identify the actual reader interpretation and its consequence. If a complete
table is correct but another layout might be easier, label the suggestion as
optional or a usability risk and explain the relevant task. Preserve semantic
closure when proposing edits: retain all conditions, negative cases, defaults,
scope and unique examples. Adding a new fact and rearranging an existing one
are different interventions. In the extended bank, C99 (fixing an actual
contradiction) and C100 (supplying a missing fact) explicitly change content;
they are not semantics-preserving presentation comparisons.

When a reader fails, trace where the necessary rule was lost: absent from the
document; excluded from the corpus/publication; not retrieved; truncated by a
tool; available but misinterpreted; correctly understood but applied wrongly.
An opened file does not prove every required paragraph was delivered or used.
Fixing a retrieval limit and changing prose address different causes.
