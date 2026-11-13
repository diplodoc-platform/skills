---
name: diplodoc-transform-v5-migration
description: >
  Migrate @diplodoc/transform from v4 to v5 in an application or library,
  estimate the upgrade, or finish a partial migration (EN or RU: upgrade
  Transform to 5, миграция Transform 4 на 5). Covers parser integrations,
  plugins, document ownership and browser assets. Legacy @doc-tools/transform
  versions 2.x/3.x need a separate baseline assessment before this migration.
---

# Migrating @diplodoc/transform from v4 to v5

Use the full migration guide for API details and examples; this skill supplies
the workflow for applying it to a consumer without losing its existing choices.

- **Estimate:** read the guide, perform preflight and inventory, then report the
  plan and blockers without changing files, dependencies or lockfiles.
- **Migrate:** perform all steps within the requested application/library scope.
- **Resume:** inspect the existing diff and installed graph first. Preserve the
  chosen target, compatibility settings and completed work unless evidence shows
  a defect; do not restart the migration or replace its decisions with defaults.

## 1. Read the authoritative guide

Read this document **in full before planning migration edits**:

https://raw.githubusercontent.com/diplodoc-platform/transform/be2503cff30911c645a7fa618a2db89522e3a46f/docs/migrations/transform-5-ru.md

Fetch the raw Markdown, not a search excerpt. Record its source/revision where
available and the target package version. Read linked detailed contracts when the
inventory touches them. If fetching fails, use a supplied complete local copy.
If neither is available, limit work to read-only preflight and report the missing
guide; do not reconstruct target defaults from memory or this skill.

The guide describes the major-branch contracts; check them against the actual
target's exports and dependencies. A local guide or release branch does not prove
that its packages are published.
For Transform 5 behavior, use the target guide over general YFM/CLI examples that
may describe another host or version. Do not transfer those new defaults to an
unchanged v4 editor or CLI integration.

## 2. Preflight: versions and owners

Determine the package manager from project configuration and lockfiles, its
workspace boundaries and installation policy. Use its native dependency and
registry inspection commands (`npm ls/view`, `pnpm why/view`, or the applicable
Yarn equivalents), then inspect the resolved package manifests from each host.
Record:

- Declared, locked and installed Transform versions, Node/build/CI versions
  (Transform 5 requires Node.js 24+), module format and entrypoints.
- Every Transform consumer: server/CLI renderer, browser renderer, validator,
  editor, UI library, tests and asset producer. Include custom MarkdownIt instances,
  plugin factories, type augmentations and the actual MarkdownIt/types versions.
- Dependencies and peers of the selected target and each participating extension;
  distinguish a published compatible release, an owned local adaptation, an
  unavailable release and an unchecked registry/package source.
- Who supplies each renderer's parser, browser runtime, stylesheet and copied
  assets, including prebuilt client packages and indirect Page/HTML integrations.

This skill covers a genuine v4 baseline. For `@doc-tools/transform` versions
2.x/3.x or other older installations, first assess their API, document and
dependency differences separately. Do not blindly rename packages and call that
a 4→5 migration.

**Allow real 4 and 5 to coexist.** Unrelated UI/editor peer contracts may require
real Transform 4 while an owned renderer or validator moves to 5. Verify resolution
from each owner, including nested dependencies. An npm alias can name an additional
real v5 dependency; it cannot make v5 satisfy a v4 peer or prove which renderer runs.
Do not force every workspace to v5 or move unrelated Gravity/UI providers.

**Availability is a gate.** Transform `5.0.0-beta.1` and its coordinated extension
betas are published under `transform5`; use the exact versions in the guide when
updating direct dependencies. Stable major ranges do not include beta versions.
Stable Transform `5.0.0` is not published. Legacy-host compatibility patches and
prebuilt consumer assets have their own release status; the Core beta does not
prove their availability. Recheck the configured registry for each required
package. A
missing release or unresolved required peer blocks normal adoption; report the
exact package/range and continue independent assessment. Do not fabricate versions,
publish missing packages, or use `--force`, peer bypasses, disguised aliases or
`skipLibCheck` as a compatibility repair. A local candidate experiment can be
reported separately but does not establish completed published-version migration.

## 3. Inventory and plan

