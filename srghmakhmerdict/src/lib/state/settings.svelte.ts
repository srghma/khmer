import { browser } from '$app/environment';
function createLocalStorageState<T>(key: string, defaultValue: T) {
    let initialValue = defaultValue;
    if (browser) {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
            try { initialValue = JSON.parse(stored); } catch (e) { console.error(e); }
        }
    }
    let state = $state(initialValue);
    $effect(() => { if (browser) localStorage.setItem(key, JSON.stringify(state)); });
    return { get value() { return state; }, set value(v) { state = v; } };
}
export const settings = {
    searchMode: createLocalStorageState('srghmakhmerdict__search_mode_v2', 'starts_with'),
    searchInContent: createLocalStorageState('srghmakhmerdict__search_in_content', false),
    highlightInList: createLocalStorageState('srghmakhmerdict__highlight_in_list', true),
    highlightInDetails: createLocalStorageState('srghmakhmerdict__highlight_in_details', true),
    scaling_ui: createLocalStorageState('srghmakhmerdict__ui_scaling', 100),
    scaling_details: createLocalStorageState('srghmakhmerdict__details_scaling', 100),
    maybeColorMode: createLocalStorageState('srghmakhmerdict__maybe_color_mode', 'light'),
};
