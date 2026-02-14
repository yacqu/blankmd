# feat: Virtual Filesystem and Resizable Sidebar

## Summary

Add a local virtual filesystem so users can manage multiple markdown files and folders inside blankmd. Everything stays in localStorage. The sidebar defaults to closed — the app should still feel like a single-document editor until you need more.

## What changes

### New: `src/filesystem/` module

```
src/filesystem/
├── index.ts       # public API: initFilesystem(), switchFile(), getActiveFile()
├── tree.ts        # FileNode model, CRUD ops (create/rename/delete/move)
├── store.ts       # serialize/deserialize tree to localStorage, active file state
├── migration.ts   # one-time migration from legacy blankmd:content
├── sidebar.ts     # sidebar UI: tree view, resize handle, context menus
└── snapshot.ts    # backup/restore: export & import full filesystem as JSON
```

### Modified existing files

| File | Change |
|---|---|
| `src/types.ts` | Add filesystem types (FileNode, FolderNode, FileSystemStore) |
| `src/config/defaults.ts` | Add STORAGE_KEYS for filesystem + sidebar defaults |
| `src/styles.css` | Add sidebar, tree view, resizer styles |
| `src/core/editor.ts` | Expose `setContent()` / `getContent()` for file switching |
| `src/ui/icons.ts` | Add file, folder, chevron, plus, trash icons |
| `src/index.ts` | Wire up `initFilesystem(editor)` |
| `scripts/build.ts` | Update HTML template to include sidebar wrapper div |

## Data model

Flat map keyed by UUID. Tree structure is derived from `parentId` references, not nesting. This keeps CRUD operations O(1) and makes future tabs trivial.

```typescript
// Added to src/types.ts

interface FileNode {
  id: string;           // UUID
  type: "file";
  name: string;         // "notes.md"
  parentId: string | null;  // null = root level
  createdAt: number;
  updatedAt: number;
}

interface FolderNode {
  id: string;
  type: "folder";
  name: string;
  parentId: string | null;
  collapsed: boolean;
  createdAt: number;
}

type TreeNode = FileNode | FolderNode;

interface FileSystemStore {
  nodes: Record<string, TreeNode>;    // flat map of all nodes
  content: Record<string, string>;    // file content keyed by file ID (stored as Tiptap JSON string)
  activeFileId: string | null;        // currently open file
  sidebarWidth: number;               // persisted sidebar width in px
  sidebarOpen: boolean;               // persisted open/closed state
}
```

**Why flat map instead of nested tree:**
* Rename, move, delete are all just property updates on one object
* Getting children of a folder is `Object.values(nodes).filter(n => n.parentId === folderId)`
* No recursive serialization needed
* Changing `activeFileId` to `openFileIds: string[]` for future tabs requires zero model changes

**Content stored separately from nodes:**
* The `nodes` map is loaded on every page load to render the sidebar
* File content is only loaded when you open a file
* Keeps the tree operations fast even with many files

## How file switching works

This is the core interaction and it touches `editor.ts` . The editor currently calls `contentStorage.save(editor.getJSON())` on every update. With the filesystem, the save target changes based on which file is active.

### Changes to `editor.ts`

Don't make the editor filesystem-aware. Instead, expose two functions:

```typescript
// New exports from editor.ts

/** Get current editor content as Tiptap JSON string */
export function getEditorContent(editor: Editor): string {
  return JSON.stringify(editor.getJSON());
}

/** Replace editor content (used when switching files) */
export function setEditorContent(editor: Editor, content: string): void {
  if (!content) {
    editor.commands.clearContent();
    return;
  }
  try {
    editor.commands.setContent(JSON.parse(content));
  } catch {
    // If it's not valid JSON, try parsing as markdown
    const parsed = editor.storage.markdown.manager.parse(content);
    editor.commands.setContent(parsed);
  }
}
```

### Changes to `handleContentUpdate`

The debounced save currently writes to `contentStorage` . With the filesystem, it needs to save to the active file. Two approaches:

**Option A (recommended):** Add a save callback that the filesystem module sets:

```typescript
// In editor.ts
let onContentSave: ((content: string) => void) | null = null;

export function setContentSaveHandler(handler: (content: string) => void): void {
  onContentSave = handler;
}

function handleContentUpdate(editor: Editor): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const content = JSON.stringify(editor.getJSON());
    if (onContentSave) {
      onContentSave(content);
    } else {
      contentStorage.save(editor.getJSON()); // fallback to legacy behavior
    }
  }, 500);
}
```

Then in `filesystem/index.ts` :

```typescript
import { setContentSaveHandler } from "../core/editor";
import { fsStore } from "./store";

export function initFilesystem(editor: Editor): void {
  // Take over content saving
  setContentSaveHandler((content) => {
    const activeId = fsStore.getActiveFileId();
    if (activeId) {
      fsStore.saveFileContent(activeId, content);
    }
  });
}
```

