/**
 * Editor initialization and setup
 * @module core/editor
 */

import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "@tiptap/markdown";

import { PasteMarkdown } from "./extensions";
import { contentStorage } from "./storage";
import { PLACEHOLDER_TEXT } from "../config";
import type { ApiContentResponse } from "../types";

// Build-time flag for standalone mode
declare const IS_STANDALONE: boolean;
const isStandalone = typeof IS_STANDALONE !== "undefined" && IS_STANDALONE;

// Create lowlight instance for syntax highlighting
const lowlight = createLowlight(common);

// Editor state for file editing mode
interface EditorFileState {
	isEditingFile: boolean;
	filePath: string | null;
	hasUnsavedChanges: boolean;
}

const fileState: EditorFileState = {
	isEditingFile: false,
	filePath: null,
	hasUnsavedChanges: false,
};

/**
 * Load initial content from API or localStorage
 */
async function loadInitialContent(): Promise<string> {
	// In standalone mode, only use localStorage
	if (!isStandalone) {
		try {
			const response = await fetch("/api/blankmd/content");
			if (response.ok) {
				const data = (await response.json()) as ApiContentResponse;
				if (data.content && data.filePath) {
					fileState.isEditingFile = true;
					fileState.filePath = data.filePath;
					return data.content;
				}
			}
		} catch {
			// API not available, fall back to localStorage
		}
	}

	return contentStorage.load();
}

/**
 * Save content to file via API (for file editing mode)
 */
async function saveToFile(editor: Editor): Promise<void> {
	if (isStandalone || !fileState.isEditingFile || !fileState.filePath) return;

	const markdown = editor.storage.markdown.manager.serialize(editor.getJSON());

	try {
		const response = await fetch("/api/blankmd/content", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: markdown }),
		});

		if (response.ok) {
			fileState.hasUnsavedChanges = false;
			updateDocumentTitle();
		}
	} catch (err) {
		console.error("Save failed:", err);
	}
}

/**
 * Update document title to reflect save state
 */
function updateDocumentTitle(): void {
	const baseTitle = fileState.filePath
		? fileState.filePath.split("/").pop() || "blankmd"
		: "blankmd";
	document.title = fileState.hasUnsavedChanges ? `• ${baseTitle}` : baseTitle;
}

/**
 * Debounced content save for localStorage mode
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function handleContentUpdate(editor: Editor): void {
	if (saveTimeout) clearTimeout(saveTimeout);

	if (fileState.isEditingFile) {
		fileState.hasUnsavedChanges = true;
		updateDocumentTitle();
		return;
	}

	// Auto-save to localStorage with debounce
	saveTimeout = setTimeout(() => {
		contentStorage.save(editor.getJSON());
	}, 500);
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts(editor: Editor): void {
	document.addEventListener("keydown", (e) => {
		// Cmd/Ctrl + S to save
		if ((e.metaKey || e.ctrlKey) && e.key === "s") {
			e.preventDefault();
			saveToFile(editor);
		}
	});
}

/**
 * Setup beforeunload warning for unsaved changes
 */
function setupUnloadWarning(): void {
	window.addEventListener("beforeunload", (e) => {
		if (fileState.hasUnsavedChanges && fileState.isEditingFile) {
			e.preventDefault();
			return "";
		}
	});
}

/**
 * Get configured Tiptap extensions
 */
function getExtensions() {
	return [
		StarterKit.configure({
			codeBlock: false, // Use CodeBlockLowlight instead
		}),
		CodeBlockLowlight.configure({
			lowlight,
			defaultLanguage: "plaintext",
		}),
		Placeholder.configure({
			placeholder: PLACEHOLDER_TEXT,
		}),
		Markdown,
		PasteMarkdown,
	];
}

export interface CreateEditorOptions {
	element: Element;
	onReady?: (editor: Editor) => void;
}

/**
 * Create and initialize the editor
 */
export async function createEditor(options: CreateEditorOptions): Promise<Editor> {
	const { element, onReady } = options;

	const initialContent = await loadInitialContent();

	const editor = new Editor({
		element,
		extensions: getExtensions(),
		content: fileState.isEditingFile ? undefined : initialContent,
		onUpdate: ({ editor }) => handleContentUpdate(editor),
	});

	// If editing a markdown file, parse and set content
	if (fileState.isEditingFile && initialContent) {
		const parsed = editor.storage.markdown.manager.parse(initialContent);
		editor.commands.setContent(parsed);
	}

	setupKeyboardShortcuts(editor);
	setupUnloadWarning();

	onReady?.(editor);

	return editor;
}

/**
 * Export file state for external access
 */
export function getFileState(): Readonly<EditorFileState> {
	return { ...fileState };
}

/**
 * Utility to reparse content as markdown
 */
export function reparseAsMarkdown(editor: Editor): void {
	try {
		const markdown = editor.storage.markdown.manager.serialize(editor.getJSON());
		const parsed = editor.storage.markdown.manager.parse(markdown);
		editor.commands.setContent(parsed);
	} catch (err) {
		console.error("Reparse failed:", err);
	}
}
