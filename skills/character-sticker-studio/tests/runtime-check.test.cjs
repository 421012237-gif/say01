'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const script = path.resolve(__dirname, '../scripts/runtime-check.cjs');
const { checkRuntime } = require(script);

test('runtime check really encodes GIF and leaves agent workflow unverified', async () => {
  const r = await checkRuntime();
  assert.equal(r.node.supported, true);
  assert.equal(r.sharp.matches_declared_version, true);
  assert.equal(r.gif_encoding.status, 'passed');
  assert.equal(r.gif_encoding.frames, 2);
  assert.equal(r.gif_encoding.transparency, true);
  assert.equal(r.ready_for_local_export, true);
  assert.equal(r.full_agent_workflow, 'not_verified');
});

test('fresh executor without sharp reports dependency gap and creates no files', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sticker-no-dependency-'));
  try {
    const isolated = path.join(temp, 'runtime-check.cjs');
    fs.copyFileSync(script, isolated);
    const r = cp.spawnSync(process.execPath, [isolated], { encoding: 'utf8', cwd: temp, env: { ...process.env, NODE_PATH: '' } });
    assert.equal(r.status, 2, r.stderr);
    const report = JSON.parse(r.stdout);
    assert.equal(report.sharp.available, false);
    assert.equal(report.sharp.reason, 'dependency_missing');
    assert.equal(report.ready_for_local_export, false);
    assert.deepEqual(fs.readdirSync(temp), ['runtime-check.cjs']);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('help is available without dependencies and unknown options are rejected', () => {
  const help = cp.spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  const unknown = cp.spawnSync(process.execPath, [script, '--upload'], { encoding: 'utf8' });
  assert.equal(unknown.status, 1);
});
