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

Markdown uses a YAML block between `---` fences at the beginning of the file.
Leading pages and standalone Page Constructor YAML pages put the same fields
under `meta:`. The root `title`/`description` of a leading page describe its
visible content; `meta.title`/`meta.description` are page metadata.

Read [metadata.md](metadata.md) for the full field map, custom HTML meta tags,
examples and constraints. The authoritative contract is the
[frontmatter schema](https://raw.githubusercontent.com/diplodoc-platform/ajv/refs/heads/master/src/json/frontmatter-schema.json),
also referenced by the leading-page and Page Constructor schemas.

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
