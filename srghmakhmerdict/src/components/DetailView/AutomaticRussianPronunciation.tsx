import { memo, useMemo, useRef } from 'react'
import { Chip } from '@heroui/chip'

// Logic Imports
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { type TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { KhmerWordsMapValue } from '../../db/dict/types'
import { Map_filterKeys } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import { Set_mapToArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/sets'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useSettings } from '../../providers/SettingsProvider'
import { colorizeText } from '../../utils/text-processing/text'
import { calculateKhmerAndNonKhmerContentStyles, useKhmerAndNonKhmerClickListener } from '../../hooks/useKhmerLinks'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface RussianPronunciationProps {
  khmerText: TypedContainsKhmer
  onWordClick: ((word: TypedKhmerWord) => void) | undefined
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
  isKhmerPronunciationHidingEnabled: boolean
  km_map_value: KhmerWordsMapValue
}

const MatchingKhmerWord = memo(function MatchingKhmerWord({ colorizedHtml }: { colorizedHtml: string }) {
  return <li dangerouslySetInnerHTML={{ __html: colorizedHtml }} />
})

interface SectionProps {
  language: 'RU' | 'EN'
  transliteration: string
  colorizedWords: { word: NonEmptyStringTrimmed; colorizedHtml: string }[] | undefined
  khmerContentClass: string
  // Pass click-related props down to handle hooks internally
  onWordClick: ((word: TypedKhmerWord) => void) | undefined
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
  isKhmerPronunciationHidingEnabled: boolean
}

const Section = memo(function Section({
  language,
  transliteration,
  colorizedWords,
  khmerContentClass,
  onWordClick,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
  isKhmerPronunciationHidingEnabled,
}: SectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Every section handles its own click listener for its own list ref
  useKhmerAndNonKhmerClickListener(
    ref,
    onWordClick,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  if (!transliteration) return null

  return (
    <div ref={ref} className={`flex flex-col gap-1.5 ${khmerContentClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-tiny font-bold text-default-400 uppercase tracking-tighter">
          {language} Pronunciation:
        </span>
        <Chip
          className="font-serif italic border-none bg-warning/10 khmer--ipa"
          color="warning"
          size="sm"
          variant="dot"
        >
          {transliteration}
        </Chip>
      </div>

      {colorizedWords && colorizedWords.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-2 pl-2 border-l-2 border-default-100">
          <span className="text-xs font-bold text-default-400 uppercase tracking-tighter">Sounds like:</span>
          <ul className={`flex flex-wrap items-center gap-x-3 gap-y-1 list-none p-0 m-0`}>
            {colorizedWords.map(({ word, colorizedHtml }) => (
              <MatchingKhmerWord key={word} colorizedHtml={colorizedHtml} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})

export const AutomaticRussianPronunciation = memo(function AutomaticRussianPronunciation({
  isKhmerPronunciationHidingEnabled,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
  khmerText,
  km_map_value,
  onWordClick,
}: RussianPronunciationProps) {
  const { maybeColorMode } = useSettings()
  const { km_map } = useDictionary()

  // 1. Find and Colorize Russian sounding words
  const colorizedWords_ru = useMemo(() => {
    const target = km_map_value.ru_translit

    if (!target) return undefined

    const matches = Map_filterKeys(km_map, (word, v: KhmerWordsMapValue) => {
      return word !== khmerText && v.ru_translit === target
    })

    if (matches.size === 0) return undefined

    return Set_mapToArray(matches, word => ({
      colorizedHtml: colorizeText(word, maybeColorMode, km_map, false),
      word,
    }))
  }, [km_map_value.ru_translit, km_map, khmerText, maybeColorMode])

  // 2. Find and Colorize English sounding words
  const colorizedWords_en = useMemo(() => {
    const target = km_map_value.en_translit

    if (!target) return undefined

    const matches = Map_filterKeys(km_map, (word, v: KhmerWordsMapValue) => {
      if (word === khmerText) return false
      // Deduplicate: If it's already in the RU list, skip it here
      const hasRuMatch = km_map_value.ru_translit && v.ru_translit === km_map_value.ru_translit

      return !hasRuMatch && v.en_translit === target
    })

    if (matches.size === 0) return undefined

    return Set_mapToArray(matches, word => ({
      colorizedHtml: colorizeText(word, maybeColorMode, km_map, false),
      word,
    }))
  }, [km_map_value.en_translit, km_map_value.ru_translit, km_map, khmerText, maybeColorMode])

  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    !!onWordClick,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  if (!km_map_value.ru_translit && !km_map_value.en_translit) return null

  // Helper to pass down standard props
  const sharedProps = {
    onWordClick,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
    khmerContentClass,
  }

  return (
    <div className="mt-3 flex flex-col gap-4 border-t-1 border-default-100 pt-2">
      {km_map_value.ru_translit && (
        <Section
          {...sharedProps}
          colorizedWords={colorizedWords_ru}
          language="RU"
          transliteration={km_map_value.ru_translit}
        />
      )}

      {km_map_value.en_translit && (
        <Section
          {...sharedProps}
          colorizedWords={colorizedWords_en}
          language="EN"
          transliteration={km_map_value.en_translit}
        />
      )}
    </div>
  )
})
