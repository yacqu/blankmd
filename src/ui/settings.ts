/**
 * Settings panel UI and theme management
 * @module ui/settings
 */

import type { Editor } from "@tiptap/core";
import type { EditorSettings, ThemeMode, ThemeTokens } from "../types";
import { settingsStorage } from "../core/storage";
import { reparseAsMarkdown } from "../core/editor";
import { getThemeTokens, FONTS, getDefaultSettings, isMobile } from "../config";
import { icons } from "./icons";
import {
	createElement,
	createButton,
	createStepper,
	createRow,
	createSection,
	createSelect,
	createToggleGroup,
} from "./components";
import {
	createThemeCustomizer,
	getCustomThemeTokens,
	hasCustomTheme,
} from "./theme-customizer";

/**
 * Check if system prefers dark mode
 */
function prefersDarkMode(): boolean {
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Determine if dark mode should be active
 */
function isDarkMode(theme: ThemeMode): boolean {
	if (theme === "dark") return true;
	if (theme === "light") return false;
	return prefersDarkMode();
}

/**
 * Apply theme tokens to CSS variables
 */
function applyThemeTokens(tokens: ThemeTokens): void {
	const root = document.documentElement;

	// Background colors
	root.style.setProperty("--bg-color", tokens.bgEditor);
	root.style.setProperty("--bg-surface", tokens.bgSurface);
	root.style.setProperty("--bg-code-block", tokens.bgCodeBlock);
	root.style.setProperty("--bg-code-inline", tokens.bgCodeInline);

	// Text colors
	root.style.setProperty("--text-primary", tokens.textPrimary);
	root.style.setProperty("--text-body", tokens.textBody);
	root.style.setProperty("--text-secondary", tokens.textSecondary);
	root.style.setProperty("--text-muted", tokens.textMuted);
	root.style.setProperty("--text-dimmed", tokens.textDimmed);
	root.style.setProperty("--text-placeholder", tokens.textPlaceholder);

	// Accent colors
	root.style.setProperty("--accent", tokens.accent);
	root.style.setProperty("--accent-code", tokens.accentCode);
	root.style.setProperty("--selection-bg", tokens.selectionBg);

	// Borders
	root.style.setProperty("--border-primary", tokens.borderPrimary);
	root.style.setProperty("--border-secondary", tokens.borderSecondary);
	root.style.setProperty("--border-hr", tokens.borderHr);

	// List markers
	root.style.setProperty("--list-marker", tokens.listMarker);
}

/**
 * Apply typography and spacing settings
 */
function applyTypographySettings(settings: EditorSettings): void {
	const root = document.documentElement;

	// Typography
	root.style.setProperty("--font-family", settings.fontFamily);
	root.style.setProperty("--font-size", `${settings.fontSize}px`);
	root.style.setProperty("--content-width", `${settings.contentWidth}px`);
	root.style.setProperty("--paragraph-spacing", `${settings.paragraphSpacing}em`);

	// Line heights
	root.style.setProperty("--line-height-body", `${settings.lineHeight}`);
	root.style.setProperty("--line-height-code", "1.7");
	root.style.setProperty("--line-height-list", "1.4");

	// Editor padding
	root.style.setProperty("--editor-padding-y", `${settings.paddingTop}em`);
	root.style.setProperty("--editor-padding-x", `${settings.paddingHorizontal}em`);

	// Heading sizes (fixed ratios)
	root.style.setProperty("--h1-font-size", "1.8em");
	root.style.setProperty("--h2-font-size", "1.4em");
	root.style.setProperty("--h3-font-size", "1.2em");

	// Heading spacing
	root.style.setProperty("--h1-margin-top", `${settings.headingSpacing * 1.2}em`);
	root.style.setProperty("--h1-margin-bottom", "0.6em");
	root.style.setProperty("--h1-padding-bottom", "0.3em");
	root.style.setProperty("--h2-margin-top", `${settings.headingSpacing}em`);
	root.style.setProperty("--h2-margin-bottom", "0.5em");
	root.style.setProperty("--h2-padding-bottom", "0.25em");
	root.style.setProperty("--h3-margin-top", `${settings.headingSpacing * 0.9}em`);
	root.style.setProperty("--h3-margin-bottom", "0.4em");

	// List spacing
	root.style.setProperty("--list-padding-left", "1.3em");
	root.style.setProperty("--list-item-margin", "0.1em");

	// Blockquote
	root.style.setProperty("--blockquote-padding-y", "0.5em");
	root.style.setProperty("--blockquote-padding-x", "1em");
	root.style.setProperty("--blockquote-border-width", "4px");
	root.style.setProperty("--blockquote-radius", "8px");

	// Inline code
	root.style.setProperty("--inline-code-padding-y", "2px");
	root.style.setProperty("--inline-code-padding-x", "6px");
	root.style.setProperty("--inline-code-font-size", "0.9em");
	root.style.setProperty("--inline-code-radius", "4px");

	// Code block
	root.style.setProperty("--code-block-padding-y", "16px");
	root.style.setProperty("--code-block-padding-x", "20px");
	root.style.setProperty("--code-block-margin", "1.2em");
	root.style.setProperty("--code-block-font-size", "0.875em");
	root.style.setProperty("--code-block-radius", "8px");

	// Horizontal rule
	root.style.setProperty("--hr-margin", "2.5em");
}

/**
 * Apply all settings (theme + typography)
 */
export function applySettings(settings: EditorSettings, customTokens?: ThemeTokens | null): void {
	// Check for custom theme first
	const tokens = customTokens ?? getCustomThemeTokens(isDarkMode(settings.theme)) ?? getThemeTokens(isDarkMode(settings.theme));
	applyThemeTokens(tokens);
	applyTypographySettings(settings);
	settingsStorage.save(settings);
}

/**
 * Create the settings panel header
 */
function createPanelHeader(onClose: () => void): HTMLDivElement {
	const header = createElement("div", { className: "md-settings-panel-header" });

	const title = createElement("h3", { textContent: "Settings" });

	const closeBtn = createButton({
		className: "md-settings-panel-close",
		innerHTML: "✕",
		onClick: onClose,
	});

	header.appendChild(title);
	header.appendChild(closeBtn);

	return header;
}

/**
 * Create theme section
 */
function createThemeSection(
	settings: EditorSettings,
	onUpdate: (settings: EditorSettings) => void,
	onCustomize: () => void
): HTMLDivElement {
	const section = createSection();

	const themeToggle = createToggleGroup({
		values: [
			{ label: "Light", value: "light" as ThemeMode },
			{ label: "Dark", value: "dark" as ThemeMode },
			{ label: "Auto", value: "system" as ThemeMode },
		],
		selected: settings.theme,
		onChange: (theme) => {
			settings.theme = theme;
			onUpdate(settings);
		},
	});

	section.appendChild(createRow("Theme", themeToggle));

	// Custom colors button
	const customizeBtn = createElement("button", {
		className: "md-settings-action-btn md-customize-btn",
		textContent: hasCustomTheme() ? "Custom Colors ✓" : "Customize Colors",
		attributes: { type: "button" },
	});
	customizeBtn.addEventListener("click", onCustomize);
	section.appendChild(customizeBtn);

	return section;
}

/**
 * Create typography section
 */
function createTypographySection(
	settings: EditorSettings,
	onUpdate: (settings: EditorSettings) => void
): HTMLDivElement {
	const section = createSection();
	const mobile = isMobile();

	// Font family
	section.appendChild(
		createRow(
			"Font",
			createSelect({
				values: FONTS,
				selected: settings.fontFamily,
				onChange: (font) => {
					settings.fontFamily = font;
					onUpdate(settings);
				},
			})
		)
	);

	// Font size
	section.appendChild(
		createRow(
			"Size",
			createStepper({
				value: settings.fontSize,
				min: mobile ? 8 : 14,
				max: 24,
				step: 1,
				format: (v) => `${v}px`,
				onChange: (v) => {
					settings.fontSize = v;
					onUpdate(settings);
				},
			})
		)
	);

	// Line height
	section.appendChild(
		createRow(
			"Line Height",
			createStepper({
				value: settings.lineHeight,
				min: mobile ? 1.2 : 1.4,
				max: 2.2,
				step: 0.1,
				format: (v) => v.toFixed(1),
				onChange: (v) => {
					settings.lineHeight = v;
					onUpdate(settings);
				},
			})
		)
	);

	// Content width
	section.appendChild(
		createRow(
			"Width",
			createStepper({
				value: settings.contentWidth,
				min: mobile ? 200 : 400,
				max: 1000,
				step: 50,
				format: (v) => `${v}px`,
				onChange: (v) => {
					settings.contentWidth = v;
					onUpdate(settings);
				},
			})
		)
	);

	// Horizontal padding
	section.appendChild(
		createRow(
			"Padding",
			createStepper({
				value: settings.paddingHorizontal,
				min: 0,
				max: mobile ? 10 : 100,
				step: mobile ? 1 : 5,
				format: (v) => `${v}em`,
				onChange: (v) => {
					settings.paddingHorizontal = v;
					onUpdate(settings);
				},
			})
		)
	);

	// Top padding
	section.appendChild(
		createRow(
			"Top Padding",
			createStepper({
				value: settings.paddingTop,
				min: 0,
				max: mobile ? 10 : 100,
				step: mobile ? 0.5 : 1,
				format: (v) => `${v}em`,
				onChange: (v) => {
					settings.paddingTop = v;
					onUpdate(settings);
				},
			})
		)
	);

	return section;
}

/**
 * Create spacing section
 */
function createSpacingSection(
	settings: EditorSettings,
	onUpdate: (settings: EditorSettings) => void
): HTMLDivElement {
	const section = createSection();

	// Paragraph spacing
	section.appendChild(
		createRow(
			"¶ Spacing",
			createStepper({
				value: settings.paragraphSpacing,
				min: 0.5,
				max: 2.0,
				step: 0.25,
				format: (v) => v.toFixed(2),
				onChange: (v) => {
					settings.paragraphSpacing = v;
					onUpdate(settings);
				},
			})
		)
	);

	// Heading spacing
	section.appendChild(
		createRow(
			"H Spacing",
			createStepper({
				value: settings.headingSpacing,
				min: 0.5,
				max: 2.0,
				step: 0.25,
				format: (v) => v.toFixed(2),
				onChange: (v) => {
					settings.headingSpacing = v;
					onUpdate(settings);
				},
			})
		)
	);

	return section;
}

/**
 * Create actions section
 */
function createActionsSection(
	settings: EditorSettings,
	onUpdate: (settings: EditorSettings) => void,
	editor: Editor,
	rebuildPanel: () => void
): HTMLDivElement {
	const section = createSection();

	// Reparse button
	const reparseBtn = createElement("button", {
		className: "md-settings-action-btn",
		textContent: "Reparse as Markdown",
		attributes: {
			type: "button",
			title: "Fix paste errors by re-parsing content as markdown",
		},
	});
	reparseBtn.addEventListener("click", () => reparseAsMarkdown(editor));
	section.appendChild(reparseBtn);

	// Reset button
	const resetBtn = createElement("button", {
		className: "md-settings-action-btn",
		textContent: "Reset to Defaults",
		attributes: { type: "button" },
	});
	resetBtn.addEventListener("click", () => {
		const defaults = getDefaultSettings();
		Object.assign(settings, defaults);
		onUpdate(settings);
		rebuildPanel();
	});
	section.appendChild(resetBtn);

	return section;
}

/**
 * Create the settings panel
 */
function createSettingsPanel(
	settings: EditorSettings,
	onUpdate: (settings: EditorSettings) => void,
	editor: Editor
): { settingsPanel: HTMLDivElement; colorPanel: HTMLDivElement; } {
	const settingsPanel = createElement("div", { className: "md-settings-panel hidden" });
	const colorPanel = createElement("div", { className: "md-color-panel hidden" });

	// Track if color panel needs rebuild
	let colorPanelBuilt = false;

	// Check if mobile
	const isMobileView = () => window.innerWidth <= 768;

	const buildSettingsContent = () => {
		settingsPanel.innerHTML = "";
		settingsPanel.appendChild(
			createPanelHeader(() => {
				settingsPanel.classList.add("hidden");
				colorPanel.classList.add("hidden");
			})
		);
		settingsPanel.appendChild(
			createThemeSection(settings, onUpdate, () => {
				// Toggle color panel
				if (colorPanel.classList.contains("hidden")) {
					if (!colorPanelBuilt) {
						buildColorPanel();
						colorPanelBuilt = true;
					}
					colorPanel.classList.remove("hidden");
					// On mobile, hide settings when opening colors
					if (isMobileView()) {
						settingsPanel.classList.add("hidden");
					}
				} else {
					colorPanel.classList.add("hidden");
				}
			})
		);
		settingsPanel.appendChild(createTypographySection(settings, onUpdate));
		settingsPanel.appendChild(createSpacingSection(settings, onUpdate));
		settingsPanel.appendChild(
			createActionsSection(settings, onUpdate, editor, buildSettingsContent)
		);
	};

	const buildColorPanel = () => {
		colorPanel.innerHTML = "";
		const customizer = createThemeCustomizer({
			currentTheme: settings.theme,
			onBack: () => {
				colorPanel.classList.add("hidden");
				// Show settings panel again on mobile
				settingsPanel.classList.remove("hidden");
				// Rebuild settings to update the "Custom Colors ✓" label
				buildSettingsContent();
			},
			onApply: (tokens) => {
				applySettings(settings, tokens);
				// Update button label
				buildSettingsContent();
			},
		});
		colorPanel.appendChild(customizer);
	};

	buildSettingsContent();

	return { settingsPanel, colorPanel };
}

/**
 * Create the settings button
 */
function createSettingsButton(): HTMLButtonElement {
	return createButton({
		className: "md-settings-btn",
		innerHTML: icons.settings(),
		title: "Settings",
	});
}

export interface SettingsOptions {
	/** Initial settings to apply (defaults to saved settings) */
	initialSettings?: Partial<EditorSettings>;
}

/**
 * Initialize the settings UI
 */
export function initSettings(editor: Editor, options: SettingsOptions = {}): void {
	let settings = settingsStorage.load();

	// Merge any provided initial settings
	if (options.initialSettings) {
		settings = { ...settings, ...options.initialSettings };
	}

	// Apply initial settings
	applySettings(settings);

	// Listen for system theme changes
	window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
		if (settings.theme === "system") {
			applySettings(settings);
		}
	});

	// Create UI
	const btn = createSettingsButton();
	const { settingsPanel, colorPanel } = createSettingsPanel(
		settings,
		(newSettings) => {
			settings = newSettings;
			applySettings(settings);
		},
		editor
	);

	document.body.appendChild(btn);
	document.body.appendChild(settingsPanel);
	document.body.appendChild(colorPanel);

	// Toggle panel on button click
	btn.addEventListener("click", (e) => {
		e.stopPropagation();
		settingsPanel.classList.toggle("hidden");
		if (settingsPanel.classList.contains("hidden")) {
			colorPanel.classList.add("hidden");
		}
	});

	// Close panels when clicking outside
	document.addEventListener("click", (e) => {
		const target = e.target as Node;
		if (!settingsPanel.contains(target) && !colorPanel.contains(target) && !btn.contains(target)) {
			settingsPanel.classList.add("hidden");
			colorPanel.classList.add("hidden");
		}
	});

	// Setup paste listener for auto-reparse (optional feature)
	window.addEventListener("paste", () => {
		const cursorPosition = editor.state.selection.anchor;
		setTimeout(() => {
			reparseAsMarkdown(editor);
			editor.commands.focus(cursorPosition);
		}, 0);
	});
}

/**
 * Export theme utilities for external use
 */
export { isDarkMode, prefersDarkMode };
