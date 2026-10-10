#!/usr/bin/env node
// Claude Code status line: model + effort | context tokens + usage bar | path.
const fs = require('fs');
const os = require('os');

const CELLS = 4;                        // number of bar characters
const FILL = '█';                       // highest-density block
const EMPTY = '░';                      // lowest-density (light shade) block
const FALLBACK_MAX = 1_000_000;         // only used if the payload lacks context_window (older Claude Code)

function renderBar(pct) {
  // 0-25 -> 1 cell, 26-50 -> 2, 51-75 -> 3, 76-100 -> 4 (always at least 1).
  const full = Math.min(CELLS, Math.max(1, Math.ceil(pct / 25)));
  return FILL.repeat(full) + EMPTY.repeat(CELLS - full);
}

function fmt(n) {
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return String(n);
}

// Working directory, with $HOME collapsed to ~ (e.g. /Users/you/Projects -> ~/Projects).
function fmtPath(data) {
  const dir = (data.workspace && data.workspace.current_dir) || data.cwd || '';
  if (!dir) return '';
  const home = os.homedir();
  if (dir === home) return '~';
  if (home && dir.startsWith(home + '/')) return '~' + dir.slice(home.length);
  return dir;
}

function fmtEta(epochSec) {
  const secs = Math.max(0, Math.round(epochSec - Date.now() / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? m + 'm' : ''}`;
  return `${m}m`;
}

// Fallback for older Claude Code builds without a context_window field: walk
// the transcript backwards to the most recent assistant usage.
function transcriptTokens(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return 0;
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    const u = obj && obj.message && obj.message.usage;
    if (u && typeof u.input_tokens === 'number') {
      return (u.input_tokens || 0) +
             (u.cache_creation_input_tokens || 0) +
             (u.cache_read_input_tokens || 0);
    }
  }
  return 0;
}

// Tokens currently in context + percentage of the model's window. Prefer the
// payload's context_window; fall back to the transcript measured against 1M.
function contextStats(data) {
  const cw = data.context_window;
  const u = cw && cw.current_usage;
  if (u) {
    const tokens = (u.input_tokens || 0) +
                   (u.cache_creation_input_tokens || 0) +
                   (u.cache_read_input_tokens || 0);
    const pct = typeof cw.used_percentage === 'number'
      ? cw.used_percentage
      : (cw.context_window_size ? (tokens / cw.context_window_size) * 100 : 0);
    return { tokens, pct };
  }
  const tokens = transcriptTokens(data.transcript_path);
  return { tokens, pct: (tokens / FALLBACK_MAX) * 100 };
}

let raw = '';
process.stdin.on('data', c => (raw += c));
process.stdin.on('end', () => {
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  const model = (data.model && data.model.display_name) || 'Claude';
  const effort = data.effort && data.effort.level;   // absent when the model has no effort parameter
  const { tokens, pct } = contextStats(data);
  const pctRounded = Math.round(pct);

  const rl = data.rate_limits && data.rate_limits.five_hour;
  const fiveHourUsed = rl && typeof rl.used_percentage === 'number' ? Math.round(rl.used_percentage) : null;
  const resetsAt = rl && rl.resets_at;

  const dir = fmtPath(data);

  const segments = [
    effort ? `🧠 ${model} ${effort}` : `🧠 ${model}`,
    `💾 ${fmt(tokens)}`,
    `${renderBar(pctRounded)} ${pctRounded}%`,
  ];

  if (fiveHourUsed !== null) {
    const eta = resetsAt ? `${fmtEta(resetsAt)} ` : '';
    segments.push(`⏳ ${eta}${renderBar(fiveHourUsed)} ${fiveHourUsed}%`);
  }

  if (dir) segments.push(`📁 ${dir}`);

  process.stdout.write(segments.join(' '));
});
