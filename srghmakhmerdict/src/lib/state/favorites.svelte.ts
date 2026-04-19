import { getFavorites as getFavoritesDb, type FavoriteItem } from '../db/favorite';
import type { NonEmptyStringTrimmed } from '../utils/non-empty-string-trimmed';
import type { DictionaryLanguage } from '../types';

class FavoritesState {
    #items = $state<FavoriteItem[]>([]);
    constructor() { this.load(); }
    get items() { return this.#items; }
    async load() { this.#items = await getFavoritesDb(); }
    async toggle(word: NonEmptyStringTrimmed, language: DictionaryLanguage) {
        // Implement toggle
    }
    isFavorite(word: NonEmptyStringTrimmed, language: DictionaryLanguage) {
        return this.#items.some(item => item.word === word && item.language === language);
    }
}
export const favorites = new FavoritesState();
