// frontend/tinylib/bind.ts - Ultra-minimal data binding library

// --- Type Definitions for Clarity ---
type BindableElement = Element & { textContent: string | null; value?: string; };
type BoundData = Record<string, any>;
type ListenerCallback = (newValue: any, oldValue: any, property: string) => void;

// --- Global State ---
const bindings = new Map<string, BindableElement[]>();
const listeners = new Map<string, ListenerCallback[]>();

// --- Main Binding Function ---
function bind(target: string | Element | NodeListOf<Element>, data: BoundData = {}): BoundData {
    const elements = typeof target === 'string'
        ? document.querySelectorAll(target)
        : 'length' in target ? target : [target];

    const boundData = new Proxy(data, {
        set(obj, prop, value) {
            const oldValue = obj[prop as string];
            obj[prop as string] = value;

            const boundElements = bindings.get(prop as string) || [];
            boundElements.forEach(el => {
                const isInput = (el.nodeName === 'INPUT' || el.nodeName === 'TEXTAREA' || el.nodeName === 'SELECT');
                const propToUpdate = isInput ? 'value' : 'textContent';
                if (el[propToUpdate] !== value) {
                    el[propToUpdate] = value;
                }
            });

            const propListeners = listeners.get(prop as string) || [];
            propListeners.forEach(fn => fn(value, oldValue, prop as string));
            return true;
        }
    });

    Array.from(elements).forEach(el => {
        const key = (el as HTMLElement).dataset.bind || el.id || 'content';
        if (!key) return;

        const bindableEl = el as BindableElement;
        const isInput = (bindableEl.nodeName === 'INPUT' || bindableEl.nodeName === 'TEXTAREA' || bindableEl.nodeName === 'SELECT');
        const propToRead = isInput ? 'value' : 'textContent';

        if (!(key in boundData)) {
            boundData[key] = bindableEl[propToRead];
        } else {
            bindableEl[propToRead] = boundData[key];
        }

        if (!bindings.has(key)) bindings.set(key, []);
        bindings.get(key)!.push(bindableEl);

        bindableEl.addEventListener('input', () => {
            boundData[key] = (bindableEl as any)[propToRead];
        });
    });

    return boundData;
}

// --- Helper Methods ---
bind.one = (selector: string | Element, key: string, initialValue?: any) => {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return null;
    const data: BoundData = {};
    if (initialValue !== undefined) data[key] = initialValue;
    return bind(el, data);
};

bind.all = (container: Element | Document = document, data: BoundData = {}) => {
    const selector = '[data-bind], [contenteditable]';
    const elements = container.querySelectorAll(selector);
    return bind(elements, data);
};

bind.on = (property: string, callback: ListenerCallback) => {
    if (!listeners.has(property)) listeners.set(property, []);
    listeners.get(property)!.push(callback);

    return () => { // Return an unsubscribe function
        const propListeners = listeners.get(property);
        if (!propListeners) return;
        const index = propListeners.indexOf(callback);
        if (index > -1) propListeners.splice(index, 1);
    };
};

// --- Modern ES Module Export ---
export { bind };