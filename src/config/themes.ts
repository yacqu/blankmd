/**
 * Design tokens for light and dark themes
 * @module config/themes
 */

import type { ThemeTokens } from "../types";

export const darkTheme: ThemeTokens = {
	// Backgrounds
	bgEditor: "hsla(60, 3%, 14%, 1)",
	bgSurface: "#211e1b",
	bgCodeBlock: "#171412",
	bgCodeInline: "#292524",

	// Text hierarchy
	textPrimary: "#f5f5f4",
	textBody: "#e7e5e4",
	textSecondary: "#d6d3d1",
	textMuted: "#a8a29e",
	textDimmed: "#78716c",
	textPlaceholder: "#57534e",

	// Accent
	accent: "#d97757",
	accentCode: "#e8a0a0",
	selectionBg: "rgba(217, 119, 87, 0.25)",

	// Borders
	borderPrimary: "#707070",
	borderSecondary: "#333333",
	borderHr: "#57534e",

	// List markers
	listMarker: "#57534e",
};

export const lightTheme: ThemeTokens = {
	// Backgrounds
	bgEditor: "#ffffff",
	bgSurface: "#f5f5f4",
	bgCodeBlock: "#f8f8f8",
	bgCodeInline: "#f0f0f0",

	// Text hierarchy
	textPrimary: "#1a1a1a",
	textBody: "#292524",
	textSecondary: "#44403c",
	textMuted: "#78716c",
	textDimmed: "#a8a29e",
	textPlaceholder: "#d6d3d1",

	// Accent
	accent: "#c4613f",
	accentCode: "#9f3a3a",
	selectionBg: "rgba(196, 97, 63, 0.2)",

	// Borders
	borderPrimary: "#e0e0e0",
	borderSecondary: "#d6d3d1",
	borderHr: "#d6d3d1",

	// List markers
	listMarker: "#a8a29e",
};

/**
 * Get theme tokens based on mode
 */
export function getThemeTokens(isDark: boolean): ThemeTokens {
	return isDark ? darkTheme : lightTheme;
}
