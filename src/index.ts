/**
 * blankmd - A single-file Markdown editor
 * 
 * @packageDocumentation
 * @module blankmd
 */

import "./styles.css";
import { createEditor } from "./core";
import { initToolbar, initSettings, initQuickActions } from "./ui";
import { initFilesystem } from "./filesystem";

/**
 * Initialize the blankmd editor
 */
async function init(): Promise<void> {
	const editorElement = document.querySelector("#editor");

	if (!editorElement) {
		throw new Error("Editor element #editor not found");
	}

	await createEditor({
		element: editorElement,
		onReady: (editor) => {
			// Initialize UI components after editor is ready
			initToolbar(editor);
			initSettings(editor);
			initQuickActions(editor);

			// Initialize virtual filesystem (sidebar, file switching, migration)
			initFilesystem(editor);
		},
	});
}

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", () => init().catch(console.error));
} else {
	init().catch(console.error);
}
