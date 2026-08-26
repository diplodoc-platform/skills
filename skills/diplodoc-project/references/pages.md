# Landing pages, frontmatter, redirects

## Landing page: index.yaml

The entry page of a section, referenced from toc.yaml as `href: index.yaml`:

```yaml
title: Имя документа
description: Описание документа
meta:
  title: Метаданные
  noIndex: true
links:
  - title: Первый раздел
    description: Описание первого раздела
    href: path/to/file        # NO extension - this is the common mistake
  - title: Внешний ресурс
    href: https://example.com
    target: _blank
```

- `links[].href` is a relative path **without** the `.md` extension; a wrong
  path is exactly what the YAML001 build check catches.
- `title` and `description` fields do **not** support markdown.
- `when:` conditions and variable substitutions work the same way as in toc.

## Page frontmatter (metadata)

The YAML block between `---` fences at the top of an `.md` page. Supported
keys (not just title/description):

| Key | What it does |
|---|---|
| `title` | page title |
| `description` | meta description; also feeds `llms.txt` |
| `keywords` | list of keywords |
| `canonical` | canonical URL |
| `alternate` | manual hreflang alternates |
| `copyright` | copyright notice |
| `interface` | per-page override of the `.yfm` interface section, e.g. `interface: {toc: false}` hides the sidebar on this page |
| `metadata` | arbitrary `<meta>` tags: list of `{name/http-equiv/property, content}` |
| `resources` | per-page CSP/resources (CSP extension only) |

A duplicated key in frontmatter fails the build (YFM017).

## Redirects

Two mechanisms:

**Static builds** - a meta-refresh page: keep the old file, add frontmatter

```yaml
---
metadata:
  - name: redirect
    http-equiv: refresh
    content: '0; url=../new/place/'
---
```

and mark the old page `hidden: true` in toc. Anchors are not preserved; the
source file must not be deleted.

**Cloud/hosted** - `redirects.yaml` next to `.yfm`:

```yaml
common:
  - from: /old/page
    to: /new/page
ru:
  - from: /docs/(.*)-deprecated
    to: /docs/$1
```

- Sections: `common` plus per-language (`ru:`, `en:`).
- Paths without the `.md` extension; a trailing `/` targets a directory;
  regex with `$1` backreferences works.
- A `from`/`to` pair that does not form a valid regular expression is a build
  error.
