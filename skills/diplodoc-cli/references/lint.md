# The YFM linter: YFM*/MD* rules and .yfmlint

Verified against @diplodoc/cli v5.55 (@diplodoc/yfmlint 1.9, markdownlint 0.32).

## How it works

- The linter is on by default; disable with `--no-lint` or `lint: false` in `.yfm`.
- It runs **only when building to HTML** (`--output-format md` is not linted).
- An `error`-level rule -> exit 1, the build fails. `warn` fails the build only
  with the global `-s/--strict`. `info` has no effect.
- Message format: `file: line: CODE / alias Description [details] [Context: "..."]`.

## YFM rules (14 of them)

| Code | Alias | What it checks | Default |
|---|---|---|---|
| YFM001 | inline-code-length | inline code length (option `maximum`, default 100) | warn |
| YFM002 | no-header-found-for-link | link anchor without a heading (effectively dormant in the current CLI) | warn |
| YFM003 | unreachable-link | broken link (file missing / file not in toc) | **error** |
| YFM004 | table-not-closed | unclosed multiline table | **error** |
| YFM005 | block-not-closed | unclosed/interleaved block: note, cut, tabs, changelog, if, for | warn |
| YFM006 | term-definition-duplicated | duplicate term definition | warn |
| YFM007 | term-used-without-definition | term without a definition | warn |
| YFM008 | term-inside-definition-not-allowed | term inside a term definition | warn |
| YFM009 | no-term-definition-in-content | term definitions not at the end of the file | **error** |
| YFM010 | unreachable-autotitle-anchor | broken autotitle `[{#T}](...)` | warn |
| YFM011 | max-svg-size | inline SVG above the limit (`--max-inline-svg-size`, default 2M) | warn |
| YFM018 | term-definition-from-include | term definition arrived via include | info |
| YFM020 | invalid-yfm-directive | unknown or malformed `{% ... %}` directive; option `customDirectives` whitelists your own | warn |
| YFM021 | no-non-bmp-characters | character outside the BMP (emoji, rare CJK - generation artifacts), may break layout | warn |

Codes YFM012-YFM017 and YFM022 are NOT lint rules - they are build diagnostics
(size limits, include/frontmatter errors) and cannot be configured via .yfmlint.
YFM019 does not exist.

## markdownlint rules (MD*)

- **All MD rules are DISABLED by default** (`default: false`) - enable them
  explicitly.
- MD001-MD054 are available (48 rules, markdownlint 0.32). MD002, MD006,
  MD055-MD059 do not exist in this version - config entries for them are
  silently ignored.
- **MD033 (no-inline-html) is not configurable via .yfmlint**: the CLI
  force-sets it from the `allowHtml` option (.yfm). Default `allowHtml: true`
  -> MD033 off; `allowHtml: false` -> MD033 error.

## The .yfmlint file

Lives in the **root of the build input folder** (next to the top-level
toc.yaml), not next to `.yfm`. Alternative - a path string in `.yfm`:
`lint: {enabled: true, config: path}` (relative to `.yfm`).

**An inline rules object in `.yfm` (`lint: {config: {YFM003: warn}}`) does NOT
work** - the implementation silently replaces it with the file contents.
Configure via the file only.

Format - YAML, two equivalent forms (can be combined; top-level wins):

```yaml
# form A: the log-levels block
log-levels:
  MD010: error          # enable no-hard-tabs as an error
  YFM003: warn          # downgrade unreachable-link to a warning
  YFM018: disabled      # turn off
  YAML001: error        # link check in index.yaml leading pages (off by default!)

# form B: rules at the top level; use an object with level for options
YFM001:
  level: warn
  maximum: 120          # inline code length
YFM020:
  level: warn
  customDirectives:     # own directives, to avoid YFM020
    - mermaid
MD013: false            # same as disabled
```

Values: `error` / `warn` / `info` / `disabled` / `true` (=warn) / `false` (=off).

Gotcha: configure `YAML001` (broken links in index.yaml leading pages)
**only inside `log-levels:`** - in the top-level form the CLI reads it
incorrectly.

## Targeted disabling in text

Standard markdownlint inline comments work, including for YFM rules (by code
or alias):

```markdown
<!-- markdownlint-disable YFM003 -->
[intentionally broken link](./draft.md)
<!-- markdownlint-enable YFM003 -->

<!-- markdownlint-disable-next-line MD013 -->
A very long line...

<!-- markdownlint-disable-file YFM021 -->
```

All forms: `disable`, `enable`, `disable-line`, `disable-next-line`,
`disable-file`, `enable-file`, `capture`, `restore`, `configure-file`.

## The lint section in .yfm

```yaml
lint: false                 # turn off entirely
# or
lint:
  enabled: true
  config: ./configs/docs.yfmlint   # custom path to the rules file
```
