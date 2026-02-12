import { useCallback, useMemo } from 'react'
import { useAnkiSettings } from './useAnkiSettings'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import type { AnkiDirection } from './types'

/**
 * A derived hook that abstracts away the language-specific direction settings.
 * Returns the direction for the current language and a unified setter.
 */
export function useAnkiCurrentDirection() {
  const { language, direction_en, setDirection_en, direction_ru, setDirection_ru, direction_km, setDirection_km } =
    useAnkiSettings()

  const currentLanguage_direction = useMemo(() => {
    switch (language) {
      case 'en':
        return direction_en
      case 'ru':
        return direction_ru
      case 'km':
        return direction_km
      default:
        return assertNever(language)
    }
  }, [language, direction_en, direction_ru, direction_km])

  const currentLanguage_setDirection = useCallback(
    (d: AnkiDirection) => {
      switch (language) {
        case 'en':
          setDirection_en(d)
          break
        case 'ru':
          setDirection_ru(d)
          break
        case 'km':
          setDirection_km(d)
          break
        default:
          assertNever(language)
      }
    },
    [language, setDirection_en, setDirection_ru, setDirection_km],
  )

  return [currentLanguage_direction, currentLanguage_setDirection] as const
}
