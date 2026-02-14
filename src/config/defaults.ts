/**
 * Default configuration values
 * @module config/defaults
 */

import type { EditorSettings, FontOption } from "../types";

/**
 * Available font options for the editor
 */
export const FONTS: FontOption[] = [
	{ label: "Georgia", value: "Georgia" },
	{ label: "Inter", value: "Inter" },
	{ label: "JetBrains Mono", value: "JetBrains Mono" },
	{ label: "System", value: "-apple-system, BlinkMacSystemFont, sans-serif" },
];

/**
 * Check if running on mobile device
 */
export const isMobile = (): boolean =>
	typeof window !== "undefined" && window.innerWidth <= 768;

/**
 * Default editor settings
 */
export function getDefaultSettings(): EditorSettings {
	const mobile = isMobile();
	return {
		theme: "system",
		fontFamily: FONTS.find((f) => f.label === "System")?.value ?? FONTS[0]!.value,
		fontSize: mobile ? 14 : 18,
		lineHeight: mobile ? 1.4 : 1.8,
		contentWidth: mobile ? 320 : 720,
		paragraphSpacing: 1.0,
		headingSpacing: 1.5,
		paddingHorizontal: mobile ? 1 : 2,
		paddingTop: mobile ? 1 : 2,
	};
}

/**
 * Storage keys used by the editor
 */
export const STORAGE_KEYS = {
	content: "blankmd:content",
	settings: "blankmd:settings",
	toolbar: "blankmd:toolbar-visible",
	customTheme: "blankmd:custom-theme",
	filesystem: "blankmd:filesystem",
} as const;

/**
 * Editor placeholder text
 */
export const PLACEHOLDER_TEXT = "Start writing...";
