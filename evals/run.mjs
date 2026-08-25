#!/usr/bin/env node
/**
 * Skill eval runner. See evals/README.md.
 *
 * Usage: node evals/run.mjs <skill> [--case <id>] [--keep]
 * Env:   EVAL_AGENT_CMD - agent command template, '{prompt}' is substituted.
 */
import {execSync, spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const skill = args[0];
if (!skill) {
    console.error('usage: node evals/run.mjs <skill> [--case <id>] [--keep]');
    process.exit(2);
}
const onlyCase = args.includes('--case') ? Number(args[args.indexOf('--case') + 1]) : null;
const keep = args.includes('--keep');

const spec = JSON.parse(readFileSync(join(ROOT, 'evals', skill, 'cases.json'), 'utf8'));
const skillDir = join(ROOT, 'skills', skill);
if (!existsSync(skillDir)) {
    console.error(`no such skill: ${skillDir}`);
    process.exit(2);
}

const AGENT_CMD = process.env.EVAL_AGENT_CMD || `claude -p {prompt} --permission-mode acceptEdits`;

function scaffold(dir) {
    mkdirSync(join(dir, 'docs'), {recursive: true});
    writeFileSync(
        join(dir, 'docs', 'toc.yaml'),
        'title: Eval project\nhref: index.md\nitems:\n  - name: Overview\n    href: index.md\n',
    );
    writeFileSync(join(dir, 'docs', 'index.md'), '# Overview\n\nProject overview page.\n');
}

function runBuild(dir) {
    const res = spawnSync(
        'npx',
        ['-y', '-p', '@diplodoc/cli', 'yfm', '-i', 'docs', '-o', 'build-out', '-s'],
        {cwd: dir, encoding: 'utf8', timeout: 300_000},
    );
    const output = `${res.stdout || ''}${res.stderr || ''}`;
    return {code: res.status, output};
}

let failed = 0;
const cases = spec.cases.filter((c) => onlyCase === null || c.id === onlyCase);
for (const c of cases) {
    const dir = mkdtempSync(join(tmpdir(), `eval-${skill}-${c.id}-`));
    const problems = [];
    try {
        const fixture = join(ROOT, 'evals', skill, 'fixtures', String(c.id));
        if (existsSync(fixture)) {
            cpSync(fixture, dir, {recursive: true});
        } else {
            scaffold(dir);
        }
        cpSync(skillDir, join(dir, '.claude', 'skills', skill), {recursive: true});

        const cmd = AGENT_CMD.replace('{prompt}', JSON.stringify(c.prompt));
        execSync(cmd, {cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], timeout: 600_000});

        if (c.build) {
            const {code, output} = runBuild(dir);
            const diagnostics = output.split('\n').filter((l) => /^(ERR|WARN) /.test(l));
            if (c.build === 'clean') {
                if (code !== 0 || diagnostics.length) {
                    problems.push(`build not clean (exit ${code}):\n    ${diagnostics.join('\n    ') || output.slice(-400)}`);
                }
            } else {
                for (const bad of c.build.forbidCodes || []) {
                    if (output.includes(bad)) problems.push(`forbidden diagnostic ${bad} present`);
                }
                for (const wanted of c.build.expectCodes || []) {
                    if (!output.includes(wanted)) problems.push(`expected diagnostic ${wanted} missing`);
                }
            }
        }
        for (const check of c.checks || []) {
            const file = join(dir, check.file);
            const content = existsSync(file) ? readFileSync(file, 'utf8') : null;
            if (content === null) {
                problems.push(`file missing: ${check.file}`);
                continue;
            }
            const hit = new RegExp(check.pattern, 'm').test(content);
            const want = check.present !== false;
            if (hit !== want) {
                problems.push(`${check.file}: pattern /${check.pattern}/ ${want ? 'not found' : 'must be absent'}`);
            }
        }
    } catch (e) {
        problems.push(`runner error: ${e.message}`);
    }

    const status = problems.length ? 'FAIL' : 'PASS';
    if (problems.length) failed++;
    console.log(`[${status}] ${skill}#${c.id} ${c.name}${keep || problems.length ? `  (${dir})` : ''}`);
    for (const p of problems) console.log(`  - ${p}`);
    if (!keep && !problems.length) rmSync(dir, {recursive: true, force: true});
}

console.log(`\n${cases.length - failed}/${cases.length} passed`);
process.exit(failed ? 1 : 0);
