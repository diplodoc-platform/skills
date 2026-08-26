# Skill evals

A harness that checks the skills actually work: for every case an agent gets a
writing task in a scratch Diplodoc project with the skill installed, and the
result is validated **by the real `yfm` build** - not by prose expectations.

Why build-based validation: YFM has an objective arbiter. If a generated page
uses an unclosed `{% note %}`, a broken link, or syntax that is not enabled by
default, `yfm build -s` fails with a specific code (YFM003, YFM004, MD*...).
That makes evals reproducible and judge-free; regex checks cover the rest
(the right construct was used, banned constructs were not).

## Running

```bash
node evals/run.mjs yfm             # run all cases for the yfm skill
node evals/run.mjs yfm --case 3    # one case
node evals/run.mjs yfm --keep      # keep scratch dirs for inspection
```

Requirements: Node 18+, network for `npx @diplodoc/cli`, and an agent CLI.
By default the runner invokes Claude Code:

```bash
claude -p "<prompt>" --permission-mode acceptEdits
```

Override with any agent command via `EVAL_AGENT_CMD`; `{prompt}` is replaced
with the case prompt (shell-quoted):

```bash
EVAL_AGENT_CMD='claude -p {prompt} --permission-mode acceptEdits --model sonnet' node evals/run.mjs yfm
```

For every case the runner:

1. creates a scratch dir with a minimal Diplodoc project (`docs/toc.yaml`,
   `docs/index.md`) or a case fixture (`evals/<skill>/fixtures/<id>/`);
2. installs the skill under test into `.claude/skills/<skill>/` of the scratch
   dir, so the agent discovers it naturally (a case set may declare
   `"skills": [...]` to install several, e.g. yfm + diplodoc-project);
3. runs the agent with the case prompt (cwd = scratch dir);
4. validates:
   - `build: clean` - `yfm build -s` must pass with zero ERR/WARN;
   - `build: { forbidCodes: [...] }` / `{ expectCodes: [...] }` - specific
     diagnostics must be absent/present;
   - `checks` - regex assertions over produced files
     (`present: false` bans a pattern).

Exit code is non-zero if any case fails - safe for CI (set `ANTHROPIC_API_KEY`
and cache `npx` in the workflow).

## Case format

`evals/<skill>/cases.json`:

```json
{
  "skill": "yfm",
  "cases": [
    {
      "id": 1,
      "name": "tabs-page",
      "prompt": "Create docs/install.md ...",
      "build": "clean",
      "checks": [
        {"file": "docs/install.md", "pattern": "\\{% list tabs", "present": true}
      ]
    }
  ]
}
```

## What this is not

Not a benchmark of models - it is a regression test of the *skill text*: if an
edit to SKILL.md makes agents start producing broken markup, the eval catches
it. Run it when changing a skill, with the same agent/model pinned.
