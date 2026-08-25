# toc.yaml: the project table of contents

Files not listed in any toc.yaml are not built.

## Basic structure

```yaml
title: Document name
href: index.yaml
items:
  - name: Section
    href: path/to/file.md
  - name: Section group
    items:
      - name: Nested section
        href: path/to/other.md
```

The root must be an object (not a list). All relative paths are resolved
**from the location of the toc.yaml they are written in**.

Href normalization: `href: guide` -> `guide.md`; `href: section/` ->
`section/index.yaml`. In the output `.md`/`.yaml` -> `.html`; the directory
structure is preserved 1:1 (URLs are not flattened).

## Item keys

| Key | What it does |
|---|---|
| `name` | display name |
| `href` | path to the page (relative to this toc.yaml) or an external URL |
| `items` | nested items, unlimited depth |
| `hidden: true` | the page is built and reachable by direct link but not shown in the sidebar; `removeHiddenTocItems: true` in .yfm removes it entirely |
| `when` | inclusion condition: `when: version == 12`; operators `==,!=,<,>,<=,>=` |
| `expanded: true` | the section starts expanded - **first-level items only** |
| `labeled: true` | renders the item as a visual group header |
| `target` | `_self`/`_blank`; by default relative links open in the same tab, absolute ones in a new tab |

Root keys: `title`, `href` (usually `index.yaml`), `items`, `label`,
`navigation` (extended navigation), `stage` (`skip` excludes the whole toc from
the build with the default `--ignore-stage`), `pdf`, `analytics`.

Variable substitutions work in `title`, `name`, `href`, `label`, `navigation`.
If a value starts with a substitution - **quote it**, otherwise the YAML parser
fails with a cryptic error (`TypeError: str.replace is not a function`).

## Include: composing a toc from pieces

Named include - the content becomes children of the item:

```yaml
- name: Name of the borrowed block
  include:
    path: another/toc.yaml
    mode: link
```

Nameless include - items are spliced into the same level:

```yaml
items:
  - name: Own page
    href: file1.md
  - include: { path: path/to/toc.yaml, mode: link }
```

### Modes

| mode | `path` is resolved from | What happens |
|---|---|---|
| `root_merge` (default) | project root | source files are **physically copied** into the including toc's directory, overwriting existing files |
| `merge` | the current file | same copying, different path base |
| `link` | the current file | nothing is copied; all `href`s of the included toc are rewritten relative to the including one |

Gotchas:

- The default is `root_merge`, which copies and overwrites files. If you only
  need navigation composition - write `mode: link` explicitly.
- The `path` base differs per mode - the #1 mistake with includes.
- Nested merges collapse into the outermost merge base; under merge, variables
  come from the target toc, not the source.
- If `include.path` does not end with `toc.yaml`, the CLI appends `/toc.yaml`
  itself.

### Includers (generators)

`include.includers` - a list of generators, executed in order; `mode` must be
`link`:

```yaml
- name: docs
  include:
    path: gen_docs
    includers:
      - name: generic     # toc from a folder of md files (autotitle, linkIndex, orderBy)
    mode: link
```

Built-in: `generic` (toc from a folder of md files), `openapi` (articles from
an OpenAPI spec), `unarchive` (unpack a tar before the others).

## Multiple tocs

A toc.yaml in a folder applies to all articles in that folder and its
subfolders - **the nearest enclosing toc wins**:

```
docs/
├── toc.yaml          # for article1.md, folder1/*
├── article1.md
├── folder1/article3.md
└── folder2/
    ├── toc.yaml      # for article4.md, folder3/*
    ├── article4.md
    └── folder3/article6.md
```

- Links between tocs are plain relative hrefs: from the root toc
  `href: folder2/article4.md`, from the nested one outward -
  `href: ../article1.md`.
- Multiple tocs do not change URLs - a toc only decides which sidebar a page
  renders with.
- Cross-navigation between independent tocs goes through each toc's
  `navigation.header` (this is how the Diplodoc docs site itself is built).

## Links in md files

- A relative path **with the `.md` extension**: `[text](../folder/file.md)`;
  anchors - `[text](file.md#anchor)`.
- `[{#T}](./index.md)` - the link text is substituted from the target page's
  heading.
- Relative paths do not work in raw HTML - only absolute paths from the docs
  root.
- A broken link -> build warning `Link is unreachable`; with `strict: true` in
  .yfm warnings become errors.

## .yfm: keys adjacent to toc

`ignore` (exclusion globs), `ignoreStage` (default `[skip]`),
`removeHiddenTocItems`, `removeEmptyTocItems`, `varsPreset`+`applyPresets`
(variable presets), `template.features.conditions/substitutions`
(**disabling both stops `when` and `hidden` processing in toc**),
`interface.toc`/`interface.toc-header`, `allowHtml`, `strict`, `lint`,
`outputFormat: html|md`, `singlePage`.
