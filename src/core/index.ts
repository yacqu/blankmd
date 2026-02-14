/**
 * Core module exports
 * @module core
 */

export {
	createEditor,
	getFileState,
	reparseAsMarkdown,
	setContentSaveHandler,
	forceSave,
	getEditorContent,
	setEditorContent,
} from "./editor";
export type { CreateEditorOptions } from "./editor";

export { PasteMarkdown, looksLikeMarkdown } from "./extensions";

export {
	storage,
	settingsStorage,
	toolbarStorage,
	contentStorage
} from "./storage";
