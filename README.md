# Diplodoc Agent Skills

Agent skills for the [Diplodoc](https://diplodoc.com) documentation platform,
maintained by the Diplodoc team. Skills teach AI coding agents (Claude Code,
Cursor, Codex, and others) to work with Diplodoc correctly: write YFM markup
that builds cleanly, configure projects, and decode build errors.

## Skills

| Skill | Description |
|---|---|
| [yfm](skills/yfm/SKILL.md) | YFM (Yandex Flavored Markdown) syntax: writing articles, multiline tables, terms, toc.yaml mechanics, linter rules and `.yfmlint`, build error decoding |

## Installation

With the [skills](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills add diplodoc-platform/skills
```

Or copy a skill directory into your agent's skills folder, e.g. for Claude Code:

```bash
cp -r skills/yfm ~/.claude/skills/yfm
```

## Structure

Each skill is a directory under `skills/` with a `SKILL.md` entry point
(frontmatter: `name`, `description`) and optional `references/` with
per-topic deep dives that agents load on demand.

## Contributing

Facts in these skills are verified against the Diplodoc source code
([cli](https://github.com/diplodoc-platform/cli),
[transform](https://github.com/diplodoc-platform/transform)) and the official
[documentation](https://diplodoc.com/docs/en/). When contributing, please keep
that bar: every behavioral claim should be traceable to code, docs, or a
reproducible build.

## License

MIT
