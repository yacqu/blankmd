/**
 * Theme customizer - custom color picker view
 * @module ui/theme-customizer
 */

import type { CustomTheme, ThemeTokens, ThemeMode } from "../types";
import { getThemeTokens } from "../config";
import { STORAGE_KEYS } from "../config/defaults";
import {
	createElement,
	createColorGroup,
	createToggleGroup,
	createRow,
	createButton,
} from "./components";

// ============================================================================
// Storage
// ============================================================================

function loadCustomTheme(): CustomTheme | null {
	try {
		const data = localStorage.getItem(STORAGE_KEYS.customTheme);
		return data ? JSON.parse(data) : null;
	} catch {
		return null;
	}
}

function saveCustomTheme(theme: CustomTheme | null): void {
	if (theme) {
		localStorage.setItem(STORAGE_KEYS.customTheme, JSON.stringify(theme));
	} else {
		localStorage.removeItem(STORAGE_KEYS.customTheme);
	}
}

// ============================================================================
// Color Groups Configuration
// ============================================================================

interface ColorConfig {
	key: keyof ThemeTokens;
	label: string;
}

interface ColorGroupConfig {
	title: string;
	colors: ColorConfig[];
}

const COLOR_GROUPS: ColorGroupConfig[] = [
	{
		title: "Backgrounds",
		colors: [
			{ key: "bgEditor", label: "Editor" },
			{ key: "bgSurface", label: "Surface" },
			{ key: "bgCodeBlock", label: "Code Block" },
			{ key: "bgCodeInline", label: "Inline Code" },
		],
	},
	{
		title: "Text",
		colors: [
			{ key: "textPrimary", label: "Primary" },
			{ key: "textBody", label: "Body" },
			{ key: "textSecondary", label: "Secondary" },
			{ key: "textMuted", label: "Muted" },
			{ key: "textDimmed", label: "Dimmed" },
			{ key: "textPlaceholder", label: "Placeholder" },
		],
	},
	{
		title: "Accents",
		colors: [
			{ key: "accent", label: "Accent" },
			{ key: "accentCode", label: "Code Accent" },
			{ key: "selectionBg", label: "Selection" },
		],
	},
	{
		title: "Borders",
		colors: [
			{ key: "borderPrimary", label: "Primary" },
			{ key: "borderSecondary", label: "Secondary" },
			{ key: "borderHr", label: "Horizontal Rule" },
		],
	},
	{
		title: "Lists",
		colors: [{ key: "listMarker", label: "List Marker" }],
	},
];

// ============================================================================
// Theme Customizer View
// ============================================================================

export interface ThemeCustomizerOptions {
	currentTheme: ThemeMode;
	onBack: () => void;
	onApply: (tokens: ThemeTokens | null) => void;
}

/**
 * Create the theme customizer view
 */
