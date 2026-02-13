import type { Editor } from "@tiptap/core";

const TOOLBAR_STORAGE_KEY = "md-editor:toolbar-visible";

interface ToolbarButton {
  icon: string;
  title: string;
  action: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}

const toolbarButtons: ToolbarButton[] = [
  {
    icon: "H1",
    title: "Heading 1",
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
  },
  {
    icon: "H2",
    title: "Heading 2",
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    icon: "H3",
    title: "Heading 3",
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
  },
  { icon: "|", title: "", action: () => {} }, // Separator
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>`,
    title: "Bold",
    action: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>`,
    title: "Italic",
    action: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 9.5L8 12l2 2.5"></path><path d="M14 9.5l2 2.5-2 2.5"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>`,
    title: "Inline Code",
    action: (editor) => editor.chain().focus().toggleCode().run(),
    isActive: (editor) => editor.isActive("code"),
  },
  { icon: "|", title: "", action: () => {} }, // Separator
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    title: "Bullet List",
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>`,
    title: "Ordered List",
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
  { icon: "|", title: "", action: () => {} }, // Separator
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="3" y2="18"></line><line x1="9" y1="6" x2="21" y2="6"></line><line x1="9" y1="12" x2="21" y2="12"></line><line x1="9" y1="18" x2="21" y2="18"></line></svg>`,
    title: "Blockquote",
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive("blockquote"),
  },
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    title: "Code Block",
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive("codeBlock"),
  },
  {
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    title: "Horizontal Rule",
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];

function createToolbarToggle(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = "md-toolbar-toggle";
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"></line>
    <line x1="4" y1="12" x2="20" y2="12"></line>
    <line x1="4" y1="18" x2="20" y2="18"></line>
  </svg>`;
  btn.title = "Toggle Toolbar";
  return btn;
}

function createToolbar(editor: Editor): HTMLDivElement {
  const toolbar = document.createElement("div");
  toolbar.className = "md-toolbar hidden";

  toolbarButtons.forEach((btn) => {
    if (btn.icon === "|") {
      const separator = document.createElement("span");
      separator.className = "md-toolbar-separator";
      toolbar.appendChild(separator);
      return;
    }

    const button = document.createElement("button");
    button.className = "md-toolbar-btn";
    button.innerHTML = btn.icon;
    button.title = btn.title;
    button.type = "button";

    button.addEventListener("click", (e) => {
      e.preventDefault();
      btn.action(editor);
    });

    toolbar.appendChild(button);
  });

  // Update active states on editor changes
  editor.on("selectionUpdate", () => updateActiveStates(toolbar, editor));
  editor.on("update", () => updateActiveStates(toolbar, editor));

  return toolbar;
}

function updateActiveStates(toolbar: HTMLElement, editor: Editor) {
  const buttons = toolbar.querySelectorAll(".md-toolbar-btn");
  let buttonIndex = 0;

  toolbarButtons.forEach((btn) => {
    if (btn.icon === "|") return;

    const button = buttons[buttonIndex];
    if (button && btn.isActive) {
      button.classList.toggle("active", btn.isActive(editor));
    }
    buttonIndex++;
  });
}

function loadToolbarState(): boolean {
  try {
    const raw = localStorage.getItem(TOOLBAR_STORAGE_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

function saveToolbarState(visible: boolean) {
  localStorage.setItem(TOOLBAR_STORAGE_KEY, String(visible));
}

export function initToolbar(editor: Editor): void {
  const toggle = createToolbarToggle();
  const toolbar = createToolbar(editor);

  // Restore saved state
  const isVisible = loadToolbarState();
  if (isVisible) {
    toolbar.classList.remove("hidden");
    toggle.classList.add("active");
  }

  document.body.appendChild(toggle);
  document.body.appendChild(toolbar);

  toggle.addEventListener("click", () => {
    const nowVisible = toolbar.classList.toggle("hidden");
    toggle.classList.toggle("active", !nowVisible);
    saveToolbarState(!nowVisible);
  });
}
