/**
 * Quick Actions panel - slide-in panel with common editor actions
 * @module ui/quick-actions
 */

import type { Editor } from "@tiptap/core";
import { icons } from "./icons";
import { createElement, createButton } from "./components";

interface QuickAction {
	id: string;
	icon: string;
	label: string;
	action: (editor: Editor) => void;
}

/**
 * Default quick action items
 */
const quickActionItems: QuickAction[] = [
	{
		id: "select-all",
		icon: icons.selectAll(),
		label: "Select All",
		action: (editor) => {
			editor.commands.selectAll();
			editor.commands.focus();
		},
	},
	{
		id: "copy",
		icon: icons.copy(),
		label: "Copy",
		action: async (editor) => {
			const { from, to } = editor.state.selection;
			if (from === to) return; // No selection
			const text = editor.state.doc.textBetween(from, to, "\n");
			await navigator.clipboard.writeText(text);
		},
	},
	{
		id: "select-copy",
		icon: icons.clipboard(),
		label: "Select All + Copy",
		action: async (editor) => {
			editor.commands.selectAll();
			// copy as markdown
			const text = editor.getMarkdown();
			await navigator.clipboard.writeText(text);
			editor.commands.focus();
		},
	},
	{
		id: "clear-all",
		icon: icons.trash(),
		label: "Clear All",
		action: (editor) => {
			if (confirm("Clear all content?")) {
				editor.commands.clearContent();
				editor.commands.focus();
			}
		},
	},
	{
		id: "scroll-top",
		icon: icons.arrowUp(),
		label: "Scroll to Top",
		action: (editor) => {
			editor.commands.focus("start");
			window.scrollTo({ top: 0, behavior: "smooth" });
		},
	},
	{
		id: "scroll-bottom",
		icon: icons.arrowDown(),
		label: "Scroll to Bottom",
		action: (editor) => {
			editor.commands.focus("end");
			window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
		},
	},
];

/**
 * Create the quick actions toggle button
 */
function createQuickActionsToggle(): HTMLButtonElement {
	return createButton({
		className: "md-quick-actions-toggle",
		innerHTML: icons.zap(),
		title: "Quick Actions",
	});
}

/**
 * Create a quick action button (icon only)
 */
function createQuickActionButton(
	action: QuickAction,
	editor: Editor
): HTMLButtonElement {
	const btn = createButton({
		className: "md-quick-action-btn",
		innerHTML: action.icon,
		title: action.label,
		onClick: () => {
			action.action(editor);
		},
	});
	return btn;
}

/**
 * Create the quick actions bar (vertical strip)
 */
function createQuickActionsBar(editor: Editor): HTMLDivElement {
	const bar = createElement("div", { className: "md-quick-actions hidden" });

	for (const action of quickActionItems) {
		const btn = createQuickActionButton(action, editor);
		bar.appendChild(btn);
	}

	return bar;
}

/**
 * Initialize the quick actions UI
 */
export function initQuickActions(editor: Editor): void {
	const toggle = createQuickActionsToggle();
	const bar = createQuickActionsBar(editor);

	document.body.appendChild(toggle);
	document.body.appendChild(bar);

	toggle.addEventListener("click", (e) => {
		e.stopPropagation();
		bar.classList.toggle("hidden");
		toggle.classList.toggle("active", !bar.classList.contains("hidden"));
	});

	// Close bar when clicking outside
	document.addEventListener("click", (e) => {
		if (!bar.contains(e.target as Node) && !toggle.contains(e.target as Node)) {
			bar.classList.add("hidden");
			toggle.classList.remove("active");
		}
	});
}
