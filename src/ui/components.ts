/**
 * Reusable UI component helpers
 * @module ui/components
 */

import type { StepperConfig } from "../types";

/**
 * Create an HTML element with optional attributes and children
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	options: {
		className?: string;
		attributes?: Record<string, string>;
		innerHTML?: string;
		textContent?: string;
		children?: HTMLElement[];
	} = {}
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);

	if (options.className) {
		el.className = options.className;
	}

	if (options.attributes) {
		for (const [key, value] of Object.entries(options.attributes)) {
			el.setAttribute(key, value);
		}
	}

	if (options.innerHTML) {
		el.innerHTML = options.innerHTML;
	} else if (options.textContent) {
		el.textContent = options.textContent;
	}

	if (options.children) {
		for (const child of options.children) {
			el.appendChild(child);
		}
	}

	return el;
}

/**
 * Create a button element
 */
export function createButton(options: {
	className?: string;
	innerHTML?: string;
	title?: string;
	onClick?: (e: MouseEvent) => void;
}): HTMLButtonElement {
	const btn = createElement("button", {
		className: options.className,
		innerHTML: options.innerHTML,
		attributes: {
			type: "button",
			...(options.title && { title: options.title }),
		},
	});

	if (options.onClick) {
		btn.addEventListener("click", options.onClick);
	}

	return btn;
}

/**
 * Create a stepper control (incremen/decrement buttons with value display)
 */
export function createStepper(config: StepperConfig): HTMLDivElement {
	const { value, min, max, step, format, onChange } = config;
	let currentValue = value;

	const container = createElement("div", { className: "md-settings-stepper" });

	const decreaseBtn = createElement("button", {
		textContent: "−",
		attributes: { type: "button" },
	});

	const valueSpan = createElement("span", {
		textContent: format(currentValue),
	});

	const increaseBtn = createElement("button", {
		textContent: "+",
		attributes: { type: "button" },
	});

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

/**
 * Create a labeled row for settings panels
 */
export function createRow(label: string, control: HTMLElement): HTMLDivElement {
	const row = createElement("div", { className: "md-settings-row" });
	const labelEl = createElement("label", { textContent: label });

	row.appendChild(labelEl);
	row.appendChild(control);

	return row;
}

/**
 * Create a section container for settings panels
 */
export function createSection(className?: string): HTMLDivElement {
	return createElement("div", {
		className: `md-settings-section${className ? ` ${className}` : ""}`,
	});
}

/**
 * Create a select dropdown
 */
export function createSelect<T extends string>(options: {
	values: Array<{ label: string; value: T; }>;
	selected: T;
	onChange: (value: T) => void;
}): HTMLSelectElement {
	const select = createElement("select", {});

	for (const opt of options.values) {
		const option = createElement("option", {
			textContent: opt.label,
			attributes: { value: opt.value },
		});
		if (opt.value === options.selected) {
			option.selected = true;
		}
		select.appendChild(option);
	}

	select.addEventListener("change", () => {
		options.onChange(select.value as T);
	});

	return select;
}

/**
 * Create a toggle button group
 */
export function createToggleGroup<T extends string>(options: {
	values: Array<{ label: string; value: T; }>;
	selected: T;
	onChange: (value: T) => void;
	className?: string;
}): HTMLDivElement {
	const container = createElement("div", {
		className: options.className ?? "md-settings-theme-toggle",
	});

	for (const opt of options.values) {
		const btn = createElement("button", {
			textContent: opt.label,
			attributes: { type: "button" },
		});

		if (opt.value === options.selected) {
			btn.classList.add("active");
		}

		btn.addEventListener("click", () => {
			container.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");
			options.onChange(opt.value);
		});

		container.appendChild(btn);
	}

	return container;
}

// ============================================================================
// Navigation Components
// ============================================================================

export interface NavigablePanelOptions {
	/** Container element to render into */
	container: HTMLElement;
	/** Initial view to show */
	initialView: string;
}

/**
 * Create a navigable panel with slide transitions
 */
export function createNavigablePanel(): {
	container: HTMLDivElement;
	navigate: (viewId: string) => void;
	back: () => void;
	addView: (id: string, buildView: () => HTMLElement) => void;
} {
	const container = createElement("div", { className: "md-nav-container" });
	const viewStack: string[] = [];
	const views: Map<string, () => HTMLElement> = new Map();

	let currentViewId: string | null = null;
	let currentViewEl: HTMLElement | null = null;

	function renderView(viewId: string, direction: "forward" | "back" | "none") {
		const buildView = views.get(viewId);
		if (!buildView) return;

		const newView = buildView();
		newView.classList.add("md-nav-view");

		if (direction !== "none" && currentViewEl) {
			const oldView = currentViewEl;

			// Position old view absolutely so new view can enter
			oldView.classList.add("md-nav-exiting");

			// Set up new view for enter animation
			newView.classList.add(direction === "forward" ? "md-nav-enter-right" : "md-nav-enter-left");
			container.appendChild(newView);

			// Force reflow then animate
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					newView.classList.add("md-nav-animating");
					newView.classList.remove("md-nav-enter-right", "md-nav-enter-left");
					oldView.classList.add(direction === "forward" ? "md-nav-exit-left" : "md-nav-exit-right");
				});
			});

			// Remove old view after animation
			setTimeout(() => {
				oldView.remove();
				newView.classList.remove("md-nav-animating");
			}, 220);
		} else {
			container.innerHTML = "";
			container.appendChild(newView);
		}

		currentViewEl = newView;
		currentViewId = viewId;
	}

	return {
		container,
		addView(id: string, buildView: () => HTMLElement) {
			views.set(id, buildView);
			// Render first view added
			if (!currentViewId) {
				renderView(id, "none");
				viewStack.push(id);
			}
		},
		navigate(viewId: string) {
			if (viewId === currentViewId) return;
			viewStack.push(viewId);
			renderView(viewId, "forward");
		},
		back() {
			if (viewStack.length <= 1) return;
			viewStack.pop();
			const prevViewId = viewStack[viewStack.length - 1];
			if (prevViewId) {
				renderView(prevViewId, "back");
			}
		},
	};
}

