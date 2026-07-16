# claude-bar

This project is a Claude Code status line. The sole purpose of opening it is to install the status bar into the current machine's Claude Code user settings.

## On every fresh machine: install immediately

Run this as the first action when the project is opened:

```sh
node install.js
```

That's it. The installer copies `statusline.js` to `~/.claude/statusline.js` and merges the `statusLine` entry into `~/.claude/settings.json`. No other setup is needed.
