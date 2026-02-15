/**
 * Sidebar UI — tree view, resize handle, context menus, toggle button
 * @module filesystem/sidebar
 */

import type { Editor } from "@tiptap/core";
import type { TreeNode } from "../types";
import { icons } from "../ui/icons";
import { createElement, createButton } from "../ui/components";
import { settingsStorage } from "../core/storage";
import { fsStore } from "./store";
import {
	getChildren,
	createFile,
	createFolder,
	renameNode,
	deleteNode,
	toggleFolder,
	collapseAllFolders,
} from "./tree";
import { exportSnapshot, importSnapshot } from "./snapshot";
import { isMobile } from "../config";

// ── Module state ─────────────────────────────────────────────────────────────

let sidebarEl: HTMLElement | null = null;
let resizerEl: HTMLElement | null = null;
let backdropEl: HTMLElement | null = null;
let treeContainer: HTMLElement | null = null;
let toggleBtn: HTMLButtonElement | null = null;

/** Called externally to switch the active file */
let onSwitchFile: ((fileId: string) => void) | null = null;

/** Called externally to export a single file as .md */
let onExportFile: ((fileId: string) => void) | null = null;

// ── Initialise ───────────────────────────────────────────────────────────────

export interface SidebarOptions {
	onSwitchFile: (fileId: string) => void;
	onExportFile: (fileId: string) => void;
	editor: Editor;
}

export function initSidebar(opts: SidebarOptions): void {
	onSwitchFile = opts.onSwitchFile;
	onExportFile = opts.onExportFile;

	sidebarEl = document.getElementById("sidebar");
	resizerEl = document.querySelector(".md-resizer");
	backdropEl = document.querySelector(".md-sidebar-backdrop");

	if (!sidebarEl) return;

	// Build sidebar internals
	buildSidebarContent();

	// Restore persisted state
	const width = fsStore.getSidebarWidth();
	document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
	if (fsStore.isSidebarOpen()) {
		sidebarEl.classList.add("open");
	}

	// Resize handle
	if (resizerEl) initResizer();

	// Backdrop (mobile)
	if (backdropEl) {
		backdropEl.addEventListener("click", () => closeSidebar());
	}

	// Toggle button (always visible when sidebar is closed)
	createToggleButton();

	// Initial render
	renderTree();
}

// ── Build sidebar DOM ────────────────────────────────────────────────────────

function buildSidebarContent(): void {
	if (!sidebarEl) return;

	// Header
	const header = createElement("div", { className: "md-sidebar-header" });

	const title = createElement("span", {
		className: "md-sidebar-header-title",
		textContent: "Files",
	});

	const actions = createElement("div", { className: "md-sidebar-header-actions" });

	const newFileBtn = createButton({
		innerHTML: icons.plus({ size: 16 }),
		title: "New File",
		onClick: () => {
			const file = createFile(null);
			fsStore.setActiveFileId(file.id);
			onSwitchFile?.(file.id);
			renderTree();
			// Start inline rename
			requestAnimationFrame(() => startInlineRename(file.id));
		},
	});

	const newFolderBtn = createButton({
		innerHTML: icons.folderPlus({ size: 16 }),
		title: "New Folder",
		onClick: () => {
			const folder = createFolder(null);
			renderTree();
			requestAnimationFrame(() => startInlineRename(folder.id));
		},
	});

	const collapseBtn = createButton({
		innerHTML: icons.collapseAll({ size: 16 }),
		title: "Collapse All Folders",
		onClick: () => {
			collapseAllFolders();
			renderTree();
		},
	});

	const closeBtn = createButton({
		innerHTML: icons.close({ size: 16 }),
		title: "Close Sidebar",
		onClick: () => closeSidebar(),
	});

	actions.append(newFileBtn, newFolderBtn, collapseBtn, closeBtn);
	header.append(title, actions);

	// Tree container
	treeContainer = createElement("div", { className: "md-tree" });

	// Footer (backup/restore)
	const footer = createElement("div", { className: "md-sidebar-footer" });

	const backupBtn = createElement("button", { textContent: "Backup All" });
	backupBtn.addEventListener("click", () => exportSnapshot());

	const restoreBtn = createElement("button", { textContent: "Restore" });
	restoreBtn.addEventListener("click", () =>
		importSnapshot(() => {
			renderTree();
			// Reload active file
			const activeId = fsStore.getActiveFileId();
			if (activeId) onSwitchFile?.(activeId);
		}),
	);

	footer.append(backupBtn, restoreBtn);

	sidebarEl.append(header, treeContainer, footer);
}

// ── Tree rendering ───────────────────────────────────────────────────────────

export function renderTree(): void {
	if (!treeContainer) return;
	treeContainer.innerHTML = "";

	const rootChildren = getChildren(null);
	for (const node of rootChildren) {
		treeContainer.appendChild(renderNode(node, 0));
	}

	// If tree is empty, show hint
	if (rootChildren.length === 0) {
		const hint = createElement("div", {
			className: "md-tree-item",
			textContent: "No files yet",
		});
		hint.style.color = "var(--text-muted, #999)";
		hint.style.fontStyle = "italic";
		hint.style.cursor = "default";
		treeContainer.appendChild(hint);
	}
}

