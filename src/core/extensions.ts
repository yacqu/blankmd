/**
 * Custom Tiptap extensions
 * @module core/extensions
 */

import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";

/**
 * Detect if text appears to be markdown
 */
function looksLikeMarkdown(text: string): boolean {
	return (
		/^#{1,6}\s/.test(text) ||        // Headings
		/\*\*[^*]+\*\*/.test(text) ||    // Bold
		/\*[^*]+\*/.test(text) ||        // Italic
		/\[.+\]\(.+\)/.test(text) ||     // Links
		/^[-*+]\s/m.test(text) ||        // Unordered lists
		/^\d+\.\s/m.test(text) ||        // Ordered lists
		/^>\s/m.test(text) ||            // Blockquotes
		/```[\s\S]*```/.test(text) ||    // Code blocks
		/`[^`]+`/.test(text)             // Inline code
	);
}

/**
 * Extension to handle pasting markdown content
 * Automatically converts markdown to rich text when pasting
 */
export const PasteMarkdown = Extension.create({
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

						// Check if text looks like Markdown and we have a markdown manager
						if (editor.storage.markdown?.manager && looksLikeMarkdown(text)) {
							const json = editor.storage.markdown.manager.parse(text);
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

/**
 * Re-export for convenience
 */
export { looksLikeMarkdown };
