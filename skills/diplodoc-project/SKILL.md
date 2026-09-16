---
name: diplodoc-project
description: >
  Structure and configuration of a Diplodoc documentation project,
  maintained by the Diplodoc team. Covers: project layout, toc.yaml
  mechanics (nesting, hidden/when/expanded, include modes, multiple tocs,
  link rules), landing pages (index.yaml), page frontmatter keys, variable
  presets (presets.yaml), multi-language projects, redirects. Use when
  creating or reorganizing a docs project, editing toc.yaml or index.yaml,
  setting up variables, languages or redirects, and equally when the
  question is only about how one of these files works or where a setting
  belongs - answer from this skill, not from memory: toc.yaml keys and
  preset resolution are Diplodoc-specific and easy to misremember. Read it
  before answering, even when the working directory holds no docs project.
  Triggers on: "toc.yaml", "index.yaml", "presets.yaml", "frontmatter",
  "redirects", "оглавление документации", "структура проекта документации".
  For markup syntax use the yfm skill; for build commands and linter use the
  diplodoc-cli skill.
---

# Diplodoc project structure

How a Diplodoc docs project is organized and configured. Markup syntax is the
**yfm** skill; running builds and the linter is the **diplodoc-cli** skill.

## References

| File | When to read |
|---|---|
| `references/toc.md` | toc.yaml: items, include modes, multiple tocs, href rules |
| `references/pages.md` | landing pages (index.yaml), frontmatter keys, redirects |

## Project layout

```
docs/
├── .yfm            # build config (see diplodoc-cli skill for the key map)
├── .yfmlint        # linter rule levels (diplodoc-cli skill)
├── toc.yaml        # table of contents; files not in a toc are not built
├── presets.yaml    # variables
├── index.yaml      # landing page of the section
├── _includes/      # include sources (underscore dir - required)
├── _images/        # images (underscore dir - required)
└── **/*.md
```

- Directories whose names start with `_` hold reusable assets; images and
  include files elsewhere are **dropped from the build**.
- Only these file types survive into the output: images
  (`svg png gif jpeg jpg bmp webp ico`), documents
  (`pdf docx xlsx csv vsd pptx`), `txt`, `yml/yaml`. Linking a `.zip` or
  `.json` will not work - the file is not copied.

## Variables: presets.yaml

```yaml
default:
  service-name: My Service
internal:
  audience: internal
```

- The `default:` section is mandatory; a named preset overlays it at build
  time (`--vars-preset internal`).
- Nearest presets.yaml wins: a file in a subdirectory overrides the root one
  for pages under it.
- One build = one preset; different audiences mean separate builds.
- Variables are used in text (`{{ service-name }}`), in `when:` conditions,
  and in toc/leading-page fields - syntax details in the yfm skill.

## Multi-language projects

```
docs/
├── .yfm            # langs: ['ru', 'en'] + docs-viewer.langs
├── ru/  toc.yaml, index.yaml, presets.yaml, _includes/, _images/, **/*.md
└── en/  toc.yaml, index.yaml, presets.yaml, _includes/, _images/, **/*.md
```

- Language folders are named by ISO 639-1 code and each is a full project
  tree; folder names must match the codes in `.yfm` `langs`.
- Keep relative paths identical across languages - that is how the viewer
  links language versions of a page.
- The first element of `docs-viewer.langs` is the default UI language.

## Page constructor

Landing-style pages: either a standalone `.yaml` page referenced straight from
toc.yaml (`href: promo/landing.yaml`), or a block inside markdown:

```markdown
::: page-constructor
blocks:
  - type: header-block
    title: Заголовок
:::
```

The `blocks:` property is mandatory. Note `::: ` in Diplodoc means page
constructor - it is not a generic container/HTML syntax.

## Enabling extra markdown-it plugins

Syntax that is off by default (task lists, footnotes, sub/ins/mark - see the
yfm skill) is enabled through the built-in `mdit-plugins` extension in `.yfm`:

```yaml
extensions:
  - name: mdit-plugins
    plugins:
      - '@diplodoc/transform/lib/plugins/checkbox'
      - name: markdown-it-footnote      # external - must be installed
```

The checkbox plugin ships with the transformer (config-only enable); most
others are external npm packages.

## Beyond this skill

For project features not covered here, read the official docs. Any docs page
is fetchable as raw markdown by appending `.md` to its URL:

- Project section: https://diplodoc.com/docs/en/project/toc (toc, includes,
  navigation, redirects, metadata, presets - sibling pages)
- Settings reference: https://diplodoc.com/docs/en/settings.md

Build behavior is defined by the CLI source:
https://github.com/diplodoc-platform/cli.