function renderNode(node: TreeNode, depth: number): HTMLElement {
	const row = createElement("div", { className: "md-tree-item" });
	row.style.setProperty("--depth", String(depth));
	row.dataset.nodeId = node.id;

	if (node.type === "folder") {
		// Chevron
		const chevron = createElement("span", {
			className: `md-tree-chevron${node.collapsed ? " collapsed" : ""}`,
			innerHTML: icons.chevronDown({ size: 16 }),
		});
		row.appendChild(chevron);

		// Folder icon
		const icon = createElement("span", {
			className: "md-tree-icon",
			innerHTML: icons.folder({ size: 16 }),
		});
		row.appendChild(icon);

		// Name
		const name = createElement("span", {
			className: "md-tree-name",
			textContent: node.name,
		});
		row.appendChild(name);

		// Click to toggle
		row.addEventListener("click", (e) => {
			e.stopPropagation();
			toggleFolder(node.id);
			renderTree();
		});

		// Context menu
		row.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			showContextMenu(e.clientX, e.clientY, node);
		});

		// Render children if expanded
		if (!node.collapsed) {
			const children = getChildren(node.id);
			const wrapper = document.createDocumentFragment();
			wrapper.appendChild(row);
			for (const child of children) {
				wrapper.appendChild(renderNode(child, depth + 1));
			}
			const container = createElement("div", {});
			container.appendChild(wrapper);
			return container;
		}
	} else {
		// File icon
		const icon = createElement("span", {
			className: "md-tree-icon",
			innerHTML: icons.file({ size: 16 }),
		});
		row.appendChild(icon);

		// Name
		const name = createElement("span", {
			className: "md-tree-name",
			textContent: node.name,
		});
		row.appendChild(name);

		// Active state
		if (node.id === fsStore.getActiveFileId()) {
			row.classList.add("active");
		}

		// Click to switch file
		row.addEventListener("click", (e) => {
			e.stopPropagation();
			onSwitchFile?.(node.id);
			renderTree();
			// On mobile, auto-close sidebar on file select
			if (isMobile()) closeSidebar();
		});

		// Context menu
		row.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			showContextMenu(e.clientX, e.clientY, node);
		});
	}

	return row;
}

// ── Context menu ─────────────────────────────────────────────────────────────

let activeContextMenu: HTMLElement | null = null;

function dismissContextMenu(): void {
	if (activeContextMenu) {
		activeContextMenu.remove();
		activeContextMenu = null;
	}
	document.removeEventListener("click", dismissContextMenu);
	document.removeEventListener("contextmenu", dismissContextMenu);
}

function showContextMenu(x: number, y: number, node: TreeNode): void {
	dismissContextMenu();

	const menu = createElement("div", { className: "md-context-menu" });

	// Position
	menu.style.left = `${x}px`;
	menu.style.top = `${y}px`;

	const items: Array<{
		label: string;
		icon?: string;
		danger?: boolean;
		action: () => void;
	}> = [];

	// Rename
	items.push({
		label: "Rename",
		icon: icons.edit({ size: 16 }),
		action: () => {
			dismissContextMenu();
			startInlineRename(node.id);
		},
	});

	// New file (creates in same parent)
	items.push({
		label: "New File",
		icon: icons.plus({ size: 16 }),
		action: () => {
			dismissContextMenu();
			const parentId = node.type === "folder" ? node.id : node.parentId;
			const file = createFile(parentId);
			fsStore.setActiveFileId(file.id);
			onSwitchFile?.(file.id);
			renderTree();
			requestAnimationFrame(() => startInlineRename(file.id));
		},
	});

	// New folder
	items.push({
		label: "New Folder",
		icon: icons.folderPlus({ size: 16 }),
		action: () => {
			dismissContextMenu();
			const parentId = node.type === "folder" ? node.id : node.parentId;
			const folder = createFolder(parentId);
			renderTree();
			requestAnimationFrame(() => startInlineRename(folder.id));
		},
	});

	// Export (files only)
	if (node.type === "file") {
		items.push({
			label: "Export as .md",
			icon: icons.download({ size: 16 }),
			action: () => {
				dismissContextMenu();
				onExportFile?.(node.id);
			},
		});
	}

	// Separator before delete
	const sepIndex = items.length;

	// Delete
	items.push({
		label: "Delete",
		icon: icons.trash({ size: 16 }),
		danger: true,
		action: () => {
			dismissContextMenu();
			const label = node.type === "folder" ? "folder and all its contents" : "file";
			if (!confirm(`Delete this ${label}?\n"${node.name}"`)) return;
			const removed = deleteNode(node.id);
			if (removed.length > 0) {
				// If active file was removed, switch to new active
				const newActiveId = fsStore.getActiveFileId();
				if (newActiveId) onSwitchFile?.(newActiveId);
			}
			renderTree();
		},
	});

	// Build menu DOM
	for (let i = 0; i < items.length; i++) {
		if (i === sepIndex) {
			menu.appendChild(createElement("div", { className: "md-context-menu-separator" }));
		}
		const item = items[i]!;
		const btn = createElement("button", {
			className: `md-context-menu-item${item.danger ? " danger" : ""}`,
			innerHTML: `${item.icon ?? ""}<span>${item.label}</span>`,
		});
		btn.addEventListener("click", item.action);
		menu.appendChild(btn);
	}

	document.body.appendChild(menu);
	activeContextMenu = menu;

	// Adjust if off-screen
	requestAnimationFrame(() => {
		const rect = menu.getBoundingClientRect();
		if (rect.right > window.innerWidth) {
			menu.style.left = `${window.innerWidth - rect.width - 8}px`;
		}
		if (rect.bottom > window.innerHeight) {
			menu.style.top = `${window.innerHeight - rect.height - 8}px`;
		}
	});

	// Dismiss on next click
	requestAnimationFrame(() => {
		document.addEventListener("click", dismissContextMenu);
		document.addEventListener("contextmenu", dismissContextMenu);
	});
}

