/**
 * Core module exports
 * @module core
 */

export { createEditor, getFileState, reparseAsMarkdown } from "./editor";
export type { CreateEditorOptions } from "./editor";

export { PasteMarkdown, looksLikeMarkdown } from "./extensions";

export {
	storage,
	settingsStorage,
	toolbarStorage,
	contentStorage
} from "./storage";
