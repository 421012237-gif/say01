'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'shiyi-style-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const root = path.join(base, '买家解压 目录');
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.cpSync(path.join(__dirname, '..', 'assets', 'style'), path.join(root, 'assets', 'style'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '..', 'scripts', 'resolve-style.cjs'), path.join(root, 'scripts', 'resolve-style.cjs'));
  return root;
}
function run(root) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'resolve-style.cjs')], {
    cwd: os.tmpdir(), encoding: 'utf8'
  });
}
test('relocated package resolves bundled references without original workspace or local index', (t) => {
  const root = fixture(t);
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  const data = JSON.parse(result.stdout);
  assert.equal(data.ready, true);
  assert.equal(data.customerSuppliesStyleImage, false);
  assert.deepEqual(data.generationReferences.map((r) => r.role), ['primary_style', 'detail_style']);
  for (const ref of [...data.generationReferences, ...data.reviewReferences]) {
    assert.ok(ref.path.startsWith(fs.realpathSync(root) + path.sep));
    assert.ok(fs.existsSync(ref.path));
  }
});
test('missing style image blocks preparation instead of silently falling back to text', (t) => {
  const root = fixture(t);
  fs.unlinkSync(path.join(root, 'assets', 'style', 'approved-detail.png'));
  const result = run(root);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /无法使用内置画风样片/);
});
test('modified style image is rejected before drawing', (t) => {
  const root = fixture(t);
  fs.appendFileSync(path.join(root, 'assets', 'style', 'original24-greeting.png'), 'changed');
  const result = run(root);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /样片内容与记录不符/);
});