// ── Inline rename ────────────────────────────────────────────────────────────

function startInlineRename(nodeId: string): void {
	const row = treeContainer?.querySelector(`[data-node-id="${nodeId}"]`);
	if (!row) return;

	const nameEl = row.querySelector(".md-tree-name");
	if (!nameEl) return;

	const node = fsStore.getNode(nodeId);
	if (!node) return;

	const input = createElement("input", {
		className: "md-tree-rename-input",
		attributes: {
			type: "text",
			value: node.name,
		},
	});
	input.value = node.name;

	nameEl.replaceWith(input);
	input.focus();
	// Select filename without extension
	const dotIndex = node.name.lastIndexOf(".");
	input.setSelectionRange(0, dotIndex > 0 ? dotIndex : node.name.length);

	const commit = () => {
		const newName = input.value.trim();
		if (newName && newName !== node.name) {
			renameNode(nodeId, newName);
		}
		renderTree();
	};

	input.addEventListener("blur", commit);
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			input.blur();
		}
		if (e.key === "Escape") {
			input.value = node.name; // revert
			input.blur();
		}
	});
}

// ── Resizer ──────────────────────────────────────────────────────────────────

function initResizer(): void {
	if (!resizerEl || !sidebarEl) return;

	let startX = 0;
	let startWidth = 0;

	const onMouseMove = (e: MouseEvent) => {
		const dx = e.clientX - startX;
		const newWidth = Math.max(180, Math.min(500, startWidth + dx));
		document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);
	};

	const onMouseUp = () => {
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
		document.body.classList.remove("resizing");
		resizerEl?.classList.remove("dragging");

		// Persist final width
		const computed = getComputedStyle(document.documentElement)
			.getPropertyValue("--sidebar-width")
			.trim();
		const finalWidth = parseInt(computed, 10);
		if (!isNaN(finalWidth)) fsStore.setSidebarWidth(finalWidth);
	};

	resizerEl.addEventListener("mousedown", (e) => {
		e.preventDefault();
		startX = e.clientX;
		const computed = getComputedStyle(document.documentElement)
			.getPropertyValue("--sidebar-width")
			.trim();
		startWidth = parseInt(computed, 10) || 240;

		// Attach to document per review recommendation — prevents cursor slip
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
		document.body.classList.add("resizing");
		resizerEl?.classList.add("dragging");
	});
}

// ── Toggle ───────────────────────────────────────────────────────────────────

function createToggleButton(): void {
	const settings = settingsStorage.load();
	const position = settings.sidebarTogglePosition ?? "top-left";

	toggleBtn = createButton({
		className: `md-sidebar-toggle pos-${position}`,
		innerHTML: icons.sidebar({ size: 18 }),
		title: "Toggle Sidebar",
		onClick: () => openSidebar(),
	});

	// Append inside #app so it's part of the layout
	const app = document.getElementById("app");
	if (app) {
		app.appendChild(toggleBtn);
	} else {
		document.body.appendChild(toggleBtn);
	}

	// If sidebar is already open on init, hide the toggle
	if (sidebarEl?.classList.contains("open")) {
		toggleBtn.classList.add("hidden");
	}
}

export function openSidebar(): void {
	sidebarEl?.classList.add("open");
	backdropEl?.classList.add("visible");
	toggleBtn?.classList.add("hidden");
	fsStore.setSidebarOpen(true);
	renderTree();
}

export function closeSidebar(): void {
	sidebarEl?.classList.remove("open");
	backdropEl?.classList.remove("visible");
	toggleBtn?.classList.remove("hidden");
	fsStore.setSidebarOpen(false);
}

export function toggleSidebar(): void {
	if (sidebarEl?.classList.contains("open")) {
		closeSidebar();
	} else {
		openSidebar();
	}
}
