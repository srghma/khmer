import { settings } from './settings.svelte';
import { dictionary } from './dictionary.svelte';
import { browser } from '$app/environment';
import type { DictionaryLanguage, AppTab } from '../types';
import * as DictDb from '../db/dict/search';
import { String_toNonEmptyString_orUndefined_afterTrim } from '../utils/non-empty-string-trimmed';

class SearchState {
    query = $state<string>('');
    activeTab = $state<AppTab>('en');
    isSearching = $state(false);
    resultData = $state<any>(undefined);
    contentMatches = $state<string[]>([]);
    dictMatchCount = $state(0);
    constructor() {
        $effect(() => {
            const q = this.query;
            const tab = this.activeTab;
            this.performSearch();
        });
    }
    async performSearch() {
        if (!browser || !dictionary.data) return;
        const q = String_toNonEmptyString_orUndefined_afterTrim(this.query);
        if (!q) {
            this.resultData = undefined;
            this.contentMatches = [];
            this.dictMatchCount = 0;
            return;
        }
        this.isSearching = true;
        try {
            let source: Iterable<string> = [];
            if (this.activeTab === 'en') source = dictionary.data.en;
            else if (this.activeTab === 'ru') source = dictionary.data.ru;
            else if (this.activeTab === 'km') source = dictionary.data.km_map.keys();
            else { this.resultData = []; this.dictMatchCount = 0; return; }
            const filtered = [];
            let count = 0;
            const lowerQ = q.toLowerCase();
            for (const word of source) {
                if (word.toLowerCase().startsWith(lowerQ)) {
                    if (count < 1000) filtered.push(word);
                    count++;
                }
            }
            this.dictMatchCount = count;
            this.resultData = filtered;
        } catch (e) { console.error('Search failed', e); } finally { this.isSearching = false; }
    }
    get totalCount() { return this.dictMatchCount + this.contentMatches.length; }
}
export const search = new SearchState();
