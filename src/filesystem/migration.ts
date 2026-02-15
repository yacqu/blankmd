/**
 * One-time migration from legacy blankmd:content to filesystem store
 * @module filesystem/migration
 */

import type { FileSystemStore } from "../types";
import { STORAGE_KEYS } from "../config";

/**
 * Migrate legacy single-document content to the new filesystem store.
 * Runs once — if the filesystem key already exists, returns the parsed state.
 * If only the legacy key exists, wraps its content into a single-file filesystem.
 */
export function migrateIfNeeded(): FileSystemStore {
	const existing = localStorage.getItem(STORAGE_KEYS.filesystem);
	if (existing) {
		try {
			return JSON.parse(existing) as FileSystemStore;
		} catch {
			// Corrupted — fall through and create fresh store
		}
	}

	// Check for legacy single-document content
	const legacyContent = localStorage.getItem(STORAGE_KEYS.content);

	const welcomeFileId = crypto.randomUUID();
	const store: FileSystemStore = {
		nodes: {
			[welcomeFileId]: {
				id: welcomeFileId,
				type: "file",
				name: legacyContent ? "My Notes.md" : "Untitled.md",
				parentId: null,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			},
		},
		content: {
			[welcomeFileId]: legacyContent ?? "",
		},
		activeFileId: welcomeFileId,
		sidebarWidth: 240,
		sidebarOpen: false,
	};

	// Don't delete legacy key yet — keep it as backup for one version
	return store;
}
