import { initializeDictionaryData, type DictData } from '../initDictionary';
class DictionaryState {
    #data = $state<DictData | undefined>(undefined);
    #loading = $state(true);
    #error = $state<string | undefined>(undefined);
    constructor() { this.init(); }
    get data() { return this.#data; }
    get loading() { return this.#loading; }
    get error() { return this.#error; }
    async init() {
        try {
            const getDataPromise = await initializeDictionaryData();
            this.#data = await getDataPromise();
        } catch (e) { this.#error = String(e); } finally { this.#loading = false; }
    }
}
export const dictionary = new DictionaryState();