This keeps the editor dumb — it just calls a save function. The filesystem decides where the content goes.

## Migration

First-time migration runs once when the filesystem module initializes. It checks if the old `blankmd:content` key exists and the new `blankmd:filesystem` key doesn't.

```typescript
// src/filesystem/migration.ts

import { STORAGE_KEYS } from "../config";

export function migrateIfNeeded(): FileSystemStore {
  const existing = localStorage.getItem(STORAGE_KEYS.filesystem);
  if (existing) {
    return JSON.parse(existing);
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
```

## Sidebar UI

### Layout

The build currently outputs this HTML:

```html
<body>
    <div id="editor"></div>
    <script>
        ...
    </script>
</body>
```

Change to:

```html
<body>
    <div id="app">
        <aside id="sidebar" class="md-sidebar"></aside>
        <div class="md-resizer"></div>
        <div id="editor"></div>
    </div>
    <script>
        ...
    </script>
</body>
```

The `#app` wrapper is a flex container. The sidebar pushes the editor — no overlay.

### CSS approach

```css
#app {
    display: flex;
    height: 100vh;
}

.md-sidebar {
    width: var(--sidebar-width, 0px);
    min-width: 0;
    overflow: hidden;
    transition: width 0.2s ease;
    flex-shrink: 0;
}

.md-sidebar.open {
    width: var(--sidebar-width, 240px);
    min-width: 180px;
    overflow-y: auto;
}

#editor {
    flex: 1;
    min-width: 0;
}

.md-resizer {
    width: 4px;
    cursor: col-resize;
    background: transparent;
    flex-shrink: 0;
    display: none;
    /* only shown when sidebar is open */
}

.md-sidebar.open~.md-resizer {
    display: block;
}
```

Key decisions:
* Use CSS variable `--sidebar-width` so resizing is a single `style.setProperty` call, no layout thrashing
* Transition on width for smooth open/close
* Resizer is between sidebar and editor, only visible when sidebar is open

### Mobile behavior

On mobile ( `<= 768px` ), the sidebar should be full-width overlay instead of push layout:

```css
@media (max-width: 768px) {
    .md-sidebar.open {
        position: fixed;
        top: 0;
        left: 0;
        width: 85vw;
        height: 100vh;
        z-index: 100;
    }

    .md-resizer {
        display: none !important;
    }
}
```

### Sidebar toggle

Add a small toggle button fixed to the left edge. Reuse `createButton` from `components.ts` . The sidebar toggle should be visible at all times, similar to the toolbar/settings toggles.

### Tree view

Each tree item is a row built with `createElement` :
* Folders: chevron + folder icon + name, click to expand/collapse
* Files: file icon + name, click to switch active file
* Active file gets a highlight class
* Right-click or long-press for context menu (rename, delete, export)

Items are sorted: folders first (alphabetical), then files (alphabetical).

### Context menu

Build a simple context menu with `createElement` — a positioned div with action buttons. Same pattern as the quick-actions panel. Keep it minimal:

| Item | Action |
|---|---|
| Rename | Inline text input replacing the name |
| Delete | Confirm dialog, then remove node + content |
| Export | `Blob` + `URL.createObjectURL` + click a hidden `<a>` to download |
| New File | Creates a file in the same folder |
| New Folder | Creates a folder in the same folder |

### Creating new files/folders

Add a small "+" button at the top of the sidebar. Clicking it creates a new file at root level with name "Untitled.md" (or "Untitled 2.md" if that exists). For folders, use a dropdown or second button.

Files are created with empty content and immediately become the active file. The name should be in inline-edit mode immediately so the user can type a name.

## File operations

### Export (Save to Disk)

```typescript
function exportFile(fileId: string): void {
  const node = store.nodes[fileId];
  const content = store.content[fileId];
  if (!node || node.type !== "file") return;

  // Convert Tiptap JSON to markdown for export
  const markdown = editor.storage.markdown.manager.serialize(JSON.parse(content));

  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = node.name;
  a.click();
  URL.revokeObjectURL(url);
}
```

Export always outputs markdown, even though content is stored internally as Tiptap JSON. This is the right call — users expect `.md` files.

## Storage keys

Add to `STORAGE_KEYS` in `config/defaults.ts` :

```typescript
export const STORAGE_KEYS = {
  content: "blankmd:content",           // legacy, kept for migration
  settings: "blankmd:settings",
  toolbar: "blankmd:toolbar-visible",
  customTheme: "blankmd:custom-theme",
  filesystem: "blankmd:filesystem",     // new: stores FileSystemStore
} as const;
```

Content is stored inside the `FileSystemStore.content` map, not as separate localStorage keys. One key for the whole filesystem. This keeps things simple and atomic — you can't end up with orphaned content entries.

