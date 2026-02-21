import { useMemo } from 'react'
import type { WordDetailEnOrRuOrKm } from '../db/dict/types'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { generateTextSegments, yieldUniqueKhmerWords } from '../utils/text-processing/text'
import { Set_toNonEmptySet_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useKhmerDefinitions } from './useKhmerDefinitions'
import { useDictionary } from '../providers/DictionaryProvider'
import { useSettings } from '../providers/SettingsProvider'

export const useShortDefinitionsByExtractingFromHtml = (data: WordDetailEnOrRuOrKm) => {
  const { isShowShortDetailAboutKhmerWordEnabled, maybeColorMode } = useSettings()
  const { km_map } = useDictionary()

  const uniqueKhmerWordsInDetails = useMemo(() => {
    if (!isShowShortDetailAboutKhmerWordEnabled) return undefined

    const words = new Set<TypedKhmerWord>()
    const allHtml = [
      data.desc,
      data.en_km_com,
      data.from_csv_raw_html,
      data.from_chuon_nath,
      data.from_chuon_nath_translated,
      data.from_russian_wiki,
      data.gorgoniev,
      data.wiktionary,
      ...(data.from_csv_variants ?? []),
      ...(data.from_csv_noun_forms ?? []),
    ] as (string | undefined)[]

    allHtml.forEach(html => {
      if (!html) return
      const trimmedHtml = String_toNonEmptyString_orUndefined_afterTrim(html)

      if (!trimmedHtml) return
      const text = String_toNonEmptyString_orUndefined_afterTrim(trimmedHtml.replace(/<[^>]*>/g, ' '))

      if (!text) return
      const segments = generateTextSegments(text, maybeColorMode, km_map, false)

      for (const w of yieldUniqueKhmerWords(segments)) {
        words.add(w)
      }
    })

    return Set_toNonEmptySet_orUndefined(words)
  }, [data, isShowShortDetailAboutKhmerWordEnabled, km_map, maybeColorMode])

  const shortDefinitionsResult = useKhmerDefinitions(uniqueKhmerWordsInDetails)

  return useMemo(() => {
    return shortDefinitionsResult.t === 'success' ? shortDefinitionsResult.definitions : undefined
  }, [shortDefinitionsResult])
}
