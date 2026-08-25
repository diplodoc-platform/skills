# Typical yfm build errors and what to do about them

## Reading the output

Line format: `PREFIX message`; linter messages carry a code and context:

```
ERR index.md: 1: YFM003 / unreachable-link Link is unreachable [Context: "Unreachable link: "exists.html"; Reason: File is not declared in toc; Line: 1"]
```

- `INFO`/`PROC`/`COPY` - build progress; `WARN` - warnings; `ERR` - errors.
- Any `ERR` -> exit 1 and the banner `YFM build completed with ERRORS!`.
- `-s/--strict` - warnings fail the build too (exit 1).
- `-q/--quiet` silences INFO only; WARN/ERR always print.

## toc.yaml

| Message | Cause | Fix |
|---|---|---|
| `Error while finding toc dir.` | the file is not declared in any toc.yaml (an orphaned page; often on singlepage/pdf) | add the page to a toc or drop it from the build |
| `Invalid TOC format in <f>: root value must be an object, got array` | the toc root is a list | wrap it in `items:` |
| `Invalid toc structure in <toc> at items[1].name: found [object Object] value` | an object ended up in `name`/`href`/`title` - almost always broken YAML indentation | fix the indentation; the value must be a string |
| `Invalid TOC entry href in <toc>: expected non-empty string...` | an item has an empty/non-string `href` | set a path or make the item a group with `items` |
| `Unable to resolve <path>... Original error:` | an include points to a missing/broken toc | check `include.path` (the base depends on mode!) |
| `Invalid mode value for include with includers.` | an include with `includers` has mode != `link` | use `mode: link` or drop it |
| `Includer with name '<x>' is not registered.` | an includer without its extension installed (e.g. openapi) | enable the extension (`-e` / `extensions` in .yfm) |

## Links

| Message | Cause | Fix |
|---|---|---|
| `YFM003 / unreachable-link Link is unreachable` | a link to a file that does not exist (`File does not exist in the project`) or is not in toc (`File is not declared in toc`) | create the file / fix the path / add the page to toc.yaml |
| YFM003 with a chain `index.md:5 → _includes/chapter.md:1 ↛ target.html` | the broken link came from an included file - the arrows show the include chain | fix the source include file, not the final page |
| `YFM010 / unreachable-autotitle-anchor` | an autotitle `[{#T}](path.md#anchor)` to a missing file/anchor | check the target file and its headings |
| `Empty link in <path>` | a `[text]()` link | supply an href |
| `Link is unreachable: <link> in index.yaml` | a broken link in a leading page | fix the paths in `links:` (they have no extension) |

## Includes

| Message | Cause | Fix |
|---|---|---|
| `Include skipped in (<f>:<line>). Include source for <path> not found` | the file in `{% include %}` is missing; the path is resolved from the including file's folder | create it / fix the path |
| `Circular includes: a.md ▶ b.md ▶ a.md` | an include cycle | break the cycle |
| `YFM016 <f>: The file is included in itself` | a file includes itself | remove it |
| `YFM014 ...: Anchor "<x>" cannot be used as file path` | `{% include [x](#anchor) %}` - an anchor instead of a path | correct syntax: `{% include [text](file.md) %}` (an anchor is fine as `file.md#anchor`) |
| `YFM015 ...: Anchor "#<x>" not found in <f>` | the target file has no such anchor | check the target file's headings |

## Variables and conditions (liquid)

| Message | Cause | Fix |
|---|---|---|
| `Variable <x> not found in <f>` (WARN) | `{{ x }}` is in neither presets.yaml nor `--vars`; fails the build under strict | add the variable to a preset or drop the substitution |
| `Condition block must be closed` | no `{% endif %}` | close the block |
| `If block must be opened before close` | a stray `{% endif %}` | remove it |
| `For block must be closed` / `...opened before close` | an unclosed/stray `{% endfor %}` | fix it |
| `<x> is undefined or not iterable` | `{% for %}` over a missing list | define the array variable |

## Markup (transform)

| Message | Cause |
|---|---|
| `<token> must be closed in <f>` | an unclosed `{% cut %}` / `{% note %}` / tabs |
| `YFM004 / table-not-closed` | a multiline table without `|#` |
| `Incorrect syntax for notes, file <f>` | a malformed `{% note %}` (type not in info/tip/warning/alert) |
| `Asset not found: <img> in <f>` | the image at the given path does not exist |
| `YFM017 / invalid front matter format [... "duplicated mapping key"]` | a duplicate key in frontmatter |
| `Path was fixed from <a> to <b>` (ERR) | extra `../` in an asset path - the path was "repaired" but the build fails; fix the path |

## Limits

| Message | Cause |
|---|---|
| `YFM013 / File asset limit exceeded` | an asset above `content.maxAssetSize` - compress it or raise the limit |
| `YFM012 / Filesize limit exceeded` | a page's HTML above `content.maxHtmlSize` - split the page |

## YFM codes at a glance

Linter codes (default levels; change via .yfmlint - see references/lint.md):
YFM001 inline code length (warn), YFM002 no heading for autotitle (warn),
YFM003 broken link (**error**), YFM004 unclosed table (**error**),
YFM005 unclosed block (warn), YFM006/007/008/009/018 terms
(duplicate/undefined/term in definition/definitions not at the end (**error**)/from include),
YFM010 broken autotitle anchor (warn), YFM011 svg size (warn),
YFM020 unknown/malformed YFM directive (warn), YFM021 character outside the
BMP - a UTF-16 surrogate pair that may break layout (warn) - this is what
catches generation garbage characters.

Build codes (not configurable via the linter): YFM012 HTML size limit,
YFM013 asset size limit, YFM014/YFM015 include anchors, YFM016 self-include,
YFM017 frontmatter.
