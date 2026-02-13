/**
 * blankmd build
 * Compiles Tiptap editor + styles into a single self-contained HTML file.
 *
 * Usage: bun run build [--output path]
 * Default output: dist/index.html
 */

import * as path from "node:path";
import * as fs from "node:fs";
import chalk from "chalk";

const ROOT_DIR = path.join(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const ENTRY = path.join(SRC_DIR, "editor.ts");
const CSS_PATH = path.join(SRC_DIR, "styles.css");

const MIT_LICENSE = `<!--
  blankmd - A single-file Markdown editor
  
  MIT License
  
  Copyright (c) ${new Date().getFullYear()} blankmd contributors
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
-->`;

async function build(args: string[]) {
	// Parse --output flag, default to dist/index.html
	const outputIdx = args.indexOf("--output");
	const outputArg = outputIdx !== -1 ? args[outputIdx + 1] : undefined;
	const outputPath = outputArg
		? path.resolve(outputArg)
		: path.join(DIST_DIR, "index.html");

	// Ensure output directory exists
	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	console.log(chalk.cyan("Building blankmd..."));

	// 1. Bundle JS (Bun.build inlines all node_modules + CSS imports)
	const result = await Bun.build({
		entrypoints: [ENTRY],
		target: "browser",
		minify: true,
		sourcemap: "none",
		define: {
			IS_STANDALONE: "true",
		},
	});

	if (!result.success) {
		console.error(chalk.red("Build failed:"));
		for (const log of result.logs) console.error(log);
		process.exit(1);
	}

	const jsOutput = result.outputs[0];
	if (!jsOutput) {
		console.error(chalk.red("No build output"));
		process.exit(1);
	}

	const js = await jsOutput.text();

	// 2. Read CSS separately for inlining into <style>
	const css = await Bun.file(CSS_PATH).text();

	// 3. Assemble single HTML file with MIT license header
	const html = `<!DOCTYPE html>
${MIT_LICENSE}
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>blankmd</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>">
  <style>${css}</style>
</head>
<body>
  <div id="editor"></div>
  <script>${js}</script>
</body>
</html>`;

	await Bun.write(outputPath, html);

	const sizeKB = (new Blob([html]).size / 1024).toFixed(1);
	console.log(chalk.green(`✓ Built: ${outputPath} (${sizeKB} KB)`));
}

// Direct execution: bun run scripts/build.ts
build(Bun.argv.slice(2));
