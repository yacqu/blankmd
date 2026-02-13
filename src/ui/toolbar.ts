/**
 * Toolbar UI component
 * @module ui/toolbar
 */

import type { Editor } from "@tiptap/core";
import type { ToolbarItem, ToolbarButton } from "../types";
import { toolbarStorage } from "../core/storage";
import { icons, textIcons } from "./icons";
import { createElement, createButton } from "./components";

/**
 * Default toolbar button configuration
 * Easily extendable by adding new items to this array
 */
export const defaultToolbarItems: ToolbarItem[] = [
	{
		id: "h1",
		icon: textIcons.h1,
		title: "Heading 1",
		shortcut: "Cmd+Alt+1",
		action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
		isActive: (editor) => editor.isActive("heading", { level: 1 }),
	},
	{
		id: "h2",
		icon: textIcons.h2,
		title: "Heading 2",
		shortcut: "Cmd+Alt+2",
		action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
		isActive: (editor) => editor.isActive("heading", { level: 2 }),
	},
	{
		id: "h3",
		icon: textIcons.h3,
		title: "Heading 3",
		shortcut: "Cmd+Alt+3",
		action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
		isActive: (editor) => editor.isActive("heading", { level: 3 }),
	},
	{ id: "sep-1", type: "separator" },
	{
		id: "bold",
		icon: icons.bold(),
		title: "Bold",
		shortcut: "Cmd+B",
		action: (editor) => editor.chain().focus().toggleBold().run(),
		isActive: (editor) => editor.isActive("bold"),
	},
	{
		id: "italic",
		icon: icons.italic(),
		title: "Italic",
		shortcut: "Cmd+I",
		action: (editor) => editor.chain().focus().toggleItalic().run(),
		isActive: (editor) => editor.isActive("italic"),
	},
	{
		id: "code",
		icon: icons.code(),
		title: "Inline Code",
		shortcut: "Cmd+E",
		action: (editor) => editor.chain().focus().toggleCode().run(),
		isActive: (editor) => editor.isActive("code"),
	},
	{ id: "sep-2", type: "separator" },
	{
		id: "bulletList",
		icon: icons.bulletList(),
		title: "Bullet List",
		shortcut: "Cmd+Shift+8",
		action: (editor) => editor.chain().focus().toggleBulletList().run(),
		isActive: (editor) => editor.isActive("bulletList"),
	},
	{
		id: "orderedList",
		icon: icons.orderedList(),
		title: "Ordered List",
		shortcut: "Cmd+Shift+7",
		action: (editor) => editor.chain().focus().toggleOrderedList().run(),
		isActive: (editor) => editor.isActive("orderedList"),
	},
	{ id: "sep-3", type: "separator" },
	{
		id: "blockquote",
		icon: icons.blockquote(),
		title: "Blockquote",
		shortcut: "Cmd+Shift+B",
		action: (editor) => editor.chain().focus().toggleBlockquote().run(),
		isActive: (editor) => editor.isActive("blockquote"),
	},
	{
		id: "codeBlock",
		icon: icons.codeBlock(),
		title: "Code Block",
		shortcut: "Cmd+Alt+C",
		action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
		isActive: (editor) => editor.isActive("codeBlock"),
	},
	{
		id: "horizontalRule",
		icon: icons.horizontalRule(),
		title: "Horizontal Rule",
		action: (editor) => editor.chain().focus().setHorizontalRule().run(),
	},
];

/**
 * Check if item is a separator
 */
function isSeparator(item: ToolbarItem): item is { id: string; type: "separator"; } {
	return "type" in item && item.type === "separator";
}

/**
 * Create the toolbar toggle button
 */
function createToolbarToggle(): HTMLButtonElement {
	return createButton({
		className: "md-toolbar-toggle",
		innerHTML: icons.menu(),
		title: "Toggle Toolbar",
	});
}

/**
 * Create a toolbar button element
 */
function createToolbarButton(item: ToolbarButton, editor: Editor): HTMLButtonElement {
	const title = item.shortcut ? `${item.title} (${item.shortcut})` : item.title;

	return createButton({
		className: "md-toolbar-btn",
		innerHTML: item.icon,
		title,
		onClick: (e) => {
			e.preventDefault();
			item.action(editor);
		},
	});
}

/**
 * Create the toolbar container with all buttons
 */
function createToolbarContainer(
	editor: Editor,
	items: ToolbarItem[] = defaultToolbarItems
): HTMLDivElement {
	const toolbar = createElement("div", { className: "md-toolbar hidden" });

	const buttonElements: Map<string, HTMLButtonElement> = new Map();

	for (const item of items) {
		if (isSeparator(item)) {
			const separator = createElement("span", { className: "md-toolbar-separator" });
			toolbar.appendChild(separator);
			continue;
		}

		const button = createToolbarButton(item, editor);
		buttonElements.set(item.id, button);
		toolbar.appendChild(button);
	}

	// Update active states on editor changes
	const updateActiveStates = () => {
		for (const item of items) {
			if (isSeparator(item)) continue;

			const button = buttonElements.get(item.id);
			if (button && item.isActive) {
				button.classList.toggle("active", item.isActive(editor));
			}
		}
	};

	editor.on("selectionUpdate", updateActiveStates);
	editor.on("update", updateActiveStates);

	return toolbar;
}

export interface ToolbarOptions {
	/** Custom toolbar items (defaults to defaultToolbarItems) */
	items?: ToolbarItem[];
	/** Whether toolbar starts visible (defaults to saved state) */
	initialVisible?: boolean;
}

/**
 * Initialize the toolbar UI
 */
export function initToolbar(editor: Editor, options: ToolbarOptions = {}): void {
	const { items = defaultToolbarItems, initialVisible } = options;

	const toggle = createToolbarToggle();
	const toolbar = createToolbarContainer(editor, items);

	// Restore saved state or use provided initial state
	const isVisible = initialVisible ?? toolbarStorage.isVisible();

	if (isVisible) {
		toolbar.classList.remove("hidden");
		toggle.classList.add("active");
	}

	document.body.appendChild(toggle);
	document.body.appendChild(toolbar);

	toggle.addEventListener("click", () => {
		const nowHidden = toolbar.classList.toggle("hidden");
		toggle.classList.toggle("active", !nowHidden);
		toolbarStorage.setVisible(!nowHidden);
	});
}

/**
 * Create a custom toolbar button configuration
 * Helper for extending the toolbar
 */
export function createToolbarItem(
	config: Omit<ToolbarButton, "id"> & { id?: string; }
): ToolbarButton {
	return {
		id: config.id ?? `custom-${Date.now()}`,
		...config,
	};
}
