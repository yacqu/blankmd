/**
 * Virtual Filesystem — public API
 *
 * Call `initFilesystem(editor)` after the editor is ready.
 * Everything else is handled internally: migration, sidebar, file switching.
 *
 * @module filesystem
 */

import type { Editor } from "@tiptap/core";
import { setContentSaveHandler, forceSave, setEditorContent } from "../core/editor";
import { fsStore } from "./store";
import { migrateIfNeeded } from "./migration";
import { initSidebar, renderTree } from "./sidebar";

let editorRef: Editor | null = null;

/**
 * Initialise the virtual filesystem.
 * Must be called once, after the editor is mounted.
 */
export function initFilesystem(editor: Editor): void {
	editorRef = editor;

	// 1. Migrate legacy content (or load existing filesystem)
	const initialState = migrateIfNeeded();
	fsStore.load(initialState);

	// 2. Take over content saving
	setContentSaveHandler((content) => {
		const activeId = fsStore.getActiveFileId();
		if (activeId) {
			fsStore.saveFileContent(activeId, content);
		}
	});

	// 3. Load the active file into the editor
	const activeId = fsStore.getActiveFileId();
	if (activeId) {
		const content = fsStore.getContent(activeId);
		if (content) {
			setEditorContent(editor, content);
		}
	}

	// 4. Initialise sidebar UI
	initSidebar({
		editor,
		onSwitchFile: (fileId: string) => switchFile(fileId),
		onExportFile: (fileId: string) => exportFileAsMarkdown(fileId),
	});
}

/**
 * Switch to a different file.
 * Forces a save of the current file first (review fix: prevents race condition).
 */
export function switchFile(newId: string): void {
	if (!editorRef) return;

	const activeId = fsStore.getActiveFileId();
	if (activeId === newId) return;

	// 1. Force save current file BEFORE switching context
	forceSave(editorRef);

	// 2. Now it's safe to switch
	fsStore.setActiveFileId(newId);
	const newContent = fsStore.getContent(newId);
	setEditorContent(editorRef, newContent);

	// 3. Re-render tree to update active highlight
	renderTree();
}

/**
 * Get the current active file ID
 */
export function getActiveFile(): string | null {
	return fsStore.getActiveFileId();
}

/**
 * Export a single file as markdown (.md download)
 */
function exportFileAsMarkdown(fileId: string): void {
	if (!editorRef) return;

	const node = fsStore.getNode(fileId);
	if (!node || node.type !== "file") return;

	let content = fsStore.getContent(fileId);

	// If this is the currently active file, get fresh content from editor
	if (fileId === fsStore.getActiveFileId()) {
		forceSave(editorRef);
		content = fsStore.getContent(fileId);
	}

	// Convert Tiptap JSON to markdown for export
	let markdown: string;
	try {
		const json = JSON.parse(content);
		markdown = editorRef.storage.markdown.manager.serialize(json);
	} catch {
		// If not valid JSON, use raw content
		markdown = content;
	}

	const blob = new Blob([markdown], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = node.name;
	a.click();
	URL.revokeObjectURL(url);
}
