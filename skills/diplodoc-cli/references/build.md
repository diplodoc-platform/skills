# yfm build: flag reference

Grouped by purpose. Defaults from @diplodoc/cli v5.55
(`src/commands/build/config.ts` and per-feature `config.ts`). Every boolean has
an auto-negation `--no-<flag>`; every kebab-case flag has a deprecated
camelCase alias.

## I/O and format

| Flag | Default | Notes |
|---|---|---|
| `-i, --input <dir>` | `./` | source project |
| `-o, --output <dir>` | **required** | build fails at parse time without it |
| `-f, --output-format <html\|md>` | `html` | `md` = preprocessed markdown for runtime renderers |
| `-c, --config <path>` | `.yfm` | bare name resolves from `--input`; `./path` from CWD |
| `--single-page` | off | beta; `single-page.html` + `.json` per toc dir |
| `--pdf` | off | `pdf/` subdir per toc |
| `--static-content` | `false` | server-render HTML into output (otherwise client-side hydration) |
| `--skip-html-extension` | `false` | strip `.html`/`index.html` from links |
| `-w, --watch` | off | incremental rebuild + SSE live reload on localhost:3000 |
| `-j, --jobs [n]` | `0` (single thread) | bare `-j` = CPUs-1 |

## Languages, variables, templating

| Flag | Default | Notes |
|---|---|---|
| `--langs <value...>` | `['ru']` effectively | config also takes `lang` (must be a member of `langs`) |
| `--vars-preset <name>` | `default` | merged over the `default:` section of presets.yaml |
| `-v, --vars <json>` | `{}` | overrides presets |
| `--template <all\|text\|code>` | `text` | scope of liquid processing; `--no-template` disables it |
| `--template-vars` / `--template-conditions` / `--template-cycles` | `true` | granular liquid toggles |

## HTML safety and rendering

| Flag | Default |
|---|---|
| `--allow-html` | `true` (disabling also turns lint rule MD033 into an error) |
| `--sanitize-html` | `true` |
| `--disable-csp` | `false` (CSP meta tag injected by default) |
| `--multiline-term-definitions` | `true` |
| `--id-generator <random\|deterministic\|constant>` | `random`; deterministic/constant for stable snapshot diffs |

## Filtering

| Flag | Default | Notes |
|---|---|---|
| `--ignore <glob...>` | `[]` | `build` becomes `build/**`; `**/*.md` stays as-is |
| `--ignore-stage <value...>` | `['skip']` | toc `stage` values: new, preview, tech-preview, skip |
| `--remove-hidden-toc-items` | `false` | drop `hidden: true` pages entirely |
| `--remove-empty-toc-items` | `false` | drop items with no href and no children |

## Lint

`--lint` / `--no-lint` - enabled by default; rules file `.yfmlint` in the input
dir or `lint.config: <path>` in `.yfm`. Rule semantics - see the yfm skill.

## Meta, VCS, contributors

`--add-system-meta` (false), `--add-alternate-meta` (true), `--vcs`/`--no-vcs`,
`--vcs-token <secret>` (or env `VCS_TOKEN`; rejected inside the config file),
`--vcs-path` (true), `--mtimes` / `--authors` / `--contributors` (off),
`--ignore-author <login>`.

## Interface and branding

`--interface-toc`, `--interface-search`, `--interface-feedback`,
`--interface-gallery` (all `true`; use `--no-...` to strip UI),
`--feedback-url <url>`, `--theme <color>` (overrides theme.yaml).
Trap: the `.yfm` `interface:` block **wins over these CLI flags**.

## Search

`--search` enables the local provider only. Other providers via `.yfm`:
`search: {provider: ..., ...}`.

## Size limits (values like `128K`, `2M`, or plain bytes; units K/M only)

| Flag | Default | Cap |
|---|---|---|
| `--max-inline-svg-size` | `2M` | 16M |
| `--max-html-size` | `42M` | 96M |
| `--max-asset-size` | `64M` | `0` disables |
| `--max-openapi-include-size` | `0` (off) | - |
| `--max-openapi-include-inline-size` | `100K` | 1M |
| `--llms-full-max-size` | `4M` | `0` disables |

## Reports and artifacts (written into --output)

| Flag | Default | File |
|---|---|---|
| `--build-stats` | ON for `-f md`, OFF for html | `yfm-build-stats.json` - timings, counters, warnings/errors by YFM code |
| `--build-content` | same rule | `yfm-build-content.json` - sha256 per file + page-asset deps |
| `--build-manifest` | off | `yfm-build-manifest.json` |
| `--crawler-manifest` | off | `crawler-manifest.json` |
| `--llms` | off | per-toc `llms.txt` + `llms-full.txt` |
| `--changelogs` | off (beta) | `changelogs.minified.json` |
| `--add-map-file` | deprecated | `files.json` - use `--build-manifest` |

## Resources and extensions

`--resources <path...>` + `--allow-custom-resources` (default `false` - without
it, `resources:` scripts/styles from `.yfm` are not injected);
`-e, --extensions <name-or-path>` (CLI paths resolve from CWD, config paths
from the config dir). Bundled: generic includer, openapi, local search.

## Deprecated but still accepted

`--disable-liquid` (use `--no-template`), `--apply-presets`
(`--template-vars`), `--resolve-conditions` (`--template-conditions`),
`--conditions-in-code` (`--template=all|code`), `--lint-disabled`
(`--no-lint`), `--allowHTML` (`--allow-html`), `--need-to-sanitize-html`
(`--sanitize-html`), `--add-map-file` (`--build-manifest`).
