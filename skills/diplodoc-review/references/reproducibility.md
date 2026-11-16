# Reproducible project audits

Use one accepted registry in `.diplodoc-review/` for the product and declared
scope. Its size follows the product; percentages and weights stay proportional.
Independent first-time model judgments can differ. Exact replay requires this
shared registry, not a new sample or new semantic labels on every invocation.

## Units and verdicts

Each fact has `unit: {subject, property, when: {}}`. Use the public API/config
identity for `subject`, one independently falsifiable property, and the actual
predicate for a conditional case. Duplicate tuples are rejected. `condition`
must equal whether `when` is nonempty; the reviewer cannot choose it separately.

- `lint.enabled / default / {}` and `lint.enabled / result /
  {"cli.--no-lint": true}` are two units; only the second contributes to CCR.
- A complete enumeration is one set, not one unit per value. Minimum, maximum
  and default are separate properties. An alias or translation is not a new
  fact. Different predicates or observable results are separate cases.
- CORRECT requires the declared property under its exact conditions. MISSING
  requires a recorded search. CONTRADICTED needs an opposing normative claim
  about the same product/interface/version; AMBIGUOUS is not a confirmed error.
- EPR uses a fixed executable snippet plus its expected outcome. Reuse grouped
  translations. Apply the documented setup/context; unavailable dependencies or
  credentials are NOT_TESTABLE, not FAIL. A deliberately invalid example passes
  if it produces the documented rejection. Exit=0 alone is insufficient.
- For LHR-S quote the link's governing promise and inspect its target. A link
  labelled "configuration file" can promise the file's identity/location, not
  details of every setting mentioned nearby. "Details of parameter X" requires
  those details. Generic topic overlap cannot satisfy a specific detail promise.
  Keep an unclear promise unknown; do not invent a requirement or a success.

The helper validates structure and consistency; it does not prove semantic truth.
If new evidence contradicts an accepted verdict on unchanged inputs, preserve
the old artifact and explicitly recalibrate with the correction and its evidence.

## Source manifests and dependencies

Create a fixed `sources.json` from the audited corpus and relevant product
sources/configuration/lockfiles. It contains repository-relative path arrays:

```json
{
  "documentation": ["docs/guide.md", "docs/.yfm"],
  "product": ["src/config.ts", "package.json"],
  "external": [],
  "environment": {"cli": "5.67.2", "tokenizer": "js-tiktoken-1.0.21"}
}
```

Include all retrieval files and renderer/publication inputs. `external` can
contain frozen response fixtures when external targets affect the audit. Record
real version/capability tokens, never prose, timestamps, report paths or random
generated IDs. The helper records actual Node and SHA-256 bytes, sorts paths,
rejects traversal/symlink escapes and represents deleted declared files by null.
Preserve source selectors; extending scope is an explicit recalibration.

Facts/examples/links may declare `dependencies` with the same three namespaces.
`["*"]` means the complete namespace. Missing dependencies conservatively mean
the whole snapshot; an explicitly empty dependency set is rejected. References
must exist in the manifest. A file path alone is not a claim of a complete closure:
include imported behavior, configuration and the scope of any corpus search.
MISSING and assertions relying on absence of any opposing claim need the whole
search scope, not just citations. Inspect changed files for newly relevant claims;
expanding an existing check's dependency graph requires explicit recalibration.

Examples/links also require `origin`, the namespaced source inputs that determine
their presence/definition: source pages and relevant publication configuration.
Include all grouped snippet pages; a link target belongs in dependencies, not
in origin unless it is also a source. Origin is automatically included in inputs.
Changing a target permits rechecking relevance, not deleting an unchanged link.

Before retrieval, capture the actual inputs into a working ledger:

```sh
node /path/to/diplodoc-review/scripts/sources.mjs .diplodoc-review/ledger.json \
  --manifest .diplodoc-review/sources.json --root . \
  > .diplodoc-review/ledger.next.json
```

Accept this working copy as ledger.json, then run retrieval and quality. A separate
`--product-root` or `--external-root` may locate inputs outside the documentation
workspace; absolute locations do not enter identity. JSON inputs still stay in cwd.

## Acceptance and updates

`quality.mjs` checks the accepted `.diplodoc-review/quality.json` by default.
Unchanged inputs preserve definitions, statuses, applicability, gold and bindings.
Advice/evidence wording can change. Rebuilding identical source HTML or rewriting
diagnostic `revisions` does not change identity. Baseline checks compare per-check
dependencies; editing one source does not unlock unrelated verdicts. Dependencies
and origin themselves remain fixed until explicit recalibration.

Changed source permits updating its derived observations and gold coordinates;
only changed origin permits adding/removing examples or link occurrences. A fact's
product definition requires changed product inputs. Queries and required unit
membership remain fixed. BM25 retrieval is recomputed globally when its corpus
changes; changing rankings does not authorize changing unrelated semantic labels.

Keep the accepted ledger/quality together and write quality.next.json before
replacement. `--recalibrate` is for an explained new registry/scope or corrected
evidence; it never bypasses input validation. Do not use it to silence a replay error.
Legacy ledgers retain the same arithmetic with `quality.mjs --replay`, marked
`guarded:false`; they cannot become a protected baseline. Migrate once by adding
source_snapshot, units and dependencies without changing verdicts, then explicitly
accepting that profile. Full mode requires a protected source snapshot.
