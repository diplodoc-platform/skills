# Terms and definition lists

Two different mechanisms - do not conflate them:

- **Term** `[*key]: ...` - a popup tooltip that opens when the word is clicked
  in text.
- **Definition list** `: ...` - a plain `<dl>/<dt>/<dd>`, just glossary markup
  on the page.

## Terms (popups)

Usage in text and the definition:

```markdown
Usage of a [term](*termkey) in text.

[*termkey]: Definition of the term or abbreviation.
The definition may include _basic_ markup.
```

Rules:

- Place definitions **at the very end of the page**, separated by blank lines.
- The definition body is full markdown (lists, tables, cuts) and may span
  several consecutive lines; by default a definition ends at a blank line or at
  the next `[*key]:`.
- Write term keys in ASCII: letters/digits/`_` (`\w`). Non-ASCII and hyphenated
  keys still render but silently escape the "term used without definition"
  lint check (YFM007).
- A colon immediately after `]`: `[*key]: text`. At most 3 spaces of indent
  before `[` (4+ turns the line into a code block).

### Reuse across pages

Definitions can arrive via include:

```markdown
[*popup-1]: {% include notitle [popup_1](../_includes/popups_examples.md#popup-1) %}
```

In the shared file, definition bodies live under level-4 headings with anchors
(`#### {#popup-1}`).

### Gotchas (build behavior)

- **A term without a definition** renders as plain text `[Text](*key)` - no
  link; the linter reports YFM007 (warn).
- **A duplicate definition** - the first one wins, the second is silently
  ignored (YFM006).
- **A term inside another term's definition** works, but the linter complains
  (YFM008).
- **Unused definitions are stripped** from the output: a definitions file
  included "just in case" renders nothing.
- **Terms do not work in headings** - no popups in titles.
- **Terms do not work inside links.**
- In code blocks the popup only works if the fence has no language specified.

## Definition lists (deflist)

Pandoc-style syntax (the markdown-it-deflist plugin, enabled by default -
nothing to configure):

```markdown
Term 1

:   Definition 1

Term 2

:   Definition 2
```

Rules:

- The marker is `:` (or `~`); **a space after the marker is mandatory**:
  `:Definition` does not parse.
- The blank line between the term and `:` is optional; with it the list is
  "loose" (paragraphs wrapped in `<p>`), without it - tight.
- The term is strictly one line, inline markup only.
- A multi-paragraph definition: continuation indented by 4 spaces
  (the `:   ` convention plus alignment):

```markdown
Term

:   First paragraph of the definition.

    Second paragraph.

    - a list item inside the definition
```

- One term may have several definitions (repeated `:` lines); lists nest with
  indentation.
