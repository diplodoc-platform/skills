# yfm translate

Two workflows: end-to-end via a provider, or XLIFF round-trip
(extract -> translate elsewhere -> compose).

## Shared flags

`-i/--input` (default `./`), `-o/--output` (**defaults to input** - in-place),
`-sl/--source <lang>`, `-tl/--target <lang...>` (ISO 639-1),
`--files <path...>` (direct list or a `.list` file; when set,
`--include`/`--exclude` are ignored), `--include <glob>` (repeatable),
`--exclude <glob>`, `-c/--config`. Presets.yaml is ignored by translate - pass
variables via `-v/--vars`.

## End-to-end: yfm translate --provider <name>

Providers: `yandex` (default, Yandex Translate API) and LLM providers
`yandexgpt`, `openai`, `openrouter`, `anthropic`.

Help is provider-scoped: `yfm translate --provider yandex --help`
(a bare `yfm translate --help` prints nothing - not a bug).

Common extra flags: `--include-vcs-diff [ref]` - translate only files changed
in the git/arc working copy (default base `HEAD`, untracked included),
`--dry-run` (quota estimate only), `--copy-assets`, `--timeout <ms>`.

- `yandex`: `--auth <token>`, `--folder <id>`, `--glossary <path>`. Auth must
  NOT be in the config file (asserted); env `YANDEX_API_KEY` / `YC_IAM_TOKEN`.
- LLM providers: `--auth`, `--model`, `--fallback-model`, `--api-base`,
  `--api-header` (custom headers override defaults), `--system-prompt`,
  `--user-prompt`, `--prompt-mode <append|replace>`, `--context-file`,
  `--glossary`, `--judge` + `--judge-model` + `--judge-threshold` (70),
  `--cache-dir <path>`, `--no-cache`, `--temperature` (0),
  `--max-output-tokens` (4000), `--max-batch-tokens` (2000),
  `--max-concurrency` (5), `--retry` (3), `--rate-limit-retry` (8).
  Env auth: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`.

```bash
yfm translate --provider anthropic -i ./docs -sl ru -tl en \
  --model claude-sonnet-4-5 --cache-dir .yfm-translate-cache
```

## XLIFF round-trip

- `yfm translate extract -i ./docs -o ./xliff -sl ru -tl en` - splits each
  file into `<file>.xliff` + `<file>.skl` (skeleton), written under the
  target-language path. `--filter` limits to files reachable from toc.yaml;
  `--schema <path...>` for custom translate schemas.
- `yfm translate compose -i ./xliff -o ./docs` - reassembles translated
  `.xliff` + `.skl` back into files. `--use-source` emits source text as the
  translation (debugging).

## Cache seeding

`yfm translate seed -i ./docs -sl ru -tl en --cache-dir <path>` - aligns
existing translated targets against sources unit-by-unit and pre-populates the
LLM translation cache, so a subsequent `translate` run only sends changed
units. Reports seeded/missing/mismatched counts.
