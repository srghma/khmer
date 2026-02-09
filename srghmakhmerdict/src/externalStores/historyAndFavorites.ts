import { createExternalStore } from '../utils/createExternalStore'
import type { HistoryItem } from '../db/history'
import type { FavoriteItem } from '../db/favorite/favorite-item'

// We store the full Map to sync between the detail view and the favorites list
// type Store = NonEmptyMap<NonEmptyStringTrimmed, DictionaryLanguage> | undefined
export const favoritesStore = createExternalStore<FavoriteItem[]>(
  [],
  // (x, y) => x === y,
)

export const historyStore = createExternalStore<HistoryItem[]>(
  [],
  // (x, y) => x === y,
)
