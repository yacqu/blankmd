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
