/**
 * Storage abstraction for persistent data
 * @module core/storage
 */

import type { StorageAdapter, EditorSettings } from "../types";
import { STORAGE_KEYS, getDefaultSettings } from "../config";

/**
 * LocalStorage adapter implementation
 */
class LocalStorageAdapter implements StorageAdapter {
	get<T>(key: string): T | null {
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	}

	set<T>(key: string, value: T): void {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (e) {
			console.warn("Failed to save to localStorage:", e);
		}
	}

	remove(key: string): void {
		try {
			localStorage.removeItem(key);
		} catch {
			// Ignore
		}
	}
}

/**
 * Singleton storage instance
 */
export const storage: StorageAdapter = new LocalStorageAdapter();

/**
 * Settings-specific storage helpers
 */
export const settingsStorage = {
	load(): EditorSettings {
		const saved = storage.get<Partial<EditorSettings>>(STORAGE_KEYS.settings);
		return { ...getDefaultSettings(), ...saved };
	},

	save(settings: EditorSettings): void {
		storage.set(STORAGE_KEYS.settings, settings);
	},

	reset(): EditorSettings {
		const defaults = getDefaultSettings();
		storage.set(STORAGE_KEYS.settings, defaults);
		return defaults;
	},
};

/**
 * Toolbar state storage helpers
 */
export const toolbarStorage = {
	isVisible(): boolean {
		return storage.get<boolean>(STORAGE_KEYS.toolbar) ?? false;
	},

	setVisible(visible: boolean): void {
		storage.set(STORAGE_KEYS.toolbar, visible);
	},
};

/**
 * Content storage helpers
 */
export const contentStorage = {
	load(): string {
		return storage.get<string>(STORAGE_KEYS.content) ?? "";
	},

	save(content: unknown): void {
		storage.set(STORAGE_KEYS.content, content);
	},

	clear(): void {
		storage.remove(STORAGE_KEYS.content);
	},
};
