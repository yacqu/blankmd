/**
 * SVG Icons for the editor UI
 * All icons use a consistent 16x16 or 18x18 viewBox with stroke-based design
 * @module ui/icons
 */

type IconSize = 16 | 18 | 24;

interface IconOptions {
	size?: IconSize;
	strokeWidth?: number;
	className?: string;
}

/**
 * Create an SVG element with common attributes
 */
function createSvg(
	size: IconSize,
	strokeWidth: number,
	content: string,
	className?: string
): string {
	return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${className ? ` class="${className}"` : ""}>${content}</svg>`;
}

/**
 * Icon definitions
 */
export const icons = {
	// Formatting
	bold: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>`,
			opts.className
		),

	italic: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line>`,
			opts.className
		),

	code: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<path d="M10 9.5L8 12l2 2.5"></path><path d="M14 9.5l2 2.5-2 2.5"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect>`,
			opts.className
		),

	codeBlock: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>`,
			opts.className
		),

	// Lists
	bulletList: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>`,
			opts.className
		),

	orderedList: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>`,
			opts.className
		),

	// Block elements
	blockquote: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="3" y1="6" x2="3" y2="18"></line><line x1="9" y1="6" x2="21" y2="6"></line><line x1="9" y1="12" x2="21" y2="12"></line><line x1="9" y1="18" x2="21" y2="18"></line>`,
			opts.className
		),

	horizontalRule: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="5" y1="12" x2="19" y2="12"></line>`,
			opts.className
		),

	// UI elements
	menu: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 18, opts.strokeWidth ?? 2,
			`<line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line>`,
			opts.className
		),

	settings: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 18, opts.strokeWidth ?? 2,
			`<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`,
			opts.className
		),

	close: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>`,
			opts.className
		),

	check: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<polyline points="20 6 9 17 4 12"></polyline>`,
			opts.className
		),

	// Quick actions
	zap: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 18, opts.strokeWidth ?? 2,
			`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>`,
			opts.className
		),

	selectAll: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 3v18"></path><path d="M15 3v18"></path><path d="M3 9h18"></path><path d="M3 15h18"></path>`,
			opts.className
		),

	copy: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>`,
			opts.className
		),

	trash: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`,
			opts.className
		),

	arrowUp: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>`,
			opts.className
		),

	arrowDown: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>`,
			opts.className
		),

	clipboard: (opts: IconOptions = {}) =>
		createSvg(opts.size ?? 16, opts.strokeWidth ?? 2,
			`<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>`,
			opts.className
		),
};

/**
 * Text-based icons for headings
 */
export const textIcons = {
	h1: "H1",
	h2: "H2",
	h3: "H3",
};
