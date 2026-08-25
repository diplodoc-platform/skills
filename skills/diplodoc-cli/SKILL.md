---
name: diplodoc-cli
description: >
  Using the Diplodoc CLI (@diplodoc/cli, the yfm command) to build, preview,
  translate and publish documentation projects. Covers: yfm build flags and
  defaults (output formats html/md, strict mode, vars and presets, filtering,
  size limits, reports), watch mode, the .yfm config file and how CLI flags map
  to it, translate with providers and XLIFF extract/compose, publish to
  S3-compatible storage, init scaffolding, single-file rendering with yfm
  content, exit codes and CI usage. Use when running or configuring docs
  builds, wiring docs into CI, debugging why a flag or .yfm key does not apply,
  or translating documentation. Triggers on: "yfm build", "diplodoc cli",
  "build docs", "yfm command", ".yfm config", "yfm translate", "yfm publish",
  "yfm init", "watch mode", "docs CI". For YFM markup syntax, linter rules and
  build error decoding use the yfm skill instead.
---

# Diplodoc CLI (yfm)

`@diplodoc/cli` builds Diplodoc documentation projects. Binaries: `yfm` and
`docs` (identical). Requires Node 22+. Run without installing:
`npx -p @diplodoc/cli yfm ...`.

Verified against @diplodoc/cli v5.55 source. For markup syntax, `.yfmlint`
rules and decoding build errors, use the **yfm** skill; this one is about
running and configuring the CLI itself.

## References

| File | When to read |
|---|---|
| `references/build.md` | full `yfm build` flag reference grouped by purpose, with defaults |
| `references/config.md` | the `.yfm` file: key naming, scopes, CLI-vs-config precedence and its traps |
| `references/translate.md` | `yfm translate`: providers, extract/compose/seed, caching |

## Commands

| Command | What it does |
|---|---|
| `yfm build` | build a project; **the default command** - `yfm -i ./docs -o ./out` works |
| `yfm content` | render one md file to stdout or a file (html fragment or self-contained md) |
| `yfm init` | scaffold a new project (interactive; `--skip-interactive` for CI) |
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
