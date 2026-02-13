import type { Editor } from "@tiptap/core";

const STORAGE_KEY = "md-editor:settings";
const isMobile = window.innerWidth <= 768;

// ============================================================================
// Design Tokens - Centralized Color Palette & Spacing
// ============================================================================

const darkTokens = {
    // Backgrounds
    bgEditor: "hsla(60, 3%, 14%, 1)",
    bgSurface: "#211e1b",
    bgCodeBlock: "#171412",
    bgCodeInline: "#292524",

    // Text hierarchy
    textPrimary: "#f5f5f4",
    textBody: "#e7e5e4",
    textSecondary: "#d6d3d1",
    textMuted: "#a8a29e",
    textDimmed: "#78716c",
    textPlaceholder: "#57534e",

    // Accent
    accent: "#d97757",
    accentCode: "#e8a0a0",
    selectionBg: "rgba(217, 119, 87, 0.25)",

    // Borders
    borderPrimary: "#707070",
    borderSecondary: "#333333",
    borderHr: "#57534e",

    // List markers
    listMarker: "#57534e",
};

const lightTokens = {
    // Backgrounds
    bgEditor: "#ffffff",
    bgSurface: "#f5f5f4",
    bgCodeBlock: "#f8f8f8",
    bgCodeInline: "#f0f0f0",

    // Text hierarchy
    textPrimary: "#1a1a1a",
    textBody: "#292524",
    textSecondary: "#44403c",
    textMuted: "#78716c",
    textDimmed: "#a8a29e",
    textPlaceholder: "#d6d3d1",

    // Accent
    accent: "#c4613f",
    accentCode: "#9f3a3a",
    selectionBg: "rgba(196, 97, 63, 0.2)",

    // Borders
    borderPrimary: "#e0e0e0",
    borderSecondary: "#d6d3d1",
    borderHr: "#d6d3d1",

    // List markers
    listMarker: "#a8a29e",
};

interface EditorSettings {
    theme: "light" | "dark" | "system";
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    contentWidth: number;
    paragraphSpacing: number;
    headingSpacing: number;
    paddingHorizontal: number
	paddingTop: number;
}

const FONTS = [
    { label: "Georgia", value: "Georgia" },
    { label: "Inter", value: "Inter" },
    { label: "JetBrains Mono", value: "JetBrains Mono" },
    { label: "System", value: "-apple-system, BlinkMacSystemFont, sans-serif" },
];

const DEFAULTS: EditorSettings = {
    theme: "system",
    fontFamily: FONTS.find(f => f.label === "System")!.value,
    fontSize: isMobile ? 14 : 18,
    lineHeight: isMobile ? 1.4 : 1.8,
    contentWidth: isMobile ? 320 : 720,
    paragraphSpacing: 1.0,
    headingSpacing: 1.5,
    paddingHorizontal: isMobile ? 1 : 2, //em
	paddingTop: isMobile ? 1 : 2, //em
};


function loadSettings(): EditorSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return { ...DEFAULTS, ...JSON.parse(raw) };
        }
    } catch {
        // ignore
    }
    return { ...DEFAULTS };
}

