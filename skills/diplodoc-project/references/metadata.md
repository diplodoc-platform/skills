# Page metadata and HTML meta tags

## Schema and placement

The [frontmatter JSON schema](https://raw.githubusercontent.com/diplodoc-platform/ajv/refs/heads/master/src/json/frontmatter-schema.json)
defines all supported page metadata, including nested settings and generated
fields. Read it and follow its `$ref` definitions before choosing fields or
generating their values. Use the installed `@diplodoc/ajv` version when
targeting a specific toolchain. The field map below is a guide to the schema,
not a fixed list of fields to generate for every page.

- **Markdown:** fields go directly in YAML frontmatter at the beginning of
  the file, without a `meta:` wrapper.
- **Leading and standalone Page Constructor YAML pages:** fields go under
  `meta:`. Both the [leading schema](https://raw.githubusercontent.com/diplodoc-platform/ajv/refs/heads/master/src/json/leading-schema.json)
  and [Page Constructor schema](https://raw.githubusercontent.com/diplodoc-platform/ajv/refs/heads/master/src/json/page-constructor-schema.json)
  reuse the frontmatter schema for this object.
- **`metadata`:** one field inside frontmatter or `meta`, used for arbitrary
  HTML `<meta>` tags. It is not a wrapper for all page settings.

Markdown example:

```markdown
---
title: Configure backups
description: Configure scheduled backups and restore a saved copy.
summary: Schedule backups and restore your data.
tags: [backups, recovery]
keywords: [scheduled backups, restore]
metadata:
  - property: og:image
    content: https://example.com/images/backups.png
interface:
  feedback: false
---

# Configure backups

Follow these steps to schedule backups and restore a saved copy.
```

Leading-page example:

```yaml
title: Backup guides
description: Choose a backup task.
meta:
  title: Backup and recovery documentation
  description: Guides for configuring backups and restoring data.
  summary: Choose a guide to back up or restore data.
  tags: [backups, recovery]
  metadata:
    - property: og:image
      content: https://example.com/images/backups.png
links:
  - title: Configure backups
    href: https://example.com/docs/backups
```

Here the root `title` and `description` are visible leading-page content;
the `meta` object holds the page metadata. Keep the same `meta` structure
when working with a Page Constructor page whose content is in `blocks`.

## Field map

### Descriptive fields and indexing

| Field | Type and purpose |
|---|---|
| `title` | String; metadata title used by the HTML head/SEO. The article body has its own heading. |
| `description` | String; meta description, also used in `llms.txt`. |
| `summary` | String, at most **100 characters**; short article summary shown with the right-hand navigation in supporting viewers. |
| `tags` | Array of strings, each at most **32 characters**; page tags for display and search. |
| `keywords` | Array of strings or `{keyword: string}` items; HTML meta keywords, a separate field from `tags`. |
| `noIndex` | Boolean; prevent search-engine indexing. |
| `canonical` | URI string; canonical page URL. |
| `alternate` | Array of language-link objects; see `Alternate` in the schema for `href` and `hreflang`. |
| `copyright` | String; copyright metadata. |
| `metadata` | Array of meta-tag objects or a name-to-content object; see below. |

The CLI trims and lowercases tags, removes duplicates and empty values, and
truncates tags longer than 32 characters with a warning. Tags starting with
`_` are technical: they stay in metadata but are excluded from visible tags,
HTML `article:tag` entries and search. Summaries longer than 100 characters
are truncated with a warning. Write a complete short summary within the
limit instead of relying on truncation.

### Page settings

| Field | Type and purpose |
|---|---|
| `interface` | Object; per-page UI overrides such as `toc`, `toc-header`, `search`, `feedback`, `gallery`, `favicon-src`. |
| `script`, `style` | Arrays of strings; per-page script and stylesheet paths or URLs. |
| `csp` | Array of objects; Content Security Policy directives. |
| `resources` | Legacy resources object; see `Resources` in the schema. |
| `stage` | `new`, `preview`, `tech-preview` or `skip`; document lifecycle stage. Build filtering depends on CLI configuration. |
| `restricted-access` | Array of arrays of strings; access-rule groups. |
| `vcsPath` | String; VCS source-path override. |
| `queryParameters` | Object; iframe query-parameter forwarding settings. |
| `docs-viewer` | Object; viewer-specific overrides, including `noIndex`. |
| `aiChat` | Object; internal viewer chat settings (`requestExamples`, `soTags`, `stIssues`). |
| `yabug`, `yafeedback`, `neuroExpert` | Objects; bug-report, feedback and AI expert widget overrides. Read each nested schema for its keys and types. |

These fields describe configuration, not facts that can be inferred from
article prose. When asked to fill or update all metadata, inspect all schema
fields, derive descriptive values from the article, and take configuration
values from explicit project requirements or existing settings. Support for
viewer-specific settings depends on the target installation.

### Build-generated fields

The schema also describes `sourcePath`, `editable`, `theme`, `author`,
`contributors`, `updatedAt`, `__system` and `__metadata`. They represent
source/build/VCS information or values supplied through presets. Preserve
their provenance when editing existing metadata; do not invent authors,
timestamps or generated paths from the article text.

## Custom HTML meta tags: metadata

Use an array to select the HTML attribute explicitly. Each item has a string
`content` and a `name`, `property` or `http-equiv` attribute:

```yaml
metadata:
  - name: author
    content: Documentation team
  - property: og:image
    content: https://example.com/images/backups.png
  - name: twitter:card
    content: summary_large_image
  - http-equiv: content-language
    content: en
```

For simple `name` tags, the object shorthand is also supported:

```yaml
metadata:
  author: Documentation team
  robots: noarchive
```

Object keys become `name` attributes; use the array form for `property` or
`http-equiv`. In a YAML page this entire field is `meta.metadata`.
`metadata` entries create HTML tags; native fields such as `summary`,
`interface` and `tags` must stay at the frontmatter/`meta` level to affect
Diplodoc behavior. The native `author` field is VCS data; an HTML author tag
belongs in `metadata`, as above.

## Authoring and verification

- Select the schema for the page type and check nested types, formats, enums
  and limits. Frontmatter rejects unknown top-level fields in schema
  validation; custom HTML tags belong in `metadata`.
- Preserve unrelated metadata and the page body when updating selected fields.
- Quote strings that YAML could read as booleans, numbers or dates. Keep one
  definition of each key; ordinary duplicate frontmatter keys cause YFM017.
- Validate the metadata with the matching schema, then build the project
  using the **diplodoc-cli** skill. Schema validity checks the data shape;
  inspect rendered output when the requested change affects HTML or viewer UI.

Sources: [metadata documentation](https://diplodoc.com/docs/en/project/meta.md),
[MetaService](https://github.com/diplodoc-platform/cli/blob/master/src/core/meta/MetaService.ts),
[YAML page loader](https://github.com/diplodoc-platform/cli/blob/master/src/core/leading/loader.ts).
