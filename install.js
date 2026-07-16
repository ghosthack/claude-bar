#!/usr/bin/env node
// Installs the claude-bar status line into Claude Code's user settings.
//   - copies statusline.js to ~/.claude/statusline.js
//   - merges a `statusLine` entry into ~/.claude/settings.json (preserving
//     any existing settings)
// Cross-platform (Windows / macOS / Linux). Re-running is safe (idempotent).
const fs = require('fs');
const os = require('os');
const path = require('path');

const claudeDir = path.join(os.homedir(), '.claude');
const srcScript = path.join(__dirname, 'statusline.js');
const dstScript = path.join(claudeDir, 'statusline.js');
const settingsPath = path.join(claudeDir, 'settings.json');

fs.mkdirSync(claudeDir, { recursive: true });

// 1. Copy the status line script next to the user's settings.
fs.copyFileSync(srcScript, dstScript);
console.log(`✓ copied script -> ${dstScript}`);

// 2. Merge the statusLine entry into settings.json without clobbering it.
let settings = {};
if (fs.existsSync(settingsPath)) {
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (e) {
    console.error(`! ${settingsPath} is not valid JSON; aborting so nothing is lost.`);
    console.error(`  Fix or remove it, then re-run. (${e.message})`);
    process.exit(1);
  }
}

settings.statusLine = {
  type: 'command',
  command: `node "${dstScript}"`,
};

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
console.log(`✓ updated ${settingsPath}`);
console.log('\nDone. Open a new Claude Code session (or start a turn) to see the status line.');
