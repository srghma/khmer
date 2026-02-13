import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorageState } from 'ahooks'
import type { DictionaryLanguage } from '../../types'
import { type AnkiDirection } from './types'

export interface AnkiSettingsContextType {
  language: DictionaryLanguage
  setLanguage: (v: DictionaryLanguage | ((prev: DictionaryLanguage | undefined) => DictionaryLanguage)) => void

  direction_en: AnkiDirection
  setDirection_en: (v: AnkiDirection | ((prev: AnkiDirection | undefined) => AnkiDirection)) => void

  direction_ru: AnkiDirection
  setDirection_ru: (v: AnkiDirection | ((prev: AnkiDirection | undefined) => AnkiDirection)) => void

  direction_km: AnkiDirection
  setDirection_km: (v: AnkiDirection | ((prev: AnkiDirection | undefined) => AnkiDirection)) => void

  isAutoFocusAnswerEnabled: boolean
  setIsAutoFocusAnswerEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
}

const AnkiSettingsContext = createContext<AnkiSettingsContextType | undefined>(undefined)

const defaultLanguage = 'km'
const defaultDirection: AnkiDirection = 'GUESSING_KHMER'
const defaultIsAutoFocusAnswerEnabled = true

export const AnkiSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useLocalStorageState<DictionaryLanguage>('srghmakhmerdict__anki_language', {
    defaultValue: defaultLanguage,
  })

  // We explicitly type the generic for useLocalStorageState to ensure type safety with the union type
  const [direction_en, setDirection_en] = useLocalStorageState<AnkiDirection>('srghmakhmerdict__anki_direction_en', {
    defaultValue: defaultDirection,
  })

  const [direction_ru, setDirection_ru] = useLocalStorageState<AnkiDirection>('srghmakhmerdict__anki_direction_ru', {
    defaultValue: defaultDirection,
  })

  const [direction_km, setDirection_km] = useLocalStorageState<AnkiDirection>('srghmakhmerdict__anki_direction_km', {
    defaultValue: defaultDirection,
  })

  const [isAutoFocusAnswerEnabled, setIsAutoFocusAnswerEnabled] = useLocalStorageState<boolean>(
    'srghmakhmerdict__anki_is_autofocus_answer_enabled',
    {
      defaultValue: defaultIsAutoFocusAnswerEnabled,
    },
  )

  const value = useMemo(
    () => ({
      language: language ?? defaultLanguage,
      setLanguage,
      direction_en: direction_en ?? defaultDirection,
      setDirection_en,
      direction_ru: direction_ru ?? defaultDirection,
      setDirection_ru,
      direction_km: direction_km ?? defaultDirection,
      setDirection_km,
      isAutoFocusAnswerEnabled: isAutoFocusAnswerEnabled ?? defaultIsAutoFocusAnswerEnabled,
      setIsAutoFocusAnswerEnabled,
    }),
    [
      language,
      setLanguage,
      direction_en,
      setDirection_en,
      direction_ru,
      setDirection_ru,
      direction_km,
      setDirection_km,
      isAutoFocusAnswerEnabled,
      setIsAutoFocusAnswerEnabled,
    ],
  )

  return <AnkiSettingsContext.Provider value={value}> {children} </AnkiSettingsContext.Provider>
}

export const useAnkiSettings = () => {
  const context = useContext(AnkiSettingsContext)

  if (context === undefined) throw new Error('useAnkiSettings must be used within a AnkiSettingsProvider')

  return context
}