**localStorage size concern:** The 5-10MB localStorage limit is plenty for text-only markdown files. A single file would need to be enormous to cause issues. If this ever becomes a problem, we can split content into per-file keys later, but for now one key is simpler.


## Snapshot (backup & restore)

Users need a way to back up their entire workspace and restore it later. This is especially important since everything lives in localStorage — if they clear browser data, it's gone.

### How it works

**Export:** Serialize the entire `FileSystemStore` to JSON, download as a `.json` file.

**Import:** User picks a `.json` file, validate it, replace the current filesystem state, reload the editor.

### New file

```
src/filesystem/
├── ...
└── snapshot.ts    # export/import the full FileSystemStore as JSON
```

### Implementation

```typescript
// src/filesystem/snapshot.ts

import { fsStore } from "./store";

const SNAPSHOT_VERSION = 1;

interface Snapshot {
  version: number;
  exportedAt: string;        // ISO timestamp
  store: FileSystemStore;    // the full filesystem state
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

      // Validate
      if (!snapshot.version || !snapshot.store?.nodes || !snapshot.store?.content) {
        alert("Invalid snapshot file.");
        return;
      }

      if (!confirm(
        "This will replace all your current files and folders. " +
        "Consider exporting a backup first.\n\nContinue?"
      )) {
        return;
      }

      fsStore.replaceState(snapshot.store);
      onComplete();  // re-render sidebar, reload active file in editor
    } catch {
      alert("Failed to read snapshot file.");
    }
  });

  input.click();
}
```

### Store methods needed

`fsStore` needs two methods for this:

```typescript
// Added to filesystem/store.ts

/** Get the full store state for snapshot export */
getState(): FileSystemStore {
  return structuredClone(this.store);
}

/** Replace the entire store (for snapshot import) */
replaceState(newState: FileSystemStore): void {
  this.store = newState;
  this.persist();
}
```

### UI integration

Add two entries to the sidebar footer or context menu:

| Action | Label | Where |
|---|---|---|
| Export snapshot | "Backup All" | Bottom of sidebar, or settings panel |
| Import snapshot | "Restore Backup" | Same location |

These could also live in the settings panel under a "Data" section — that might actually be better since it's not a frequent action and doesn't clutter the sidebar.

### Snapshot version field

The `version: 1` field is there so that if we later change the data model (add tabs, change node structure, etc.), we can write migration logic:

```typescript
if (snapshot.version === 1) {
  // migrate v1 -> v2
}
```

### Future: zip export

The snapshot JSON is the simplest useful backup. Later, we can extend this with a zip export that:
* Creates real `.md` files from the content map (converting Tiptap JSON to markdown)
* Preserves the folder structure as directories in the zip
* Uses a library like `fflate` (small, no dependencies, works in browser)

This is a natural extension — `snapshot.ts` already has access to the full store, so adding a `exportAsZip()` function alongside `exportSnapshot()` is straightforward.

## What NOT to build yet

* **Tabs** — The data model supports it (just change `activeFileId` to `openFileIds[]`), but don't build the tab UI. Ship the sidebar first.
* **Drag and drop reordering** — Nice to have, complex to implement. Ship without it.
* **File import** — Opening `.md` files from disk into the virtual filesystem. Ship export first, import later.
* **Search across files** — Useful but separate feature entirely.
* **Zip export** — Snapshot covers the backup use case for now. Zip with real folder structure comes later as an extension of snapshot.


## Build order

Implement in this order so you can test incrementally:

1. **Types + store** — `types.ts` additions,   `filesystem/store.ts`,   `filesystem/migration.ts`
2. **Editor hooks** — `setEditorContent`,   `getEditorContent`,  `setContentSaveHandler` in `editor.ts`
3. **Tree operations** — `filesystem/tree.ts` (create, rename, delete, move, sort)
4. **HTML + CSS** — Update `build.ts` template, add sidebar styles to `styles.css`
5. **Sidebar UI** — `filesystem/sidebar.ts` with tree rendering, resize, toggle
6. **Wire it up** — `filesystem/index.ts`, update `src/index.ts`
7. **Context menu + file ops** — Rename, delete, export
8. **Snapshot** — `filesystem/snapshot.ts`, backup/restore UI in sidebar or settings
9. **Mobile** — Overlay behavior, touch-friendly sizing

## Checklist

* [ ] All logic in vanilla TypeScript, no frameworks
* [ ] Styles in `src/styles.css` using CSS variables
* [ ] Legacy content migrated on first load
* [ ] Sidebar defaults to closed
* [ ] Sidebar pushes editor (desktop), overlays (mobile)
* [ ] Resize handle works smoothly
* [ ] File switching preserves content
* [ ] Export outputs `.md` files
* [ ] Snapshot export downloads valid JSON backup
* [ ] Snapshot import replaces filesystem and reloads editor
* [ ] Snapshot import validates file before replacing
* [ ] Build passes (`bun run build`)
* [ ] Tested on mobile
