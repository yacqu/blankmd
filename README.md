# blankmd

A single-file Markdown editor. Build once, keep forever.

[![Download](https://img.shields.io/github/v/release/yourusername/blankmd?label=Download&style=flat-square)](https://github.com/yourusername/blankmd/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)

## Philosophy

**blankmd** is a markdown editor that compiles to a single, self-contained HTML file. No servers, no dependencies, no internet required—just one file you can save anywhere and use forever.

* 📝 **Single File** — One HTML file contains everything
* 🔒 **Private** — Your content stays in your browser's localStorage
* ⚡ **Fast** — No network requests, instant load times
* 🌐 **Portable** — Works offline, runs anywhere with a browser
* 🎨 **Customizable** — Built-in settings for fonts, themes, and spacing

## Quick Start

### Download

Download the latest `index.html` from the [Releases page](https://github.com/yourusername/blankmd/releases), or try it online at the [GitHub Pages demo](https://yourusername.github.io/blankmd).

### Use

1. Open `index.html` in any browser
2. Start writing
3. Your content auto-saves to browser localStorage

That's it. No installation, no accounts, no setup.

## Development

### Prerequisites

* [Bun](https://bun.sh) runtime

### Setup

```bash
git clone https://github.com/yourusername/blankmd.git
cd blankmd
bun install
```

### Dev Server

Run the development server with hot reloading:

```bash
bun run dev
```

Opens at [http://localhost:1999](http://localhost:1999)

### Build

Generate the single-file `dist/index.html` :

```bash
bun run build
```

Custom output path:

```bash
bun run build --output ~/Desktop/my-editor.html
```

## Project Structure

```
blankmd/
├── src/
│   ├── editor.ts      # Main editor initialization
│   ├── settings.ts    # Settings panel UI
│   ├── toolbar.ts     # Toolbar UI
│   └── styles.css     # All styles
├── scripts/
│   ├── build.ts       # Production build script
│   └── dev.ts         # Development server
├── dist/
│   └── index.html     # Built output (gitignored)
└── package.json
```

## Tech Stack

* [Tiptap](https://tiptap.dev) — Headless rich-text editor
* [ProseMirror](https://prosemirror.net) — Core editing framework
* [lowlight](https://github.com/wooorm/lowlight) — Syntax highlighting
* [Bun](https://bun.sh) — Build tooling

## License

MIT