export function createThemeCustomizer(options: ThemeCustomizerOptions): HTMLElement {
	const container = createElement("div", { className: "md-theme-customizer" });

	// Load existing custom theme or create from current
	let customTheme = loadCustomTheme();
	const baseTheme: "light" | "dark" =
		customTheme?.base ?? (options.currentTheme === "dark" ? "dark" : "light");
	const baseTokens = getThemeTokens(baseTheme === "dark");

	// Working copy of tokens
	let tokens: ThemeTokens = customTheme
		? { ...baseTokens, ...customTheme.tokens }
		: { ...baseTokens };

	// Track which tokens have been customized
	const customizedTokens = new Set<keyof ThemeTokens>(
		customTheme ? Object.keys(customTheme.tokens) as (keyof ThemeTokens)[] : []
	);

	// Header with close button
	const header = createElement("div", { className: "md-settings-panel-header" });
	const title = createElement("h3", { textContent: "Colors" });
	const closeBtn = createButton({
		className: "md-settings-panel-close",
		innerHTML: "✕",
		onClick: options.onBack,
	});
	header.appendChild(title);
	header.appendChild(closeBtn);
	container.appendChild(header);

	// Base theme selector
	const baseSection = createElement("div", { className: "md-settings-section" });
	let currentBase = baseTheme;

	baseSection.appendChild(
		createRow(
			"Base",
			createToggleGroup({
				values: [
					{ label: "Light", value: "light" },
					{ label: "Dark", value: "dark" },
				],
				selected: currentBase,
				onChange: (base) => {
					currentBase = base;
					const newBase = getThemeTokens(base === "dark");
					// Reset non-customized tokens to new base
					for (const key of Object.keys(newBase) as (keyof ThemeTokens)[]) {
						if (!customizedTokens.has(key)) {
							tokens[key] = newBase[key];
						}
					}
					// Rebuild color groups
					rebuildColorGroups();
					applyPreview();
				},
			})
		)
	);
	container.appendChild(baseSection);

	// Color groups container
	const groupsContainer = createElement("div", { className: "md-color-groups" });
	container.appendChild(groupsContainer);

	function rebuildColorGroups() {
		groupsContainer.innerHTML = "";
		for (const group of COLOR_GROUPS) {
			groupsContainer.appendChild(
				createColorGroup({
					title: group.title,
					initialExpanded: group.title === "Backgrounds",
					colors: group.colors.map((color) => ({
						key: color.key,
						label: color.label,
						value: tokens[color.key],
						onChange: (value) => {
							tokens[color.key] = value;
							customizedTokens.add(color.key);
							applyPreview();
						},
					})),
				})
			);
		}
	}

	function applyPreview() {
		// Apply current tokens as preview
		const root = document.documentElement;
		root.style.setProperty("--bg-color", tokens.bgEditor);
		root.style.setProperty("--bg-surface", tokens.bgSurface);
		root.style.setProperty("--bg-code-block", tokens.bgCodeBlock);
		root.style.setProperty("--bg-code-inline", tokens.bgCodeInline);
		root.style.setProperty("--text-primary", tokens.textPrimary);
		root.style.setProperty("--text-body", tokens.textBody);
		root.style.setProperty("--text-secondary", tokens.textSecondary);
		root.style.setProperty("--text-muted", tokens.textMuted);
		root.style.setProperty("--text-dimmed", tokens.textDimmed);
		root.style.setProperty("--text-placeholder", tokens.textPlaceholder);
		root.style.setProperty("--accent", tokens.accent);
		root.style.setProperty("--accent-code", tokens.accentCode);
		root.style.setProperty("--selection-bg", tokens.selectionBg);
		root.style.setProperty("--border-primary", tokens.borderPrimary);
		root.style.setProperty("--border-secondary", tokens.borderSecondary);
		root.style.setProperty("--border-hr", tokens.borderHr);
		root.style.setProperty("--list-marker", tokens.listMarker);
	}

	// Build initial color groups
	rebuildColorGroups();

	// Action buttons
	const actions = createElement("div", { className: "md-theme-customizer-actions" });

	const resetBtn = createButton({
		className: "md-settings-action-btn",
		innerHTML: "Reset to Base",
		onClick: () => {
			tokens = { ...getThemeTokens(currentBase === "dark") };
			customizedTokens.clear();
			rebuildColorGroups();
			applyPreview();
		},
	});

	const clearBtn = createButton({
		className: "md-settings-action-btn md-danger",
		innerHTML: "Clear Custom Theme",
		onClick: () => {
			saveCustomTheme(null);
			options.onApply(null);
			options.onBack();
		},
	});

	const saveBtn = createButton({
		className: "md-settings-action-btn md-primary",
		innerHTML: "Save Theme",
		onClick: () => {
			// Only save tokens that differ from base
			const baseTokens = getThemeTokens(currentBase === "dark");
			const changedTokens: Partial<ThemeTokens> = {};

			for (const key of customizedTokens) {
				if (tokens[key] !== baseTokens[key]) {
					changedTokens[key] = tokens[key];
				}
			}

			const theme: CustomTheme = {
				name: "custom",
				base: currentBase,
				tokens: changedTokens,
			};

			saveCustomTheme(theme);
			options.onApply(tokens);
		},
	});

	actions.appendChild(resetBtn);
	actions.appendChild(clearBtn);
	actions.appendChild(saveBtn);
	container.appendChild(actions);

	return container;
}

/**
 * Check if a custom theme is active
 */
export function hasCustomTheme(): boolean {
	return loadCustomTheme() !== null;
}

/**
 * Get custom theme tokens (merged with base)
 */
export function getCustomThemeTokens(isDark: boolean): ThemeTokens | null {
	const custom = loadCustomTheme();
	if (!custom) return null;

	const baseTokens = getThemeTokens(custom.base === "dark");
	return { ...baseTokens, ...custom.tokens };
}

/**
 * Get the base theme mode from custom theme
 */
export function getCustomThemeBase(): "light" | "dark" | null {
	const custom = loadCustomTheme();
	return custom?.base ?? null;
}