/**
 * Create a navigation button (appears as a row that navigates to another view)
 */
export function createNavButton(options: {
	label: string;
	onClick: () => void;
}): HTMLDivElement {
	const row = createElement("div", { className: "md-settings-nav-row" });

	const labelEl = createElement("span", { textContent: options.label });

	const arrow = createElement("span", {
		className: "md-settings-nav-arrow",
		innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
	});

	row.appendChild(labelEl);
	row.appendChild(arrow);

	row.addEventListener("click", options.onClick);

	return row;
}

/**
 * Create a back button for navigation
 */
export function createBackButton(options: {
	label?: string;
	onClick: () => void;
}): HTMLDivElement {
	const btn = createElement("div", { className: "md-settings-back-btn" });

	const arrow = createElement("span", {
		innerHTML: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
	});

	const labelEl = createElement("span", { textContent: options.label ?? "Back" });

	btn.appendChild(arrow);
	btn.appendChild(labelEl);

	btn.addEventListener("click", options.onClick);

	return btn;
}

// ============================================================================
// Color Picker Components
// ============================================================================

/**
 * Create a color picker input with preview
 */
export function createColorPicker(options: {
	value: string;
	onChange: (color: string) => void;
}): HTMLDivElement {
	const container = createElement("div", { className: "md-color-picker" });

	const preview = createElement("div", {
		className: "md-color-preview",
	});
	preview.style.backgroundColor = options.value;

	const input = createElement("input", {
		className: "md-color-input",
		attributes: {
			type: "color",
			value: options.value,
		},
	}) as HTMLInputElement;

	input.addEventListener("input", () => {
		preview.style.backgroundColor = input.value;
		options.onChange(input.value);
	});

	container.appendChild(preview);
	container.appendChild(input);

	return container;
}

/**
 * Create a color row with label and picker
 */
export function createColorRow(options: {
	label: string;
	value: string;
	onChange: (color: string) => void;
}): HTMLDivElement {
	const row = createElement("div", { className: "md-settings-row md-color-row" });

	const labelEl = createElement("label", { textContent: options.label });

	const picker = createColorPicker({
		value: options.value,
		onChange: options.onChange,
	});

	row.appendChild(labelEl);
	row.appendChild(picker);

	return row;
}

/**
 * Create a collapsible color group
 */
export function createColorGroup(options: {
	title: string;
	colors: Array<{
		key: string;
		label: string;
		value: string;
		onChange: (value: string) => void;
	}>;
	initialExpanded?: boolean;
}): HTMLDivElement {
	const group = createElement("div", { className: "md-color-group" });

	const header = createElement("div", { className: "md-color-group-header" });

	const titleEl = createElement("span", { textContent: options.title });

	const chevron = createElement("span", {
		className: "md-color-group-chevron",
		innerHTML: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
	});

	header.appendChild(titleEl);
	header.appendChild(chevron);

	const content = createElement("div", { className: "md-color-group-content" });

	for (const color of options.colors) {
		content.appendChild(
			createColorRow({
				label: color.label,
				value: color.value,
				onChange: color.onChange,
			})
		);
	}

	// Toggle expanded state
	const expanded = options.initialExpanded ?? false;
	if (!expanded) {
		content.classList.add("collapsed");
		chevron.classList.add("collapsed");
	}

	header.addEventListener("click", () => {
		content.classList.toggle("collapsed");
		chevron.classList.toggle("collapsed");
	});

	group.appendChild(header);
	group.appendChild(content);

	return group;
}
