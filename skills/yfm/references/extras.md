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
  disable per-image with `{inline=false}`. Because of the inlining, do not
  hardcode colors in SVG - the host may render a dark theme.
- Images and videos open in a click-through **gallery** by default; opt out
  per image with `{gallery=false}`, or serve a heavier file to the gallery
  with `{gallery-src=_images/full.jpg}` on a small preview.

### Video

```markdown
@[youtube](dQw4w9WgXcQ)
@[vimeo](19706846)
@[](https://frontend.vh.yandex.ru/player/...)   # any player by iframe URL
```

Supported providers: `youtube`, `vimeo`, `vine`, `prezi`, `osf`, `yandex`,
`vk`, `rutube`, plus generic `url`. For `vk`/`rutube` pass full URLs, not bare
IDs. If an embedded player is blocked by CSP, the host must allow it in
`frame-src` (in Diplodoc - the `resources.csp` section of `.yfm`).

## Inline formatting beyond GFM

Enabled by default in the CLI build:

| Syntax | Result |
|---|---|
| `^text^` | superscript (markdown-it-sup) |
| `##text##` | monospace |
| `{green}(text)` | colored text: any CSS color or semantic name, nestable - `{red}(a {blue}(b))` |

## Code

- Inline code: `` `fragment` ``; keep it under 100 characters - inline code
  does not wrap.
- Block code: fenced with ``` and a language for highlighting (highlight.js
  set: bash, python, go, json, sql, yaml, and ~30 more).
- Fence options after the language:

  ````markdown
  ```bash showLineNumbers wrap prompt="$"
  $ npm install
  ```
  ````

  `showLineNumbers` - line numbers; `wrap` - soft-wrap long lines;
  `prompt="$"` - the prompt is rendered but excluded from select/copy.
- To show literal `{{ ... }}` without variable substitution, prefix it with
  `not_var`: `not_var{{ variable }}` renders as `{{ variable }}` (works only
  for fragments of `.-|(),_`, letters, digits and spaces).

## Diagrams, formulas, page constructor

Built into @diplodoc/cli v5 builds (on older toolchains and other hosts these
require enabling extensions):

- **Mermaid** - a fenced code block with the `mermaid` language; the type
  catalog, node/edge syntax and caveats are in `references/diagrams.md`.

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
| `==text==` | highlight (mark) | needs markdown-it-mark |
| `- [ ]` / `- [x]` | task list checkboxes | the checkbox plugin ships with the transformer but is OFF by default; hosts enable it via config |
| raw HTML | any tags | escaped or sanitized depending on host settings; `<script>`/`on*` always stripped |

When in doubt whether a project enables such a plugin, do not use the syntax -
express the same thing with core YFM.
