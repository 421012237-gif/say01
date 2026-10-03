#!/usr/bin/env node
'use strict';

// Verify the current executor without reading customer files or accessing a network.
async function checkRuntime() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  const supported = major > 20 || (major === 20 && minor >= 9);
  const result = {
    schema: 1,
    node: { version: process.versions.node, supported },
    system: { platform: process.platform, arch: process.arch },
    sharp: { available: false, expected_version: '0.35.4' },
    gif_encoding: { status: 'not_checked' },
    ready_for_local_export: false,
    full_agent_workflow: 'not_verified',
    agent_must_verify: ['reference_image_viewing', 'reference_image_editing', 'project_write_access', 'visual_review', 'downloadable_delivery', 'execution_location'],
  };
  if (!supported) {
    result.action = 'Use Node >=20.9 in the current executor; do not assume the desktop and cloud share a runtime.';
    return result;
  }
  let sharp;
  try { sharp = require('sharp'); }
  catch (error) {
    result.sharp.reason = error.code === 'MODULE_NOT_FOUND' ? 'dependency_missing' : 'dependency_load_failed';
    result.action = 'Use an existing host runtime, or install this skill package dependency in the chosen executor.';
    return result;
  }
  result.sharp.available = true;
  result.sharp.version = sharp.versions.sharp;
  result.sharp.matches_declared_version = sharp.versions.sharp === '0.35.4';
  try {
    const rgba = Buffer.alloc(16 * 16 * 4 * 2);
    for (let f = 0; f < 2; f++) for (let y = 4; y < 12; y++) for (let x = 4 + f; x < 11 + f; x++) {
      const at = (f * 16 * 16 + y * 16 + x) * 4;
      rgba[at + f] = 220; rgba[at + 3] = 255;
    }
    const gif = await sharp(rgba, { raw: { width: 16, height: 32, channels: 4, pageHeight: 16 } })
      .gif({ loop: 0, delay: [120, 120] }).toBuffer();
    const meta = await sharp(gif, { animated: true }).metadata();
    if (meta.format !== 'gif' || meta.pages !== 2 || meta.loop !== 0 || !meta.hasAlpha) throw new Error('Unexpected GIF metadata');
    result.gif_encoding = { status: 'passed', frames: meta.pages, transparency: meta.hasAlpha, loop: meta.loop };
    result.ready_for_local_export = result.sharp.matches_declared_version;
    if (!result.ready_for_local_export) result.action = 'Use the declared sharp version or separately validate this version before delivery.';
  } catch {
    result.gif_encoding = { status: 'failed' };
    result.action = 'Repair the local image encoding runtime before attempting customer exports.';
  }
  return result;
}

if (require.main === module) {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log('node scripts/runtime-check.cjs\nChecks Node, sharp and an in-memory synthetic GIF. No customer files, model calls or network access.');
  } else if (process.argv.length !== 2) {
    console.error('No arguments are accepted other than --help.'); process.exitCode = 1;
  } else {
    checkRuntime().then(report => {
      console.log(JSON.stringify(report, null, 2));
      if (!report.ready_for_local_export) process.exitCode = 2;
    }).catch(() => { console.error('Runtime check failed.'); process.exitCode = 1; });
  }
}
module.exports = { checkRuntime };
