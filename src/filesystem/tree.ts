/**
 * FileNode model — CRUD operations on the flat-map tree
 * @module filesystem/tree
 */

import type { TreeNode, FileNode, FolderNode } from "../types";
import { fsStore } from "./store";

// ── Queries ──────────────────────────────────────────────────────────────────

/** Get children of a folder (or root when parentId is null), sorted folders-first then alphabetical */
export function getChildren(parentId: string | null): TreeNode[] {
	const nodes = Object.values(fsStore.getAllNodes()).filter(
		(n) => n.parentId === parentId,
	);
	return sortNodes(nodes);
}

/** Sort: folders first (alphabetical), then files (alphabetical) */
export function sortNodes(nodes: TreeNode[]): TreeNode[] {
	return nodes.sort((a, b) => {
		if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
		return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
	});
}

/** Get all descendant IDs of a folder (recursive) */
export function getDescendantIds(folderId: string): string[] {
	const ids: string[] = [];
	const children = Object.values(fsStore.getAllNodes()).filter(
		(n) => n.parentId === folderId,
	);
	for (const child of children) {
		ids.push(child.id);
		if (child.type === "folder") {
			ids.push(...getDescendantIds(child.id));
		}
	}
	return ids;
}

// ── Create ───────────────────────────────────────────────────────────────────

/** Generate a unique file name within a parent folder */
function uniqueName(baseName: string, parentId: string | null): string {
	const siblings = getChildren(parentId);
	const names = new Set(siblings.map((n) => n.name.toLowerCase()));

	if (!names.has(baseName.toLowerCase())) return baseName;

	const ext = baseName.includes(".") ? baseName.slice(baseName.lastIndexOf(".")) : "";
	const stem = baseName.includes(".")
		? baseName.slice(0, baseName.lastIndexOf("."))
		: baseName;

	let i = 2;
	while (names.has(`${stem} ${i}${ext}`.toLowerCase())) i++;
	return `${stem} ${i}${ext}`;
}

/** Create a new file and return it */
export function createFile(parentId: string | null, name?: string): FileNode {
	const fileName = uniqueName(name ?? "Untitled.md", parentId);
	const node: FileNode = {
		id: crypto.randomUUID(),
		type: "file",
		name: fileName,
		parentId,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	fsStore.setNode(node);
	fsStore.saveFileContent(node.id, "");
	return node;
}

/** Create a new folder and return it */
export function createFolder(parentId: string | null, name?: string): FolderNode {
	const folderName = uniqueName(name ?? "New Folder", parentId);
	const node: FolderNode = {
		id: crypto.randomUUID(),
		type: "folder",
		name: folderName,
		parentId,
		collapsed: false,
		createdAt: Date.now(),
	};
	fsStore.setNode(node);
	return node;
}

// ── Update ───────────────────────────────────────────────────────────────────

/** Rename a node */
export function renameNode(id: string, newName: string): void {
	const node = fsStore.getNode(id);
	if (!node) return;

	const trimmed = newName.trim();
	if (!trimmed) return;

	// Ensure unique name among siblings
	const siblings = getChildren(node.parentId).filter((n) => n.id !== id);
	const names = new Set(siblings.map((n) => n.name.toLowerCase()));
	const finalName = names.has(trimmed.toLowerCase())
		? uniqueName(trimmed, node.parentId)
		: trimmed;

	node.name = finalName;
	if (node.type === "file") {
		node.updatedAt = Date.now();
	}
	fsStore.setNode(node);
}

/** Move a node to a new parent */
export function moveNode(id: string, newParentId: string | null): void {
	const node = fsStore.getNode(id);
	if (!node) return;

	// Prevent moving a folder into itself or its descendants
	if (node.type === "folder" && newParentId !== null) {
		const descendantIds = getDescendantIds(id);
		if (newParentId === id || descendantIds.includes(newParentId)) return;
	}

	node.parentId = newParentId;
	if (node.type === "file") {
		node.updatedAt = Date.now();
	}
	fsStore.setNode(node);
}

/** Toggle folder collapsed state */
export function toggleFolder(id: string): void {
	const node = fsStore.getNode(id);
	if (!node || node.type !== "folder") return;
	node.collapsed = !node.collapsed;
	fsStore.setNode(node);
}

/** Collapse all folders */
export function collapseAllFolders(): void {
	const nodes = fsStore.getAllNodes();
	for (const node of Object.values(nodes)) {
		if (node.type === "folder" && !node.collapsed) {
			node.collapsed = true;
			fsStore.setNode(node);
		}
	}
}

// ── Delete ───────────────────────────────────────────────────────────────────

/** Delete a node and all descendants (for folders). Returns IDs of removed nodes. */
export function deleteNode(id: string): string[] {
	const node = fsStore.getNode(id);
	if (!node) return [];

	const idsToRemove = [id];
	if (node.type === "folder") {
		idsToRemove.push(...getDescendantIds(id));
	}

	for (const removeId of idsToRemove) {
		fsStore.removeNode(removeId);
	}

	// If the active file was deleted, pick a new one
	const activeId = fsStore.getActiveFileId();
	if (activeId && idsToRemove.includes(activeId)) {
		const remaining = Object.values(fsStore.getAllNodes()).filter(
			(n) => n.type === "file",
		);
		fsStore.setActiveFileId(remaining.length > 0 ? remaining[0]!.id : null);
	}

	return idsToRemove;
}
