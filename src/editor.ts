import "./styles.css";
import { Editor, Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { initSettings } from "./settings";
import { initToolbar } from "./toolbar";
import { Plugin } from "prosemirror-state";
import { Markdown } from "@tiptap/markdown";

// Build-time constant - set to true in production builds
declare const IS_STANDALONE: boolean;
const isStandalone = typeof IS_STANDALONE !== "undefined" && IS_STANDALONE;

const STORAGE_KEY = "md-editor:content";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

// Track if we're editing a file from the server
let isEditingFile = false;
let currentFilePath: string | null = null;
let hasUnsavedChanges = false;

interface ApiContentResponse {
	content: string | null;
	filePath: string | null;
}

async function loadInitialContent(): Promise<string> {
	// In standalone mode, only use localStorage
	if (!isStandalone) {
		// Try to load from server API (for file editing mode)
		try {
			const response = await fetch("/api/md-editor/content");
			if (response.ok) {
				const data = (await response.json()) as ApiContentResponse;
				if (data.content && data.filePath) {
					isEditingFile = true;
					currentFilePath = data.filePath;
					return data.content;
				}
			}
		} catch {
			// API not available, fall back to localStorage
		}
	}

	// Fall back to localStorage
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : "";
	} catch {
		return "";
	}
}

// Save to file via API (manual save only for file editing)
async function saveToFile(editor: Editor) {
	if (isStandalone || !isEditingFile || !currentFilePath) return;

	const markdown = editor.storage.markdown.manager.serialize(editor.getJSON());
	try {
		const response = await fetch("/api/md-editor/content", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ content: markdown }),
		});
		if (response.ok) {
			hasUnsavedChanges = false;
			updateSaveIndicator();
		}
	} catch (err) {
		console.error("Save failed:", err);
	}
}

// Update document title to show unsaved state
function updateSaveIndicator() {
	const baseTitle = currentFilePath
		? currentFilePath.split("/").pop() || "Markdown Editor"
		: "Markdown Editor";
	document.title = hasUnsavedChanges ? `* ${baseTitle}` : baseTitle;
}

// Warn before closing tab with unsaved changes
window.addEventListener("beforeunload", (e) => {
	if (hasUnsavedChanges && isEditingFile) {
		e.preventDefault();
		// Modern browsers ignore custom messages, but this triggers the dialog
		return "";
	}
});

// Debounced save function (only for localStorage in non-file mode)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function saveContent(editor: Editor) {
	if (saveTimeout) clearTimeout(saveTimeout);

	// For file editing, just track unsaved changes (no auto-save)
	if (isEditingFile) {
		hasUnsavedChanges = true;
		updateSaveIndicator();
		return;
	}

	// For localStorage mode, auto-save
	saveTimeout = setTimeout(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(editor.getJSON()));
	}, 500);
}
const PasteMarkdown = Extension.create({
	name: "pasteMarkdown",

	addProseMirrorPlugins() {
		const { editor } = this;
		return [
			new Plugin({
				props: {
					handlePaste(_view, event, _slice) {
						const text = event.clipboardData?.getData("text/plain");

						if (!text) {
							return false;
						}

						// Check if text looks like Markdown
						if (editor.storage.markdown?.manager && looksLikeMarkdown(text)) {
							// Parse the Markdown text to Tiptap JSON using the Markdown manager
							const json = editor.storage.markdown.manager.parse(text);

							// Insert the parsed JSON content at cursor position
							editor.commands.insertContent(json);
							return true;
						}

						return false;
					},
				},
			}),
		];
	},
});

function looksLikeMarkdown(text: string): boolean {
	// Simple heuristic: check for Markdown syntax
	return (
		/^#{1,6}\s/.test(text) || // Headings
		/\*\*[^*]+\*\*/.test(text) || // Bold
		/\[.+\]\(.+\)/.test(text) || // Links
		/^[-*+]\s/.test(text) // Lists
	);
}

// Initialize editor asynchronously
async function initEditor() {
	const editorElement = document.querySelector("#editor");
	if (!editorElement) {
		throw new Error("Editor element not found");
	}

	// Load initial content (from API or localStorage)
	const initialContent = await loadInitialContent();

	const editor = new Editor({
		element: editorElement,
		extensions: [
			StarterKit.configure({
				// Disable the default code block to use lowlight version
				codeBlock: false,
			}),
			CodeBlockLowlight.configure({
				lowlight,
				defaultLanguage: "plaintext",
			}),
			Placeholder.configure({
				placeholder: "Start writing...",
			}),
			Markdown,
			PasteMarkdown,
		],
		// For markdown files, parse the markdown; otherwise use JSON
		content: isEditingFile && initialContent
			? undefined // Will be set after initialization
			: initialContent,
		onUpdate: ({ editor }) => {
			saveContent(editor);
		},
	});

	// If editing a markdown file, set content from markdown
	if (isEditingFile && initialContent) {
		const parsed = editor.storage.markdown.manager.parse(initialContent);
		editor.commands.setContent(parsed);
	}

	// Add Cmd+S / Ctrl+S keyboard shortcut for manual save
	document.addEventListener("keydown", (e) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "s") {
			e.preventDefault();
			saveToFile(editor);
		}
	});

	// Initialize toolbar and settings
	initToolbar(editor);
	initSettings(editor);
}

// Start the editor
initEditor().catch(console.error);