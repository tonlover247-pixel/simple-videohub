# Simple VideoHub

Minimal live-preview + notes tool for code-based films (Claude Code workflow).

## What it does
- Live preview of films written as web pages (no render needed)
- Click on frames to drop circles + add text notes
- Copy notes in a format Claude can read and fix
- Basic full render later

## Run
```bash
cd simple-videohub
node server.js
```
Open http://127.0.0.1:7788

## Film contract
Your film HTML must expose:
```js
window.renderOut = (t) => { /* draw frame at time t */ }
window.duration = 10; // seconds
window.READY = true
```

## Notes format sent to Claude
```
Video notes on "example":
- 2.3s — circle at (45%, 60%) — "make the circle bigger"
- 5.1s — "change subtitle color"
```

Built as a focused starting point. Expand with MCP, partial renders, or sound as needed.