Identify owned source roots, workspaces, configuration, tests, fixtures, authored
Markdown and stylesheet/asset pipelines; exclude dependencies and generated output
from source edits. Search those bounded roots using the guide's checklist. Useful
additional search seeds are:

```text
@diplodoc/transform | @doc-tools/transform | markdown-it
DefaultPlugins | pluginConfiguration
enableMarkdownAttrs | highlighter | highlightLangs | inlineSvg | svgInline
parseDocument | compileDocument | md.meta | md.assets | md.included | collect
notesAutotitle | directiveSyntax | generateID | runtime | yfm.css | dist/js
```

Inspect callback arrays and identity-based filters, not just matching imports.
Inspect syntax fixtures for attributes, code fences, tables, image dimensions,
Cut/Notes/Tabs, footnotes, tasks and nested includes. Determine what the existing
typecheck excludes: JavaScript, tests and asset copying can pass unnoticed.

Capture representative pre-change HTML and metadata before editing; when resuming,
reuse an existing trustworthy baseline. For each affected contract, record
files/owner, current behavior, intended change
or compatibility setting, dependency blocker and a concrete verification. Retain
explicit settings such as disabled note titles, sanitizer policy and callback
selection. Ask only for unresolved product choices that materially change behavior;
routine authorized edits do not need repeated approval.

For **Estimate**, stop here and report this plan, dependency readiness, effort
drivers and unknowns. Separate parser work, custom plugins, source rewrites and
browser/asset integration; do not promise completion while releases are unavailable.

## 4. Apply the selected migration

Use the project's package manager to install the agreed published target and
compatible direct dependencies, updating the normal lockfile. Preserve the
project's existing branch/worktree conventions and unrelated edits.

Work by affected contract, using the full guide rather than global replacements:

- **Imports and plugins:** use public exports. A supplied legacy `plugins` array
  replaces the default list. Preserve custom callbacks, order, options,
  `generateID` and `.collect` identity/descriptor. Extension factories create new
  callback identities: adjust identity filters deliberately. Do not combine a
  legacy array with named configuration or add builtins the host never selected.
- **Defaults:** general Markdown attributes are off in v5; opt in when preserving
  the corpus requires it. Highlighting needs an explicitly loaded implementation
  and synchronous adapter; installing Highlight.js alone is insufficient. Follow
  the selected version's ESM paths. Keep sanitizer and SVG limits intact.
- **Documents:** migrate metadata writers and readers together to document-owned
  environments. Keep parse handles, correct fragment/include/reference purposes,
  cache/source ownership and failed-child rollback. Verify footnotes across roots
  and includes; do not share state between unrelated documents.
- **Resources:** preserve each host's resource owner. Do not add standalone
  Cut/Tabs/Notes bundles or CSS over a runtime/style bundle that already owns them.
  A root parser bump does not replace prebuilt client JavaScript, CSS or copied
  manifests: rebuild or select compatible assets and verify their actual contents.
- **Source syntax:** retained syntax and deprecations do not require rewriting the
  corpus. Apply conservative migrators only to selected owned files when that
  conversion is in scope; inspect refusals and diagnostics. Preserve protected
  examples, ambiguous cases and sources belonging to others.

## 5. Verify behavior and report

Perform a normal reinstall from the resulting manifests/lockfile and inspect the
final installed graph and owner-specific resolution again. Verify the target's
actual imports (CJS/ESM/browser as used), custom plugins and strict declarations.
Report known baseline errors separately; suppressing them is not a passing check.

Run the relevant existing typecheck, lint, build and tests. Compare representative
v4/v5 output and document metadata/resources for the affected contracts, including
reused parsers, includes, footnotes, highlighting and retained syntax. Change test
expectations only for explained intentional changes; investigate other failures.

For browser consumers, inspect the built/delivered runtime and CSS version and
exercise affected controls in the actual integration: Cut/Notes/Tabs, task state,
footnote/history behavior and relevant light/dark styles. Check duplicate handlers
and resources. A successful parser test, build or HTTP response does not prove the
browser bundle, asset route or live deployment has migrated.

Report target and resolved versions per owner; changes and preserved decisions;
intentional v4 consumers; dependency/release blockers; checks and their evidence;
baseline failures and checks not run. Claim completion only after a published
target is normally installed and the requested scope is verified. State separately
when changes are prepared or only a local candidate was validated.
