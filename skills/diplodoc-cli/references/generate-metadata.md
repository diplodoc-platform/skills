# Generate page metadata

Available in `@diplodoc/cli` **5.67.0+**, requiring Node **24+** and npm
**11.5.1+**.

The field-selection behavior below describes the **next CLI release (unreleased)**.
In CLI **5.67.0–5.67.2**, omitting `--fields` selects all AJV frontmatter fields.
For those releases, explicitly pass `--fields title,description,summary,keywords,tags`.

`yfm generate metadata` edits source files in place. `-i` accepts one Markdown
or YAML page, or a directory; it defaults to the current directory. There is
no `--output` option for this command. The wizard runs in a terminal unless
`--skip-interactive` is set; use that flag for unattended runs. The wizard shows
all AJV frontmatter fields, with nothing selected even when flags or config
specify fields. Select at least one field to continue.

## Examples

Fill only absent `tags` throughout a documentation directory, with no retries:

```bash
export YANDEX_API_KEY='<api-key>'
yfm generate metadata -i ./docs --provider yandexgpt --folder '<folder-id>' \
  --fields tags --mode missing --skip-interactive \
  --retry 0 --rate-limit-retry 0
```

Replace only `summary` in one article, using an explicit configuration file:

```bash
yfm generate metadata -i ./docs/ru/about.md -c ./docs/.yfm \
  --provider yandexgpt --folder '<folder-id>' --fields summary \
  --mode overwrite --skip-interactive --retry 0 --rate-limit-retry 0
```

The default fields are `title`, `description`, `summary`, `keywords` and `tags`.
Non-interactive runs select these five when both `--fields` and
`generate.metadata.fields` are omitted. Explicit selection accepts any AJV
frontmatter field, including `--fields interface`; publication settings remain
protected as described below. Unknown field names fail before any AI request.

## Selection and write behavior

- `missing` checks whether a key exists, not whether its value is populated.
  Existing `tags: []`, `tags: null`, empty strings and `false` are preserved.
  If all selected keys exist, the file is skipped without an AI request.
- `overwrite` replaces selected descriptive fields returned by the model.
  Unselected fields are preserved. The model may omit selected fields;
  an empty result skips the file.
- Only `title`, `description`, `summary`, `keywords` and `tags` can change.
  Selected publication settings, including `restricted-access`, `noIndex`,
  scripts and system metadata, must be omitted or exactly match existing values
  if returned by AI. Matching settings are not rewritten; changed or invented
  settings reject the response. Unselected response keys are also rejected.
- Markdown uses top-level frontmatter; leading and Page Constructor YAML
  pages use `meta`. Read the **diplodoc-project** skill's metadata reference
  for schemas, types and placement. `summary` must be a complete sentence
  of at most 100 characters; each tag is at most 32 characters.
- Directory input recursively scans `.md`, `.yaml` and `.yml`. Hidden paths,
  `node_modules`, `_includes`, `toc.yaml`/`toc.yml`, `presets.yaml`/`presets.yml`
  and YAML without `links` or `blocks` are skipped.
- Liquid in Markdown frontmatter or YAML pages and aliased page metadata
  (`meta: *settings`) are rejected before an AI request. Liquid in the
  Markdown body is retained. Includes and variables are not expanded.
- Files are processed sequentially and responses are validated before writing.
  An error stops the command with exit code 1; earlier successful updates
  remain saved. Concurrent edits prevent saving. Unselected metadata values
  and article content are preserved, but YAML formatting can change.
  Review the diff after generation.

## Configuration and authentication

The strict `.yfm` scope is `generate.metadata`. Flags override configuration;
the wizard can then change the selected settings. Directory input discovers
`.yfm`; for a single file pass `-c ./docs/.yfm` explicitly.

```yaml
generate:
  metadata:
    fields: [summary, tags]
    mode: missing
    provider: yandexgpt
    retry: 0
    rateLimitRetry: 0
```

`--auth` accepts a token or token-file path. Otherwise the provider reads
`YANDEX_API_KEY` or `YC_IAM_TOKEN`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, or
`ANTHROPIC_API_KEY`. `generate.metadata.auth` is rejected in `.yfm`.
YandexGPT requires a folder ID unless `--model` is a full `gpt://` or `ds://` URI.
The wizard asks for it when needed, using the flag/config value as its default.
For non-interactive runs, set `--folder` or `generate.metadata.folder`.
Use `--api-base` and repeatable `--api-header 'Name: value'` for gateways;
the config key for headers is `apiHeaders`. An authorization header can
replace `--auth`. `OPENAI_BASE_URL`, `OPENROUTER_BASE_URL` and
`ANTHROPIC_BASE_URL` are supported.

## Flags and request limits

| Flag | Default | Purpose |
|---|---|---|
| `-i, --input <path>` | `.` | One file or a directory |
| `-c, --config <path>` | `.yfm` | Explicit config path, useful for single-file input |
| `--fields <list>` | Five descriptive fields | Any AJV frontmatter fields; wizard starts unselected |
| `--mode <mode>` | `missing` | `missing` or `overwrite` |
| `--provider <provider>` | `yandexgpt` | `yandexgpt`, `openai`, `openrouter`, `anthropic` |
| `--model <name>` | Provider default | Same defaults as `translate` |
| `--auth <value>` | Provider environment variable | Token or token-file path |
| `--folder <value>` | Unset | Yandex Cloud folder ID |
| `--api-base <url>` | Provider endpoint | Override the API URL |
| `--api-header <header>` | Unset | Extra header; repeatable |
| `--timeout <ms>` | `60000` | Request timeout |
| `--max-output-tokens <n>` | `4000` | Per-request output token limit |
| `--retry <n>` | `3` | Retries for invalid responses and transient errors |
| `--rate-limit-retry <n>` | `8` | Separate retry budget for rate limits |
| `--skip-interactive` | `false` | Use flags/config without the wizard |

Select only needed fields to reduce prompt size and invalid responses.
Set both retry flags to `0` to disable retries, including rate-limit retries.
`--max-output-tokens` limits one response, not the total input/output token
usage or cost of a directory run. Check a small sample before a large run.
Review generated wording for factual accuracy and natural phrasing. The prompt
asks for concrete topics and user tasks; schema validation cannot judge prose.
