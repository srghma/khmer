import {
  type NonEmptyArray,
  Array_toNonEmptyArray_orThrow,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap, ShortDefinitionKm } from '../../db/dict'
import { colorizeHtml } from '../../utils/text-processing/html'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { WordsHidingMode } from '../../providers/SettingsProvider'

import { type FavoriteItem } from '../../db/favorite/item'

export const colorizeHtml_nonEmptyArray = (
  items: NonEmptyArray<NonEmptyStringTrimmed> | undefined,
  colorMode: MaybeColorizationMode,
  km_map: KhmerWordsMap,
  dictionaryMode_lonelyWordShouldBeSpilt: boolean,
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinitionKm | null> | undefined,
  excludeWord: TypedKhmerWord | undefined,
  khmerWordsHidingMode: WordsHidingMode,
  favorites: ReadonlyMap<NonEmptyStringTrimmed, FavoriteItem> | undefined,
): NonEmptyArray<NonEmptyStringTrimmed> | undefined => {
  if (!items) return undefined

  return Array_toNonEmptyArray_orThrow(
    items.map(item =>
      colorizeHtml(
        item,
        colorMode,
        km_map,
        dictionaryMode_lonelyWordShouldBeSpilt,
        shortDefinitions,
        excludeWord,
        khmerWordsHidingMode,
        favorites,
      ),
    ),
  )
}
