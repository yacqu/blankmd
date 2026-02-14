/**
 * Core type definitions for blankmd
 * @module types
 */

import type { Editor } from "@tiptap/core";

// ============================================================================
// Theme Types
// ============================================================================

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeTokens {
	// Backgrounds
	bgEditor: string;
	bgSurface: string;
	bgCodeBlock: string;
	bgCodeInline: string;

	// Text hierarchy
	textPrimary: string;
	textBody: string;
	textSecondary: string;
	textMuted: string;
	textDimmed: string;
	textPlaceholder: string;

	// Accent
	accent: string;
	accentCode: string;
	selectionBg: string;

	// Borders
	borderPrimary: string;
	borderSecondary: string;
	borderHr: string;

	// List markers
	listMarker: string;
}

// ============================================================================
// Settings Types
// ============================================================================

export interface EditorSettings {
	theme: ThemeMode;
	fontFamily: string;
	fontSize: number;
	lineHeight: number;
	contentWidth: number;
	paragraphSpacing: number;
	headingSpacing: number;
	paddingHorizontal: number;
	paddingTop: number;
}

export interface FontOption {
	label: string;
	value: string;
}

// ============================================================================
// Toolbar Types
// ============================================================================

export interface ToolbarButton {
	/** Unique identifier for the button */
	id: string;
	/** SVG icon or text label */
	icon: string;
	/** Tooltip text */
	title: string;
	/** Action to perform when clicked */
	action: (editor: Editor) => void;
	/** Optional function to check if button should show active state */
	isActive?: (editor: Editor) => boolean;
	/** Optional keyboard shortcut hint */
	shortcut?: string;
}

export interface ToolbarSeparator {
	id: string;
	type: "separator";
}

export type ToolbarItem = ToolbarButton | ToolbarSeparator;

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageAdapter {
	get<T>(key: string): T | null;
	set<T>(key: string, value: T): void;
	remove(key: string): void;
}

export interface EditorState {
	content: string;
	filePath: string | null;
	hasUnsavedChanges: boolean;
}

// ============================================================================
// API Types
// ============================================================================

export interface ApiContentResponse {
	content: string | null;
	filePath: string | null;
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface StepperConfig {
	value: number;
	min: number;
	max: number;
	step: number;
	format: (value: number) => string;
	onChange: (value: number) => void;
}

export interface SettingsSection {
	id: string;
	title?: string;
	rows: SettingsRow[];
}

export interface SettingsRow {
	label: string;
	control: HTMLElement;
}

// ============================================================================
// Custom Theme Types
// ============================================================================

export interface CustomTheme {
	/** Name of the custom theme */
	name: string;
	/** Base theme to extend (light or dark) */
	base: "light" | "dark";
	/** Custom token overrides */
	tokens: Partial<ThemeTokens>;
}

export interface ThemeColorGroup {
	id: string;
	label: string;
	colors: ThemeColorConfig[];
}

export interface ThemeColorConfig {
	key: keyof ThemeTokens;
	label: string;
	description?: string;
}

// ============================================================================
// Filesystem Types
// ============================================================================

export interface FileNode {
	id: string;
	type: "file";
	name: string;
	parentId: string | null;
	createdAt: number;
	updatedAt: number;
}

export interface FolderNode {
	id: string;
	type: "folder";
	name: string;
	parentId: string | null;
	collapsed: boolean;
	createdAt: number;
}

export type TreeNode = FileNode | FolderNode;

export interface FileSystemStore {
	nodes: Record<string, TreeNode>;
	content: Record<string, string>;
	activeFileId: string | null;
	sidebarWidth: number;
	sidebarOpen: boolean;
}