function isDarkMode(settings: EditorSettings): boolean {
    if (settings.theme === "dark") return true;
    if (settings.theme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applySettings(settings: EditorSettings): void {
    const root = document.documentElement;
    const dark = isDarkMode(settings);
    const tokens = dark ? darkTokens : lightTokens;

    // Background colors
    root.style.setProperty("--bg-color", tokens.bgEditor);
    root.style.setProperty("--bg-surface", tokens.bgSurface);
    root.style.setProperty("--bg-code-block", tokens.bgCodeBlock);
    root.style.setProperty("--bg-code-inline", tokens.bgCodeInline);

    // Text colors
    root.style.setProperty("--text-primary", tokens.textPrimary);
    root.style.setProperty("--text-body", tokens.textBody);
    root.style.setProperty("--text-secondary", tokens.textSecondary);
    root.style.setProperty("--text-muted", tokens.textMuted);
    root.style.setProperty("--text-dimmed", tokens.textDimmed);
    root.style.setProperty("--text-placeholder", tokens.textPlaceholder);

    // Accent colors
    root.style.setProperty("--accent", tokens.accent);
    root.style.setProperty("--accent-code", tokens.accentCode);
    root.style.setProperty("--selection-bg", tokens.selectionBg);

    // Borders
    root.style.setProperty("--border-primary", tokens.borderPrimary);
    root.style.setProperty("--border-secondary", tokens.borderSecondary);
    root.style.setProperty("--border-hr", tokens.borderHr);

    // List markers
    root.style.setProperty("--list-marker", tokens.listMarker);

    // Typography - user configurable
    root.style.setProperty("--font-family", settings.fontFamily);
    root.style.setProperty("--font-size", `${settings.fontSize}px`);
    root.style.setProperty("--content-width", `${settings.contentWidth}px`);
    root.style.setProperty("--paragraph-spacing", `${settings.paragraphSpacing}em`);

    // Line heights - context specific
    root.style.setProperty("--line-height-body", `${settings.lineHeight}`);
    root.style.setProperty("--line-height-code", "1.7");
    root.style.setProperty("--line-height-list", "1.4");

    // Editor container padding
    root.style.setProperty("--editor-padding-y", `${settings.paddingTop}em`);
    root.style.setProperty("--editor-padding-x", `${settings.paddingHorizontal}em`);

    // Heading sizes
    root.style.setProperty("--h1-font-size", "1.8em");
    root.style.setProperty("--h2-font-size", "1.4em");
    root.style.setProperty("--h3-font-size", "1.2em");

    // Heading spacing
    root.style.setProperty("--h1-margin-top", `${settings.headingSpacing * 1.2}em`);
    root.style.setProperty("--h1-margin-bottom", "0.6em");
    root.style.setProperty("--h1-padding-bottom", "0.3em");
    root.style.setProperty("--h2-margin-top", `${settings.headingSpacing}em`);
    root.style.setProperty("--h2-margin-bottom", "0.5em");
    root.style.setProperty("--h2-padding-bottom", "0.25em");
    root.style.setProperty("--h3-margin-top", `${settings.headingSpacing * 0.9}em`);
    root.style.setProperty("--h3-margin-bottom", "0.4em");

    // List spacing
    root.style.setProperty("--list-padding-left", "1.3em");
    root.style.setProperty("--list-item-margin", "0.1em");

    // Blockquote
    root.style.setProperty("--blockquote-padding-y", "0.5em");
    root.style.setProperty("--blockquote-padding-x", "1em");
    root.style.setProperty("--blockquote-border-width", "4px");
    root.style.setProperty("--blockquote-radius", "8px");

    // Inline code
    root.style.setProperty("--inline-code-padding-y", "2px");
    root.style.setProperty("--inline-code-padding-x", "6px");
    root.style.setProperty("--inline-code-font-size", "0.9em");
    root.style.setProperty("--inline-code-radius", "4px");

    // Code block
    root.style.setProperty("--code-block-padding-y", "16px");
    root.style.setProperty("--code-block-padding-x", "20px");
    root.style.setProperty("--code-block-margin", "1.2em");
    root.style.setProperty("--code-block-font-size", "0.875em");
    root.style.setProperty("--code-block-radius", "8px");

    // Horizontal rule
    root.style.setProperty("--hr-margin", "2.5em");

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function createSettingsButton(): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = "md-settings-btn";
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>`;
    btn.title = "Settings";
    return btn;
}

function createStepper(
    value: number,
    min: number,
    max: number,
    step: number,
    format: (v: number) => string,
    onChange: (v: number) => void
): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "md-settings-stepper";

    const decreaseBtn = document.createElement("button");
    decreaseBtn.textContent = "−";
    decreaseBtn.type = "button";

    const valueSpan = document.createElement("span");
    valueSpan.textContent = format(value);

    const increaseBtn = document.createElement("button");
    increaseBtn.textContent = "+";
    increaseBtn.type = "button";

    let currentValue = value;

    const update = (newValue: number) => {
        currentValue = Math.max(min, Math.min(max, newValue));
        valueSpan.textContent = format(currentValue);
        onChange(currentValue);
    };

    decreaseBtn.addEventListener("click", () => update(currentValue - step));
    increaseBtn.addEventListener("click", () => update(currentValue + step));

    container.appendChild(decreaseBtn);
    container.appendChild(valueSpan);
    container.appendChild(increaseBtn);

    return container;
}

function createRow(label: string, control: HTMLElement): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "md-settings-row";

    const labelEl = document.createElement("label");
    labelEl.textContent = label;

    row.appendChild(labelEl);
    row.appendChild(control);

    return row;
}

function createThemeToggle(
    currentTheme: EditorSettings["theme"],
    onChange: (theme: EditorSettings["theme"]) => void
): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "md-settings-theme-toggle";

    const themes: EditorSettings["theme"][] = ["light", "dark", "system"];
    const labels = ["Light", "Dark", "Auto"];

    themes.forEach((theme, i) => {
        const btn = document.createElement("button");
        btn.textContent = labels[i] ?? theme;
        btn.type = "button";
        if (theme === currentTheme) btn.classList.add("active");

        btn.addEventListener("click", () => {
            container.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            onChange(theme);
        });

        container.appendChild(btn);
    });

    return container;
}

function createFontSelect(
    currentFont: string,
    onChange: (font: string) => void
): HTMLSelectElement {
    const select = document.createElement("select");

    FONTS.forEach((font) => {
        const option = document.createElement("option");
        option.value = font.value;
        option.textContent = font.label;
        if (font.value === currentFont) option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener("change", () => onChange(select.value));

    return select;
}

function createSettingsPanel(
    settings: EditorSettings,
    onUpdate: (settings: EditorSettings) => void,
    editor: Editor
): HTMLDivElement {
    const isMobile = window.innerWidth <= 768; // looks at window size
    const panel = document.createElement("div");
    panel.className = "md-settings-panel hidden";

    // Header
    const header = document.createElement("div");
    header.className = "md-settings-panel-header";

    const title = document.createElement("h3");
    title.textContent = "Settings";

    const closeBtn = document.createElement("button");
    closeBtn.className = "md-settings-panel-close";
    closeBtn.innerHTML = "✕";
    closeBtn.type = "button";

    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Theme section
    const themeSection = document.createElement("div");
    themeSection.className = "md-settings-section";
    themeSection.appendChild(
        createRow(
            "Theme",
            createThemeToggle(settings.theme, (theme) => {
                settings.theme = theme;
                onUpdate(settings);
            })
        )
    );
    panel.appendChild(themeSection);

    // Typography section
    const typographySection = document.createElement("div");
    typographySection.className = "md-settings-section";

    typographySection.appendChild(
        createRow(
            "Font",
            createFontSelect(settings.fontFamily, (font) => {
                settings.fontFamily = font;
                onUpdate(settings);
            })
        )
    );

    typographySection.appendChild(
        createRow(
            "Size",
            createStepper(settings.fontSize, isMobile ? 8 : 14, 24, 1, (v) => `${v}px`, (v) => {
                settings.fontSize = v;
                onUpdate(settings);
            })
        )
    );

    typographySection.appendChild(
        createRow(
            "Line Height",
            createStepper(settings.lineHeight, isMobile ? 1.2 : 1.4, 2.2, 0.1, (v) => v.toFixed(1), (v) => {
                settings.lineHeight = v;
                onUpdate(settings);
            })
        )
    );

    typographySection.appendChild(
        createRow(
            "Width",
            createStepper(settings.contentWidth, isMobile ? 200 : 400, 1000, 50, (v) => `${v}px`, (v) => {
                settings.contentWidth = v;
                onUpdate(settings);
            })
        )
    );

    typographySection.appendChild(
        createRow(
            "Padding",
            createStepper(settings.paddingHorizontal, isMobile ? 0 : 0, isMobile ? 10 : 100, isMobile ? 1 : 5, (v) => `${v}em`, (v) => {
                settings.paddingHorizontal = v;
                onUpdate(settings);
            })
        )
    );
	    typographySection.appendChild(
        createRow(
            "Top Padding",
            createStepper(settings.paddingTop, 0, isMobile ? 10 : 100, isMobile ? 0.5 : 1, (v) => `${v}em`, (v) => {
                settings.paddingTop = v;
                onUpdate(settings);
            })
        )
    );
    panel.appendChild(typographySection);

    // Spacing section
    const spacingSection = document.createElement("div");
    spacingSection.className = "md-settings-section";

    spacingSection.appendChild(
        createRow(
            "¶ Spacing",
            createStepper(settings.paragraphSpacing, 0.5, 2.0, 0.25, (v) => v.toFixed(2), (v) => {
                settings.paragraphSpacing = v;
                onUpdate(settings);
            })
        )
    );

    spacingSection.appendChild(
        createRow(
            "H Spacing",
            createStepper(settings.headingSpacing, 0.5, 2.0, 0.25, (v) => v.toFixed(2), (v) => {
                settings.headingSpacing = v;
                onUpdate(settings);
            })
        )
    );

    panel.appendChild(spacingSection);

    function parseMarkdown() {
        try {
            // Get current content as markdown
            const markdown = editor.storage.markdown.manager.serialize(editor.getJSON());
            // Clear and re-parse
            const parsed = editor.storage.markdown.manager.parse(markdown);
            editor.commands.setContent(parsed);
        } catch (err) {
            console.error("Reparse failed:", err);
            alert("Failed to reparse content. See console for details.");
        }
    }

    // Actions section
    const actionsSection = document.createElement("div");
    actionsSection.className = "md-settings-section";

    // Reparse as Markdown button
    const reparseBtn = document.createElement("button");
    reparseBtn.className = "md-settings-action-btn";
    reparseBtn.textContent = "Reparse as Markdown";
    reparseBtn.type = "button";
    reparseBtn.title = "Fix paste errors by re-parsing content as markdown";
    reparseBtn.addEventListener("click", () => {
        parseMarkdown()
    });
    actionsSection.appendChild(reparseBtn);

    // add a listener to the window for pasting and wait a second or so and parse it
    // check where the users cursor is and make sure to return it to the same spot

    window.addEventListener("paste", () => {
        const cursorPosition = editor.state.selection.anchor;
        setTimeout(() => {
            parseMarkdown();
            editor.commands.focus(cursorPosition);
        }, 0);
    });

    // Reset button
    const resetBtn = document.createElement("button");
    resetBtn.className = "md-settings-action-btn";
    resetBtn.textContent = "Reset to Defaults";
    resetBtn.type = "button";
    resetBtn.addEventListener("click", () => {
        Object.assign(settings, DEFAULTS);
        onUpdate(settings);
        // Rebuild panel to reflect new values
        panel.replaceWith(
            createSettingsPanel(settings, onUpdate, editor)
        );
    });
    actionsSection.appendChild(resetBtn);

    panel.appendChild(actionsSection);

    // Close button handler
    closeBtn.addEventListener("click", () => {
        panel.classList.add("hidden");
    });

    return panel;
}

export function initSettings(editor: Editor): void {
    let settings = loadSettings();

    // Apply initial settings
    applySettings(settings);

    // Listen for system theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (settings.theme === "system") {
            applySettings(settings);
        }
    });

    // Create and mount UI
    const btn = createSettingsButton();
    const panel = createSettingsPanel(settings, (newSettings) => {
        settings = newSettings;
        applySettings(settings);
    }, editor);

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // Toggle panel on button click
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        panel.classList.toggle("hidden");
    });

    // Close panel when clicking outside
    document.addEventListener("click", (e) => {
        if (!panel.contains(e.target as Node) && !btn.contains(e.target as Node)) {
            panel.classList.add("hidden");
        }
    });
}
