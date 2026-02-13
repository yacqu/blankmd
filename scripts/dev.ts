/**
 * blankmd dev server
 * Serves the editor locally with hot reloading for development.
 *
 * Usage: bun run dev
 * Opens: http://localhost:1999
 */

import * as path from "node:path";
import * as fs from "node:fs";
import chalk from "chalk";

const PORT = 1999;
const ROOT_DIR = path.join(import.meta.dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const ENTRY = path.join(SRC_DIR, "editor.ts");
const CSS_PATH = path.join(SRC_DIR, "styles.css");


async function buildHtml(): Promise<string> {
	// Bundle JS with Bun.build
	const result = await Bun.build({
		entrypoints: [ENTRY],
		target: "browser",
		minify: false,
		sourcemap: "inline",
		define: {
			IS_STANDALONE: "true",
		},
	});

	if (!result.success) {
		const errors = result.logs.map((l) => l.message).join("\n");
		return `<!DOCTYPE html><html><body><pre style="color:red">${errors}</pre></body></html>`;
	}

	const jsOutput = result.outputs[0];
	if (!jsOutput) {
		return `<!DOCTYPE html><html><body><pre style="color:red">No build output</pre></body></html>`;
	}

	const js = await jsOutput.text();
	const css = await Bun.file(CSS_PATH).text();

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>blankmd (dev)</title>
  <style>${css}</style>
</head>
<body>
  <div id="editor"></div>
  <script>${js}</script>

</body>
</html>`;
}



async function startServer() {
	console.log(chalk.cyan("Starting blankmd dev server..."));

	// // Start file watcher
	// const watcher = watchFiles();

	const server = Bun.serve({
		port: PORT,
		async fetch(req) {
			const url = new URL(req.url);

			// Serve the editor
			if (url.pathname === "/" || url.pathname === "/index.html") {
				const html = await buildHtml();
				return new Response(html, {
					headers: { "Content-Type": "text/html" },
				});
			}

			// 404 for everything else
			return new Response("Not Found", { status: 404 });
		},
	});

	console.log(chalk.green(`✓ Server running at http://localhost:${PORT}`));
	console.log(chalk.dim("Watching for changes..."));

	// Handle cleanup on exit
	process.on("SIGINT", () => {
		console.log(chalk.dim("\nShutting down..."));
		// watcher.close();
		server.stop();
		process.exit(0);
	});
}

// Start the dev server
startServer();
