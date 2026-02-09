import { useEffect, useState } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type WordDetailEnOrRuOrKm, getWordDetailByMode } from '../../db/dict'
import type { DictionaryLanguage } from '../../types'

const DefinitionResult_loading = { t: 'loading' } as const

export type DefinitionResult =
  | typeof DefinitionResult_loading
  | { t: 'ready'; detail: WordDetailEnOrRuOrKm | undefined } // undefined if not found in dict

export function useAnkiDefinition(word: NonEmptyStringTrimmed, language: DictionaryLanguage): DefinitionResult {
  const [result, setResult] = useState<DefinitionResult>(DefinitionResult_loading)

  useEffect(() => {
    let active = true

    const fetchDef = async () => {
      setResult(DefinitionResult_loading)

      // getWordDetailByMode handles km/en/ru routing internally
      const detail = await getWordDetailByMode(language, word, false)

      if (active) setResult({ t: 'ready', detail })
    }

    fetchDef()

    return () => {
      active = false
    }
  }, [word, language])

  return result
}
