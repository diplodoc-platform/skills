# The .yfm config file and flag precedence

## Basics

- File name: `.yfm` (YAML) in the project root; `-c/--config <path>` points
  elsewhere. A missing `.yfm` is fine only when `-c` is left at its default -
  an explicitly passed path that does not exist throws.
- **Key naming = camelCase of the long flag**: `--vars-preset` -> `varsPreset`,
  `--output-format` -> `outputFormat`, `--allow-html` -> `allowHtml`,
  `--single-page` -> `singlePage`, `--ignore-stage` -> `ignoreStage`.
- Nested config-only sections (no flat flag): `interface:` (kebab sub-keys like
  `toc-header`, `favicon-src` plus booleans toc/search/feedback/gallery),
  `search:`, `lint: {enabled, config}`, `vcs: {enabled}`, `content:
  {maxHtmlSize, ...}`, `feedback: {url}`, `llms:`, `resources:`, `template:`,
  `pdf:`, `analytics:`, `codeHighlight`, `breaks`, `linkify`, `linkifyTlds`.
- Relative paths **inside the config resolve from the config's directory**;
  the same paths on the command line resolve from CWD.

## Scopes

If `.yfm` has a top-level `build:` key, `yfm build` reads only that subtree;
otherwise the whole document is the build config. `publish`, `translate`,
`translate extract`, `translate compose` read their own strict scopes
(`publish:`, `translate:`, `translate.extract`, ...).

## Precedence: CLI over config - with one trap

CLI args are merged over the config file, so a passed flag always wins. The
trap: an option lands in "args" not only when you pass it but also when it
declares a *real* commander default. Consequences:

- Options with lazy defaults (`--strict`, `--single-page`, `--search`,
  `--lint`, `--allow-html`, `--output-format`, `--vars-preset`, ...) - the
  `.yfm` value applies unless the flag is passed. Expected behavior.
- Options with real defaults (`--quiet false`, `--interface-* true`,
  `--pdf-debug false`, `--multiline-term-definitions true`, the `--max-*`
  sizes) push their default into args. Most compensate internally, but
  **`quiet: true` in `.yfm` does not work** - the CLI default `false`
  overrides it; pass `-q` explicitly. Conversely, the `interface:` block in
  `.yfm` deliberately wins over `--interface-*` flags.

## Secrets are rejected in the config

The CLI asserts these are NOT present in `.yfm` and fails otherwise:

- `vcs.token` - pass `--vcs-token` or env `VCS_TOKEN`;
- publish `accessKeyId` / `secretAccessKey` - flags only;
- translate `auth` / `authToken` - flags or provider env vars
  (`YANDEX_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, ...).

## Flag aliases

Every boolean flag has a hidden auto-negation (`--no-lint`, `--no-template`,
`--no-build-stats`, ...); every kebab-case flag has a hidden deprecated
camelCase alias (`--varsPreset`, `--allowHtml`).
