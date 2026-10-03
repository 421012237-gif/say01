#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function resolveStyle() {
  const root = fs.realpathSync(path.join(__dirname, '..', 'assets', 'style'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'style-lock.json'), 'utf8'));
  if (manifest.schema_version !== 1 || !Array.isArray(manifest.references)) {
    throw new Error('画风记录格式不支持，请重新安装完整 Skill。');
  }
  const allowedRoles = new Set(['primary_style', 'detail_style', 'review_only']);
  const references = manifest.references.map((ref) => {
    if (!ref || typeof ref.file !== 'string' || path.isAbsolute(ref.file) ||
        !allowedRoles.has(ref.role) || !/^[a-f0-9]{64}$/.test(ref.sha256 || '')) {
      throw new Error('画风记录含无效文件或角色。');
    }
    const file = fs.realpathSync(path.resolve(root, ref.file));
    if (!file.startsWith(root + path.sep) || !fs.statSync(file).isFile()) {
      throw new Error('样片必须位于 Skill 的画风资源目录内。');
    }
    const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (digest !== ref.sha256) throw new Error('样片内容与记录不符：' + ref.file);
    return { role: ref.role, path: file, sha256: digest };
  });
  const generationReferences = ['primary_style', 'detail_style'].map((role) => {
    const matches = references.filter((ref) => ref.role === role);
    if (matches.length !== 1) throw new Error('必须有且仅有一张 ' + role + ' 样片。');
    return matches[0];
  });
  return {
    ready: true,
    styleId: manifest.style_id,
    generationReferences,
    reviewReferences: references.filter((ref) => ref.role === 'review_only'),
    customerSuppliesStyleImage: false,
    identityInput: 'Use the current customer photo separately; never inherit the example identity or accessories.',
    limitation: 'Asset integrity verified only. Open these images and attach them to the drawing tool; visual quality still requires review.'
  };
}
if (require.main === module) {
  try {
    if (process.argv.length !== 2) throw new Error('用法：node scripts/resolve-style.cjs');
    process.stdout.write(JSON.stringify(resolveStyle(), null, 2) + '\n');
  } catch (error) {
    process.stderr.write('无法使用内置画风样片：' + error.message + '\n');
    process.exitCode = 2;
  }
}
module.exports = { resolveStyle };
