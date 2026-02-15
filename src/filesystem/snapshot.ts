/**
 * Snapshot — backup & restore the full FileSystemStore as JSON
 * @module filesystem/snapshot
 */

import type { FileSystemStore } from "../types";
import { fsStore } from "./store";

const SNAPSHOT_VERSION = 1;

interface Snapshot {
	version: number;
	exportedAt: string;
	store: FileSystemStore;
}

/**
 * Export the entire filesystem as a downloadable JSON file
 */
export function exportSnapshot(): void {
	const snapshot: Snapshot = {
		version: SNAPSHOT_VERSION,
		exportedAt: new Date().toISOString(),
		store: fsStore.getState(),
	};

	const json = JSON.stringify(snapshot, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `blankmd-backup-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Validate that an object has the shape of a FileSystemStore.
 * Prevents the app from crashing on a malformed JSON import.
 */
function isValidStore(obj: unknown): obj is FileSystemStore {
	if (!obj || typeof obj !== "object") return false;
	const s = obj as Record<string, unknown>;

	if (typeof s.nodes !== "object" || s.nodes === null) return false;
	if (typeof s.content !== "object" || s.content === null) return false;
	if (s.activeFileId !== null && typeof s.activeFileId !== "string") return false;
	if (typeof s.sidebarWidth !== "number") return false;
	if (typeof s.sidebarOpen !== "boolean") return false;

	// Check that at least the node values look correct
	for (const node of Object.values(s.nodes as Record<string, unknown>)) {
		if (!node || typeof node !== "object") return false;
		const n = node as Record<string, unknown>;
		if (typeof n.id !== "string") return false;
		if (n.type !== "file" && n.type !== "folder") return false;
		if (typeof n.name !== "string") return false;
	}

	return true;
}

/**
 * Import a snapshot file and replace the current filesystem
 */
export function importSnapshot(onComplete: () => void): void {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = ".json";

	input.addEventListener("change", async () => {
		const file = input.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			const snapshot = JSON.parse(text) as Snapshot;

			// Validate structure
			if (
				!snapshot.version ||
				!isValidStore(snapshot.store)
			) {
				alert("Invalid snapshot file. The file structure doesn't match blankmd's backup format.");
				return;
			}

			if (
				!confirm(
					"This will replace all your current files and folders. " +
					"Consider exporting a backup first.\n\nContinue?",
				)
			) {
				return;
			}

			// Handle version migrations
			if (snapshot.version < SNAPSHOT_VERSION) {
				// Future: migrate v1 -> v2, etc.
			}

			fsStore.replaceState(snapshot.store);
			onComplete();
		} catch {
			alert("Failed to read snapshot file.");
		}
	});

	input.click();
}
