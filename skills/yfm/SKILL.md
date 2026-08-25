---
name: yfm
description: >
  YFM (Yandex Flavored Markdown) syntax for the Diplodoc documentation platform,
  maintained by the Diplodoc team. Use it to generate or edit documentation that
  builds cleanly and passes the linter. Covers: condensed syntax for writing
  articles (notes, cuts, tabs, includes, variables, anchors), multiline tables
  with cell merging, terms and definition lists, linter rules YFM001-YFM021 and
  MD* with overrides via .yfmlint, toc.yaml mechanics (multiple tocs, include
  modes, link rules), and decoding of typical yfm build errors. Use when writing
  or editing Diplodoc documentation, generating articles from code, fixing yfm
  build failures, or configuring toc.yaml / .yfmlint. Triggers on: "YFM",
  "Diplodoc", "yfm build", "toc.yaml", "yfmlint", "write docs", "generate
  documentation", "docs build error", "unreachable-link", "multiline table",
  "term", "note", "cut", "include". Do NOT use for plain GitHub Flavored
  Markdown without the Diplodoc toolchain.
---

# YFM: Diplodoc documentation syntax

Maintained by the Diplodoc team. YFM = CommonMark + extensions processed by the
`yfm` builder (@diplodoc/cli). Part of the validation happens at build time, not
in the renderer: text can "look fine" and still fail the build. The rules below
exist so that generated text builds on the first try.

## References (read when working on the topic)

| File | When to read |
|---|---|
| `references/tables.md` | tables: multiline `#|...|#`, cell merging, `::{align=...}` attributes |
| `references/terms.md` | term popups `[*key]:` and definition lists `: ...` |
| `references/toc.md` | toc.yaml: structure, include modes, multiple tocs, link rules |
| `references/lint.md` | YFM*/MD* rules, `.yfmlint` format, inline disabling |
| `references/build-errors.md` | decoding build messages and how to fix them |

## Key generation rules (common AI-text pitfalls)

1. **A quote is `>` (blockquote), not `{% note %}`.** Notes are only for
   genuinely important warnings or tips - at most ~1 per 15 lines.
2. **No meta-text about the document itself**: no "This document describes...",
   "This article covers...". Get to the point.
3. **Do not invent names**: take table names, services, fields, and paths in
   examples from the real context of the task. A plausible invented name is the
   worst documentation bug.
4. **No emoji or characters outside the BMP** - the linter flags them as
   YFM021 (garbage CJK characters from generation are caught the same way).
5. **Blank lines around every YFM block** and inside it (after the opening tag,
   before the closing one) - otherwise the block does not render.
6. **Every block is closed**: `{% note %}...{% endnote %}`, `{% cut %}...{% endcut %}`,
   `{% list tabs %}...{% endlist %}`, `#|...|#`. An unclosed table is a build
   error (YFM004).
7. **Links to other pages are relative, with the `.md` extension**, and only to
   files present in toc.yaml - otherwise YFM003 unreachable-link (error).
8. **Keep the base text GFM-compatible**; put YFM specifics in explicit blocks.
9. One H1 per file, heading levels without gaps, no markup inside headings.
10. Do not use raw HTML: `<details>` instead of `{% cut %}` does not work.

## Condensed syntax

### Blocks

```markdown
{% note info "Custom title" %}

Types: info, tip, warning, alert. Title is optional, "" removes it.

{% endnote %}

{% cut "Informative title" %}

Collapsible content - for optional details.

{% endcut %}

{% list tabs group=os %}

- Tab name

  Tab content indented by 2 spaces. group synchronizes tab blocks.

- Second tab

  Text.

{% endlist %}
```

### Includes and variables

```markdown
{% include [text](path/to/file.md) %}
{% include notitle [text](path/to/file.md#anchor) %}
```

The path is relative to the current file. Circular includes and self-includes
are build errors.

Variables from `presets.yaml` (the `default:` section): `{{ service-name }}`.
Conditions: `{% if audience == "internal" %} ... {% endif %}`. An unclosed
`{% if %}`/`{% for %}` is a build error.

### Links and anchors

```markdown
## Heading {#custom-anchor}

[text](../folder/file.md)      # relative path WITH the .md extension
[text](file.md#anchor)
[{#T}](./other.md)             # link text is taken from the target's heading
```

### Images and files

```markdown
![Alt text](_images/arch.png "Tooltip"){width=800}
{% file src="path/to/doc.pdf" name="Document.pdf" %}
```

Size goes in attributes `{width=... height=...}`, not `=800x400`. A missing
image path is a build error (`Asset not found`).

### Tables

Simple data - GFM (the separator row is mandatory, same number of `|` in every
row). Block content or merged cells - multiline:

```markdown
#|
|| **Header 1** | **Header 2** ||
|| Cell | Cell spanning 2 rows ||
|| Cell | ^ ||
|#
```

`>` - join with the cell to the left, `^` - with the cell above. Details and
attributes - `references/tables.md`.

### Terms and definition lists

```markdown
Usage of a [term](*termkey) in text.

[*termkey]: Definition (at the very end of the page, ASCII key).
```

A definition list is `Term`, then a `:   Definition` line. Details and gotchas -
`references/terms.md`.

### Frontmatter

```yaml
---
title: Page title
description: Description for search engines
---
```

A duplicated key in frontmatter is a build error (YFM017).

## Project structure

```
docs/
├── .yfm            # build config (allowHtml, strict, lint, template, ...)
├── .yfmlint        # linter rule levels (references/lint.md)
├── toc.yaml        # table of contents; files not in toc are not built
├── presets.yaml    # variables
├── index.yaml      # section leading page
└── **/*.md
```

toc.yaml: `items` with `name`/`href`/nesting, `hidden`, `when`, includes in
three modes (the default `root_merge` physically copies files - use
`mode: link` for navigation-only composition), multiple tocs with "the nearest
toc wins". Details - `references/toc.md`.

## Verifying the result

Build locally: `npx -p @diplodoc/cli yfm -i docs -o /tmp/docs-out` (or `yfm` if
installed). `-s/--strict` turns warnings into errors. Any `ERR` line fails the
build; message decoding - `references/build-errors.md`.

Pre-submit checklist:

- [ ] one H1, consecutive heading levels
- [ ] blank lines around all `{% ... %}` blocks, every block closed
- [ ] tables: GFM with a separator row / multiline closed with `|#`
- [ ] links are relative, with `.md`, targets exist and are in toc.yaml
- [ ] new files added to toc.yaml
- [ ] terms defined at the end of the file, ASCII keys
- [ ] no emoji/garbage characters, no meta-text, no invented names
- [ ] notes only where something truly is a warning; quotes via `>`
