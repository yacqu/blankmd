/**
 * Filesystem store — serialize/deserialize tree to localStorage, active file state
 * @module filesystem/store
 */

import type { FileSystemStore, TreeNode } from "../types";
import { STORAGE_KEYS } from "../config";

const DEFAULT_STORE: FileSystemStore = {
	nodes: {},
	content: {},
	activeFileId: null,
	sidebarWidth: 240,
	sidebarOpen: false,
};

class FsStore {
	private store: FileSystemStore;

	constructor() {
		this.store = { ...DEFAULT_STORE };
	}

	/** Load store from localStorage (or accept a migrated state) */
	load(initial?: FileSystemStore): void {
		if (initial) {
			this.store = initial;
			this.persist();
			return;
		}

		try {
			const raw = localStorage.getItem(STORAGE_KEYS.filesystem);
			if (raw) {
				this.store = JSON.parse(raw);
			}
		} catch {
			console.warn("Failed to load filesystem store");
		}
	}

	/** Persist current state to localStorage with quota error handling */
	persist(): void {
		try {
			localStorage.setItem(STORAGE_KEYS.filesystem, JSON.stringify(this.store));
		} catch (e) {
			if (e instanceof DOMException && e.name === "QuotaExceededError") {
				alert(
					"Storage full. Please export a backup and delete some files to free up space.",
				);
			} else {
				console.warn("Failed to persist filesystem store:", e);
			}
		}
	}

	// ── Node operations ──────────────────────────────────────────────────

	getNode(id: string): TreeNode | undefined {
		return this.store.nodes[id];
	}

	getAllNodes(): Record<string, TreeNode> {
		return this.store.nodes;
	}

	setNode(node: TreeNode): void {
		this.store.nodes[node.id] = node;
		this.persist();
	}

	removeNode(id: string): void {
		delete this.store.nodes[id];
		delete this.store.content[id];
		this.persist();
	}

	// ── Content operations ───────────────────────────────────────────────

	getContent(fileId: string): string {
		return this.store.content[fileId] ?? "";
	}

	saveFileContent(fileId: string, content: string): void {
		this.store.content[fileId] = content;

		const node = this.store.nodes[fileId];
		if (node && node.type === "file") {
			node.updatedAt = Date.now();
		}

		this.persist();
	}

	// ── Active file ──────────────────────────────────────────────────────

	getActiveFileId(): string | null {
		return this.store.activeFileId;
	}

	setActiveFileId(id: string | null): void {
		this.store.activeFileId = id;
		this.persist();
	}

	// ── Sidebar state ────────────────────────────────────────────────────

	getSidebarWidth(): number {
		return this.store.sidebarWidth;
	}

	setSidebarWidth(width: number): void {
		this.store.sidebarWidth = width;
		this.persist();
	}

	isSidebarOpen(): boolean {
		return this.store.sidebarOpen;
	}

	setSidebarOpen(open: boolean): void {
		this.store.sidebarOpen = open;
		this.persist();
	}

	// ── Snapshot / bulk operations ────────────────────────────────────────

	/** Get the full store state for snapshot export */
	getState(): FileSystemStore {
		return structuredClone(this.store);
	}

	/** Replace the entire store (for snapshot import) */
	replaceState(newState: FileSystemStore): void {
		this.store = newState;
		this.persist();
	}
}

/** Singleton filesystem store */
export const fsStore = new FsStore();
