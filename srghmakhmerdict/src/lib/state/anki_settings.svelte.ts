import { browser } from '$app/environment';

function createLocalStorageState<T>(key: string, defaultValue: T) {
    let initialValue = defaultValue;
    if (browser) {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
            try {
                initialValue = JSON.parse(stored);
            } catch (e) {
                console.error(`Failed to parse local storage key "${key}":`, e);
            }
        }
    }

    let state = $state(initialValue);

    $effect(() => {
        if (browser) {
            localStorage.setItem(key, JSON.stringify(state));
        }
    });

    return {
        get value() { return state; },
        set value(v) { state = v; }
    };
}

export const ankiSettings = {
    language: createLocalStorageState('srghmakhmerdict__anki_language', 'km'),
    direction_en: createLocalStorageState('srghmakhmerdict__anki_direction_en', 'GUESSING_KHMER'),
    direction_ru: createLocalStorageState('srghmakhmerdict__anki_direction_ru', 'GUESSING_KHMER'),
    direction_km: createLocalStorageState('srghmakhmerdict__anki_direction_km', 'GUESSING_KHMER'),
    isAutoFocusAnswerEnabled: createLocalStorageState('srghmakhmerdict__anki_is_autofocus_answer_enabled', true),
};
