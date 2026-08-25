# Tables in YFM

Two syntaxes: regular GFM tables and YFM multiline tables. Rule of thumb:
start with GFM, switch to multiline only when a cell needs block content
(lists, code, multiple paragraphs), merged cells, or a nested table.

## GFM tables

```markdown
| Service    | Port | Status  |
|:-----------|:----:|--------:|
| PostgreSQL | 5432 | Active  |
| Redis      | 6379 | Stopped |
```

- The separator row (`| --- | --- |`) is mandatory; without it the table does
  not render.
- Same number of `|` in every row.
- Column alignment: `:---` left (default), `:---:` center, `---:` right.
- Cells take inline markup only (bold, italics, code, links). Lists,
  paragraphs, and code blocks do not fit in a GFM cell - that is the cue to
  switch to multiline.

## Multiline tables

The block opens with `#|` and closes with `|#`. A table row is `|| ... ||`;
cells within a row are separated by a single `|`.

```markdown
#|
|| **Component** | **Description** ||
|| Frontend | React application ||
|| Backend | REST API in Node.js ||
|#
```

### Block content in a cell

Cell content may span multiple lines and contain any YFM markup:

```markdown
#|
|| **Stage** | **Description** ||
|| Research |
In-depth interviews:

- 15 respondents
- 45 minutes each
||
|#
```

### Merging cells

- `>` - a cell consisting only of `>` joins its **left** neighbor
  (the previous cell stretches right, colspan).
- `^` - a cell consisting only of `^` joins the cell **above**
  (the upper cell stretches down, rowspan).
- Several `>`/`^` in a row extend the span.
- Escape literal symbols in a cell: `\>`, `\^`.
- `>` cannot appear in the first column (there is nothing to stretch on the left).

```markdown
#|
|| Category | Subcategory | Value ||
|| Product | Functionality | 4.2 ||
|| ^ | Design | 3.8 ||
|| Total | > | 4.0 ||
|#
```

### Table and cell attributes

Cell attributes go right after `|` (or `||` for the first cell) **with no
space**; the marker is `::{...}`:

```markdown
#|
|| Name | Number ||
||::{align="center"} Centered |::{align="top-right"} Top right ||
|#
```

- `align` - valid values: `top-left`, `top-center`, `top-right`, `center`,
  `bottom-left`, `bottom-right`.
- `bg` - cell background color.
- The old way, `{.cell-align-center}` at the end of cell content, is
  deprecated and produces a build warning; use `::{align="..."}`.

A whole-table attribute goes after the opening `#|`, e.g. the number of header
rows:

```markdown
#| {header-rows="2"}
...
|#
```

## Typical breakage

1. GFM without a separator row - no table, text collapses together.
2. Different numbers of `|` per row - columns fall apart.
3. A forgotten closing `|#` - the table "swallows" all text to the end of the file.
4. A space between `|` and `::{...}` - attributes fail to parse and leak into
   the cell text.
5. Invented names in examples: take table, service, and field names from the
   real context instead of generating plausible ones.
