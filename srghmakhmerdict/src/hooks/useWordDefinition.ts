import { useEffect, useState } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { getWordDetailByMode, type LanguageToDetailMap } from '../db/dict'
import type { DictionaryLanguage } from '../types'
import { useAppToast } from '../providers/ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'

export const WordDefinition_loading = { t: 'loading' } as const
export const WordDefinition_notFound = { t: 'not_found' } as const

export type WordDefinitionResult<L extends DictionaryLanguage> =
  | typeof WordDefinition_loading
  | typeof WordDefinition_notFound
  | { t: 'ready'; detail: LanguageToDetailMap[L] }

export function useWordDefinition<L extends DictionaryLanguage>(
  word: NonEmptyStringTrimmed,
  language: L,
): WordDefinitionResult<L> {
  const toast = useAppToast()
  const [result, setResult] = useState<WordDefinitionResult<L>>(WordDefinition_loading)

  useEffect(() => {
    let active = true

    const fetchDef = async () => {
      setResult(WordDefinition_loading)

      try {
        const detail = await getWordDetailByMode(language, word, false)

        if (active) {
          if (detail) {
            // We cast the result because getWordDetailByMode usually returns a broad union,
            // but we know based on 'language' it corresponds to LanguageToDetailMap[L].
            setResult({ t: 'ready', detail })
          } else {
            setResult(WordDefinition_notFound)
          }
        }
      } catch (e) {
        toast.error('Unexpected error' as NonEmptyStringTrimmed, unknown_to_errorMessage(e))
        if (active) setResult(WordDefinition_notFound)
      }
    }

    fetchDef()

    return () => {
      active = false
    }
  }, [word, language])

  return result
}
