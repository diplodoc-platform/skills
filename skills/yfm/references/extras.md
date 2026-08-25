# More YFM syntax: interactive variants, media, inline extras

Everything here is verified against @diplodoc/cli v5.55 (its built-in plugin
set) and the official docs.

## Tabs variants: radio, dropdown, accordion

`{% list tabs %}` has four render variants; the list body syntax is identical:

```markdown
{% list tabs radio %}      <!-- radio buttons -->
{% list tabs dropdown %}   <!-- dropdown selector -->
{% list tabs accordion %}  <!-- accordion -->
{% list tabs %}            <!-- regular tabs (default) -->

- Option 1

  Content indented by 2 spaces.

- Option 2

  Content.

{% endlist %}
```

- Valid variants are exactly: regular, `radio`, `dropdown`, `accordion`
  (anything else is a YFM020 lint warning).
- All variants support `group=<name>` synchronization: same-group elements
  switch together across the whole project, and the selection persists across
  pages and reloads.
- Variants can be nested (e.g. a radio list inside a radio option).

## Media

### Images

```markdown
![alt text](_images/image.png "tooltip"){width=100 height=100}
```

- **Store images in a directory whose name starts with `_`** (e.g. `_images/`,
  `_assets/`) - otherwise the files are removed during the build.
- To keep the original aspect ratio, set **only one** of width/height.
- Clickable image - image markup inside link text:
  `[![alt](_images/pic.png)](https://example.com)`.
- Reference-style images work: `![alt][img1]` ... `[img1]: _images/pic.png`.
- SVG images are inlined into the HTML as `<svg>` (so theme styles apply);
  disable per-image with `{inline=false}`. Inline SVG larger than
  `--max-inline-svg-size` (default 2M) triggers YFM011.

### Video

```markdown
@[youtube](dQw4w9WgXcQ)
@[vimeo](19706846)
```

Supported providers: `youtube`, `vimeo`, `vine`, `prezi`, `osf`, `yandex`,
`vk`, `rutube`, plus generic `url`.

## Inline formatting beyond GFM

Enabled by default in the CLI build:

| Syntax | Result |
|---|---|
| `^text^` | superscript (markdown-it-sup) |
| `##text##` | monospace |
| `{green}(text)` | colored text: any CSS color or semantic name, nestable - `{red}(a {blue}(b))` |

## Code

- Inline code: `` `fragment` ``; keep it under 100 characters (YFM001) - inline
  code does not wrap.
- Block code: fenced with ``` and a language for highlighting (highlight.js
  set: bash, python, go, json, sql, yaml, and ~30 more).
- To show literal `{{ ... }}` without variable substitution, prefix it with
  `not_var`: `not_var{{ variable }}` renders as `{{ variable }}`.

## Diagrams, formulas, page constructor

Built into @diplodoc/cli v5 builds (on older toolchains these required
enabling extensions):

- **Mermaid** - a fenced code block with the `mermaid` language:

  ````markdown
  ```mermaid
  graph LR
      A["Client"] --> B["Server"]
  ```
  ````

- **LaTeX (KaTeX)** - inline `$c = \pm\sqrt{a^2 + b^2}$`, block:

  ```markdown
  $$
  c = \pm\sqrt{a^2 + b^2}
  $$
  ```

- **Page constructor** - `::: page-constructor` blocks with YAML content for
  landing-style pages (see the official docs before using; the block is
  excluded from linting).

## NOT supported by default - a common generation trap

These render as literal text unless the project explicitly adds the
corresponding markdown-it plugin. Do not emit them by habit:

| Syntax | What it would be | Status |
|---|---|---|
| `[^1]` + `[^1]: ...` | footnotes | needs markdown-it-footnote |
| `~text~` | subscript | needs markdown-it-sub |
| `++text++` | underline | needs markdown-it-ins |
| `- [ ]` / `- [x]` | task list checkboxes | needs the checkbox plugin |
| raw HTML | any tags | escaped unless `allowHtml` and sanitizer allow it |

When in doubt whether a project enables such a plugin, do not use the syntax -
express the same thing with core YFM.
