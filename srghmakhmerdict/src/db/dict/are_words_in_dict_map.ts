import { Map_intersectionWithArray_vennDiagram } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import {
  Map_toNonEmptyMap_orUndefined,
  NonEmptyMap_keysToSet,
  type NonEmptyMap,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-map'
import { areWordsInDict, type InAndNotInDb } from './are_words_in_dict'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import {
  TheseNamed_factory,
  type TheseNamed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/these-named'

export type PartitionedMaps<V> = {
  en: NonEmptyMap<NonEmptyStringTrimmed, V> | undefined
  km: NonEmptyMap<TypedContainsKhmer, V> | undefined
  ru: NonEmptyMap<NonEmptyStringTrimmed, V> | undefined
}

/**
 * We alias the generic These type to be more descriptive for our domain.
 * This = InDb, That = NotInDb
 */
export type InAndNotInDbThese<K, V> = TheseNamed<'in_db', NonEmptyMap<K, V>, 'not_in_db', NonEmptyMap<K, V>>

export const {
  mk1: InAndNotInDbThese_inDb,
  mk2: InAndNotInDbThese_notInDb,
  mkBoth: InAndNotInDbThese_both,
} = TheseNamed_factory('in_db', 'not_in_db')

export type PartitionedMaps_Split<V> = {
  en: InAndNotInDbThese<NonEmptyStringTrimmed, V> | undefined
  km: InAndNotInDbThese<TypedContainsKhmer, V> | undefined
  ru: InAndNotInDbThese<NonEmptyStringTrimmed, V> | undefined
}

/**
 * Helper to transform the Backend Array-based result back into Map-based results
 * by sub-selecting keys from the original source map.
 */
function hydrateInAndNotInDb<K, V>(
  sourceMap: NonEmptyMap<K, V> | undefined,
  backendRes: InAndNotInDb<K> | undefined,
): InAndNotInDbThese<K, V> | undefined {
  if (sourceMap === undefined || backendRes === undefined) return undefined

  const hydrate = (words: readonly K[] | undefined): NonEmptyMap<K, V> | undefined => {
    if (words === undefined) return undefined

    // [, intersected, missingKeys]
    const [, intersected, missingKeys] = Map_intersectionWithArray_vennDiagram(sourceMap, words)

    if (missingKeys.length > 0) {
      throw new Error(`IMPOSSIBLE: Backend returned words missing from source map: ${missingKeys.join(', ')}`)
    }

    return Map_toNonEmptyMap_orUndefined(intersected)
  }

  const inDbMap = hydrate(backendRes.inDb)
  const notInDbMap = hydrate(backendRes.notInDb)

  // Use the These constructors to enforce that at least one side is present
  if (inDbMap && notInDbMap) return InAndNotInDbThese_both(inDbMap, notInDbMap)
  if (inDbMap) return InAndNotInDbThese_inDb(inDbMap)
  if (notInDbMap) return InAndNotInDbThese_notInDb(notInDbMap)

  throw new Error('IMPOSSIBLE: Hydration resulted in neither inDb nor notInDb being populated')
}

export async function areWordsInDict_map<V>(map: PartitionedMaps<V>): Promise<PartitionedMaps_Split<V>> {
  // 1. Convert Maps to Sets for the backend call
  const areInDb = await areWordsInDict({
    en: map.en ? NonEmptyMap_keysToSet(map.en) : undefined,
    ru: map.ru ? NonEmptyMap_keysToSet(map.ru) : undefined,
    km: map.km ? NonEmptyMap_keysToSet(map.km) : undefined,
  })

  // 2. Hydrate the backend response back into partitioned These types
  return {
    en: hydrateInAndNotInDb(map.en, areInDb.en),
    ru: hydrateInAndNotInDb(map.ru, areInDb.ru),
    km: hydrateInAndNotInDb(map.km, areInDb.km),
  }
}
