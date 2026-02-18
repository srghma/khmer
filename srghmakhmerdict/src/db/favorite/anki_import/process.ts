import { Map_partition } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import {
  type NonEmptyMap,
  Map_toNonEmptyMap_orUndefined,
  NonEmptyMap_keysToSet,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  TheseNamed_factory,
  TheseNamed_map1Async,
  type TheseNamed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/these-named'
import type Database from '@tauri-apps/plugin-sql'
import type { DictionaryLanguage } from '../../../types'
import { bulkInsertFavorites_front_back_html } from '../bulkInsertFavorites_front_back_html'
import { getExistingFavorites } from '../getExistingFavorites'
import { type InAndNotInDbThese } from '../../dict/are_words_in_dict_map'

/**
 * Factories for Named These types
 */
const LanguageImportPart_factory = TheseNamed_factory('imported', 'skipped')

const InAndNotInDbThese_factory = TheseNamed_factory('in_db', 'not_in_db')

/**
 * Talking Type: Represents words that were successfully added vs those already present.
 */
export type LanguageImportPart<K, V> = TheseNamed<'imported', NonEmptyMap<K, V>, 'skipped', NonEmptyMap<K, V>>

/**
 * Talking Type: Represents the full result of an import attempt for a language.
 * FIXED: Changed 'not_found' to 'not_in_db' to match InAndNotInDbThese and the factory.
 */
export type InAndNotInDbThese_MaybeImported<K, V> = TheseNamed<
  'in_db',
  LanguageImportPart<K, V>,
  'not_in_db',
  NonEmptyMap<K, V>
>

export type PartitionedMaps_Split_Imported<V> = {
  en: InAndNotInDbThese_MaybeImported<NonEmptyStringTrimmed, V> | undefined
  km: InAndNotInDbThese_MaybeImported<TypedContainsKhmer, V> | undefined
  ru: InAndNotInDbThese_MaybeImported<NonEmptyStringTrimmed, V> | undefined
}

/**
 * Processes valid dictionary words:
 * 1. Checks Favorites DB.
 * 2. Partitions into new (to import) and existing (to skip).
 * 3. Returns a LanguageImportPart (Imported/Skipped/Both).
 */
export async function processLanguageImport<T extends NonEmptyStringTrimmed, V>(
  userDb: Database,
  lang: DictionaryLanguage,
  itemsInDict: NonEmptyMap<T, V>,
  now: number,
): Promise<LanguageImportPart<T, V>> {
  // Use NonEmptyMap_keysToSet to handle the ReadonlyMap brand correctly
  const existingInFavorites = await getExistingFavorites(userDb, lang, NonEmptyMap_keysToSet(itemsInDict))

  // Map_partition handles ReadonlyMap input but returns mutable Map
  const [skippedRaw, toInsertRaw] = Map_partition(itemsInDict, word => existingInFavorites.has(word))

  const toInsert = Map_toNonEmptyMap_orUndefined(toInsertRaw)
  const skipped = Map_toNonEmptyMap_orUndefined(skippedRaw)

  if (toInsert) {
    // Cast to any for bulk insert if signature is too strict for NonEmptyMap/ReadonlyMap mismatch
    await bulkInsertFavorites_front_back_html(userDb, lang, toInsert as any, now)
  }

  if (toInsert && skipped) return LanguageImportPart_factory.mkBoth(toInsert, skipped)
  if (toInsert) return LanguageImportPart_factory.mk1(toInsert)
  if (skipped) return LanguageImportPart_factory.mk2(skipped)

  throw new Error(`IMPOSSIBLE: Partition of NonEmptyMap resulted in two empty maps\n${new Error().stack}`)
}

export async function processInAndNotInDbResult<K extends NonEmptyStringTrimmed, V>(
  userDb: Database,
  lang: DictionaryLanguage,
  res: InAndNotInDbThese<K, V>,
  now: number,
): Promise<InAndNotInDbThese_MaybeImported<K, V>> {
  return await TheseNamed_map1Async<
    'in_db',
    NonEmptyMap<K, V>,
    'not_in_db',
    NonEmptyMap<K, V>,
    LanguageImportPart<K, V>
  >(
    res,
    InAndNotInDbThese_factory, // Pass the factory object directly
    itemsInDict => processLanguageImport(userDb, lang, itemsInDict, now),
  )
}
