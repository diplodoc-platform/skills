---
name: diplodoc-cli
description: >
  Use when running or configuring the Diplodoc CLI (@diplodoc/cli, yfm):
  builds and CI, metadata generation, translate, publish, init, .yfm
  configuration, or diagnosing build errors and linter codes. Covers build
  flags, watch mode, config precedence, providers, exit codes, and .yfmlint
  overrides for YFM001-YFM021 and MD* rules. Read this skill before explaining
  a diagnostic; look up its code instead of guessing, even outside a docs
  project. Triggers on "yfm build", "yfm generate metadata", "генерация
  метаданных", "diplodoc cli", ".yfm config", "yfmlint", "yfm translate",
  "docs build error" and "ошибка сборки документации". For markup use yfm;
  for page metadata schemas, toc.yaml and project structure use
  diplodoc-project.
---

# Diplodoc CLI (yfm)

`@diplodoc/cli` builds Diplodoc documentation projects. Binaries: `yfm` and
`docs` (identical). Current releases require Node 24+ and npm 11.5.1+.
Run without installing:
`npx -p @diplodoc/cli yfm ...`.

The core reference is based on @diplodoc/cli v5.55; metadata generation and
runtime requirements are verified against v5.67.0. This skill owns commands,
config, the linter and build error decoding.
Markup syntax is the **yfm** skill; toc.yaml and project structure is the
**diplodoc-project** skill.

## References

| File | When to read |
|---|---|
| `references/build.md` | full `yfm build` flag reference grouped by purpose, with defaults |
| `references/config.md` | the `.yfm` file: key naming, scopes, CLI-vs-config precedence and its traps |
| `references/lint.md` | linter rules YFM001-YFM021 and MD*, the `.yfmlint` file, inline disabling |
| `references/build-errors.md` | decoding build messages and how to fix them |
| `references/translate.md` | `yfm translate`: providers, extract/compose/seed, caching |
| `references/generate-metadata.md` | `yfm generate metadata`: fields, modes, providers, in-place edits and request limits |

## Configuration schemas

Read the matching [@diplodoc/ajv](https://github.com/diplodoc-platform/ajv)
schema before adding configuration keys or interpreting structured output:

| File | Machine-readable schema |
|---|---|
| `.yfm` | [yfm-schema.json](https://raw.githubusercontent.com/diplodoc-platform/ajv/refs/heads/master/src/json/yfm-schema.json) |
| `.yfmlint` | [yfmlint-schema.json](https://raw.githubusercontent.com/diplodoc-platform/ajv/refs/heads/master/src/json/yfmlint-schema.json) |
| `yfm-build-manifest.json` | [build-manifest-schema.json](https://raw.githubusercontent.com/diplodoc-platform/ajv/refs/heads/master/src/json/build-manifest-schema.json) |

Follow `$ref` entries for nested definitions. `master` tracks current schemas;
for an installed toolchain use the matching `@diplodoc/ajv` version
(`@diplodoc/ajv/json/<name>-schema.json`). Schemas describe the data shape;
command availability, defaults and precedence come from the CLI version in
use. For page metadata, custom HTML meta tags, TOCs and other project files,
read the **diplodoc-project** skill and its schema links.

## Commands

| Command | What it does |
|---|---|
| `yfm build` | build a project; **the default command** - `yfm -i ./docs -o ./out` works |
| `yfm content` | render one md file to stdout or a file (html fragment or self-contained md) |
| `yfm init` | scaffold a new project (interactive; `--skip-interactive` for CI) |
| `yfm generate metadata` | generate selected page metadata in source files using AI; available since 5.67.0 |
| `yfm translate` | translate docs via a provider; subcommands `extract`, `compose`, `seed` |
| `yfm publish` | upload a built dir to S3-compatible storage |

There is no `serve`/`preview` command - serve the output dir yourself
(`npx serve ./out`).

## Typical invocations

```bash
# local build (build is the default command)
yfm -i ./docs -o ./out

# strict CI build: warnings fail it, logs quiet, parallel workers
yfm build -i ./docs -o ./out --strict --quiet -j

# md output for a runtime renderer (build-stats/build-content are ON here)
yfm build -i ./docs -o ./out -f md

# with variables: preset + inline overrides
yfm build -i ./docs -o ./out --vars-preset external -v '{"env":"prod"}'

# ignore artifacts and drafts
yfm build -i . -o ./build --ignore ./build --ignore '**/*.draft.md'

# watch mode with live reload (serve ./out yourself)
yfm build -i ./docs -o ./out -w

# one file rendered to markdown on stdout
yfm content -i ./docs/page.md -f md --raw > page.md

# scaffold a project
yfm init -o ./docs --langs en,ru --template full --skip-interactive
```

To generate metadata, read [generate-metadata.md](references/generate-metadata.md)
for authentication, examples and write behavior. Use the **diplodoc-project**
skill for field schemas and placement in Markdown or YAML pages.

## Key behaviors (the things that surprise people)

- **`-o/--output` is required** for build; there is no default.
- The input dir is **copied to `<output>/.tmp_input`** and built from there
  (removed afterwards). `--origin-as-input` builds in place.
- **Exit codes are only 0 and 1.** 1 = any logged error, or any warning under
  `-s/--strict`, or a crash. On failure stdout ends with
  `YFM build completed with ERRORS!`.
- `-q/--quiet` silences INFO only; it does NOT hide warnings/errors, and
  `quiet: true` in `.yfm` is overridden by the CLI's default - pass `-q`
  explicitly (see `references/config.md` for why).
- The linter is **on by default** (`--no-lint` disables); rules come from
  `.yfmlint` in the input dir.
- Every boolean flag has an auto-negation (`--no-allow-html`) and a hidden
  camelCase alias (`--allowHtml`, deprecated).
- Watch mode (`-w`) rebuilds incrementally and pushes live reload over SSE on
  hardcoded `localhost:3000`; it does not serve files.
- Machine-readable artifacts land inside `--output`:
  `yfm-build-stats.json` and `yfm-build-content.json` (default ON for `-f md`,
  OFF for html; force with `--build-stats`/`--build-content`),
  `yfm-build-manifest.json` (`--build-manifest`), per-toc `llms.txt` +
  `llms-full.txt` (`--llms`). Stats bucket warnings/errors by `YFM###` code -
  a useful CI regression signal.

## publish and content in brief

```bash
yfm publish -i ./out --endpoint https://storage.yandexcloud.net --bucket docs \
  --prefix v1 --region ru-central1 --access-key-id "$KEY" --secret-access-key "$SECRET"
```

Credentials are **rejected if placed in the config file** - pass them as flags
(same policy as `--vcs-token`, which reads env `VCS_TOKEN`).

`yfm content` renders a single file: `-f html` gives a content fragment,
`-f md` a self-contained markdown with frontmatter; `--raw` drops the
`<<<<<< YFM CONTENT START/END >>>>>>` markers; `-w` watches the file and its
includes chain.

## Beyond this skill

For flags and behaviors not covered here, read the official docs. Any docs
page is fetchable as raw markdown by appending `.md` to its URL:

- Tools section: https://diplodoc.com/docs/en/tools/docs/build.md
- Settings reference: https://diplodoc.com/docs/en/settings.md

The final arbiter for CLI behavior is the source:
https://github.com/diplodoc-platform/cli (note: the official lint page has
been observed to lag behind the code - this skill's lint facts are verified
against @diplodoc/yfmlint sources).
