/**
 * Shared HTML template for blankmd build and dev server.
 * Single source of truth for the page structure.
 */

export interface HtmlTemplateOptions {
	title: string;
	css: string;
	js: string;
	/** Optional header content injected before <html> (e.g. license comment) */
	preamble?: string;
	/** Include favicon data URI (production builds) */
	favicon?: boolean;
}

export function renderHtml(opts: HtmlTemplateOptions): string {
	const { title, css, js, preamble, favicon = true } = opts;

	const faviconTag = favicon
		? `\n  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>">`
		: "";

	return `<!DOCTYPE html>
${preamble ?? ""}
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>${faviconTag}
  <style>${css}</style>
</head>
<body>
  <div id="app">
    <aside id="sidebar" class="md-sidebar"></aside>
    <div class="md-resizer"></div>
    <div class="md-sidebar-backdrop"></div>
    <div id="editor"></div>
  </div>
  <script>${js}</script>
</body>
</html>`;
}
