import { memo, useMemo, useRef } from 'react'
import { Chip } from '@heroui/chip'

// Logic Imports
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { KhmerWordsMapValue } from '../../db/dict/types'
import { khmerToRussian } from '../../../../gemini-ocr-automate-images-upload-chrome-extension/src/utils/khmerToRussian'
import { Map_filterKeys } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/map'
import { Set_mapToArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/sets'
import { useDictionary } from '../../providers/DictionaryProvider'
import { useSettings } from '../../providers/SettingsProvider'
import { colorizeText } from '../../utils/text-processing/text'
import { calculateKhmerAndNonKhmerContentStyles, useKhmerAndNonKhmerClickListener } from '../../hooks/useKhmerLinks'

// --- New Component: AutomaticRussianPronunciation ---
interface RussianPronunciationProps {
  khmerText: TypedContainsKhmer
  onWordClick: ((word: TypedKhmerWord) => void) | undefined
  isKhmerWordsHidingEnabled: boolean
  isNonKhmerWordsHidingEnabled: boolean
  isKhmerPronunciationHidingEnabled: boolean
}

const MatchingKhmerWord = memo(function MatchingKhmerWord({ colorizedHtml }: { colorizedHtml: string }) {
  return (
    <li
      dangerouslySetInnerHTML={{ __html: colorizedHtml }}
    />
  )
})

export const AutomaticRussianPronunciation = memo(function AutomaticRussianPronunciation({
  isKhmerPronunciationHidingEnabled,
  isKhmerWordsHidingEnabled,
  isNonKhmerWordsHidingEnabled,
  khmerText,
  onWordClick,
}: RussianPronunciationProps) {
  const { km_map } = useDictionary()
  const { maybeColorMode } = useSettings()
  const listRef = useRef<HTMLUListElement>(null)

  const ruPronunciation = useMemo(() => khmerToRussian(khmerText), [khmerText])

  // Find other Khmer words that produce the exact same Russian pronunciation string
  const sameSoundingWords = useMemo(() => {
    const khmerWordsWithSamePronunciation = Map_filterKeys(
      km_map,
      (word, v: KhmerWordsMapValue) => v.ru_translit === ruPronunciation && word !== khmerText,
    )

    // Filter dictionary for same pronunciation, excluding the current word itself
    return khmerWordsWithSamePronunciation
  }, [ruPronunciation, km_map])

  // Colorize each word
  const colorizedWords = useMemo(() => {
    return Set_mapToArray(sameSoundingWords, word => ({
      colorizedHtml: colorizeText(word, maybeColorMode, km_map),
      word,
    }))
  }, [sameSoundingWords, maybeColorMode, km_map])

  const khmerContentClass = calculateKhmerAndNonKhmerContentStyles(
    !!onWordClick,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  useKhmerAndNonKhmerClickListener(
    listRef,
    onWordClick,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isKhmerPronunciationHidingEnabled,
  )

  if (!ruPronunciation) return null

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-tiny font-bold text-default-400 uppercase tracking-tighter">RU Pronunciation:</span>
        <Chip
          className="font-serif italic border-none bg-warning/10 khmer--ipa"
          color="warning"
          size="sm"
          variant="dot"
        >
          {ruPronunciation}
        </Chip>
      </div>

      {colorizedWords.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-tiny font-bold text-default-400 uppercase tracking-tighter">
            Sounds like:
          </span>
          <ul
            ref={listRef}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 list-none p-0 m-0 ${khmerContentClass}`}
          >
            {colorizedWords.map(({ word, colorizedHtml }) => (
              <MatchingKhmerWord key={word} colorizedHtml={colorizedHtml} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
})
