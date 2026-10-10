# claude-bar

A minimal [Claude Code](https://claude.com/claude-code) status line showing the
current model, reasoning effort, context usage, and — for Claude.ai Pro/Max
subscribers — 5-hour rate limit usage with a reset countdown.

```
🧠 Fable 5 high 💾 33k █░░░ 3% ⏳ 4h19m █░░░ 6% 📁 ~/Projects/claude-bar ⎇ main
```

> **Note:** this repo ships a [`CLAUDE.md`](CLAUDE.md) that tells Claude Code to
> run `node install.js`. If you'd rather not, delete `CLAUDE.md` after cloning 
> or use the [manual install](#manual-install).

- **Model + effort** — the active model's display name and reasoning effort
  (`low`–`max`). Tracks live `/effort` changes; omitted for models without the
  effort parameter.
- **Context** — 💾 tokens currently in context, plus a four-cell bar (one `█`
  per 25%) and the percentage of the model's context window used.
- **Rate limit** — ⏳ time until reset, then a bar and percentage
  of the 5-hour usage window consumed. Appears after the first API response;
  absent on usage-based billing plans.
- **Directory** — 📁 working directory (home shortened to `~`), plus `⎇` and
  the git branch (short SHA when detached) inside a repo.

## Install

Needs only Claude Code and Node.js (optionally to "auto" install).

```sh
git clone https://github.com/ghosthack/claude-bar.git
cd claude-bar
node install.js
```

The installer copies `statusline.js` to `~/.claude/statusline.js` and merges a
`statusLine` entry into `~/.claude/settings.json` (existing settings are
preserved; it aborts if that file isn't valid JSON). Works on Windows, macOS,
and Linux. Open a new session — or just start a turn — to see the bar.

## Manual install

Copy `statusline.js` to `~/.claude/` and add this to `~/.claude/settings.json`
(use the absolute path; on Windows, escape backslashes):

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"/home/you/.claude/statusline.js\""
  }
}
```

## How it works

Claude Code pipes a JSON payload to the status line command on each update. The
script reads `model.display_name`, `effort.level`, context usage from
`context_window`, and the rate limit segment from `rate_limits.five_hour`
(Pro/Max only). On older builds without `context_window`, it falls back to
summing token usage from the most recent assistant message in the session
transcript, measured against `FALLBACK_MAX`.

## Customizing

Constants at the top of `statusline.js`: `CELLS` (bar width, default `4`),
`FILL` / `EMPTY` (bar characters), and `FALLBACK_MAX` (token budget for the
transcript fallback, default `1_000_000`). Re-run `node install.js` after
editing.

## Uninstall

Delete `~/.claude/statusline.js` and remove the `statusLine` block from
`~/.claude/settings.json`.

## License

MIT — see [LICENSE](LICENSE).
