import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import React, { memo } from 'react'
import type { KhmerWordsMap, ShortDefinitionKm } from '../../db/dict/index'
import type { TextSegment } from '../../utils/text-processing/text'
import type { TextSegmentEnhanced } from '../../utils/text-processing/text-enhanced'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { KhmerWordUnit } from './KhmerWordUnit'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyString } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string'
import { useDictionary } from '../../providers/DictionaryProvider'
import { isWordInKmMap } from '../../utils/isWordInKmMap'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import { useSettings } from '../../providers/SettingsProvider'
import { calculateKhmerAndNonKhmerContentStyles, useKhmerAndNonKhmerClickListener } from '../../hooks/useKhmerLinks'
import { useFavorites } from '../../providers/FavoritesProvider'
import { getFavoriteStatus, type FavoriteStatus } from '../../utils/favorite-status'

const NotKhmerPart = memo(({ text }: { text: NonEmptyString }) => (
  <span className="align-top mt-1 inline-block text-foreground/80">{text}</span>
))

NotKhmerPart.displayName = 'NotKhmerPart'

interface KhmerWordPartProps {
  item: TypedKhmerWord | { w: TypedKhmerWord; def?: NonEmptyStringTrimmed; wiktionaryIpa?: NonEmptyStringTrimmed }
  colorIndex: number
  km_map: KhmerWordsMap
  maybeColorMode: MaybeColorizationMode
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinitionKm | null> | undefined
  onWordClick: ((v: TypedKhmerWord) => void) | undefined
  wordIndex: number
  ankiStatus?: FavoriteStatus
}

const KhmerWordPart = memo(function KhmerWordPart({
  item,
  colorIndex,
  km_map,
  maybeColorMode,
  shortDefinitions,
  onWordClick,
  wordIndex,
  ankiStatus,
}: KhmerWordPartProps) {
  // Resolve item structure
  const isObj = typeof item === 'object'
  const w = isObj ? item.w : item
  const def = isObj ? item.def : undefined
  const wiktionaryIpa = isObj ? item.wiktionaryIpa : undefined

  // Memoize the colorization logic
  const colorization = React.useMemo(() => {
    if (maybeColorMode === 'none') return 'none'

    return isWordInKmMap(w, km_map) ? 'isKnown' : 'isNotKnown'
  }, [maybeColorMode, km_map, w])

  // Stable click handler
  const handleClick = React.useMemo(
    () =>
      onWordClick
        ? () => {
            onWordClick(w)
          }
        : undefined,
    [onWordClick, w],
  )

  return (
    <KhmerWordUnit
      ankiStatus={ankiStatus}
      colorIndex={colorIndex}
      colorization={colorization}
      definitionHtml={def}
      shortDefinition={shortDefinitions?.[w]}
      wiktionaryIpa={wiktionaryIpa}
      word={w}
      wordIndex={wordIndex}
      onClick={handleClick}
    />
  )
})

KhmerWordPart.displayName = 'KhmerWordPart'

// --- Main Component ---

interface SegmentationPreviewProps {
  segments: NonEmptyArray<TextSegment | TextSegmentEnhanced>
  onKhmerWordClick: ((v: TypedKhmerWord) => void) | undefined
  maybeColorMode: MaybeColorizationMode
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinitionKm | null> | undefined
  isShowShortDetailAboutKhmerWordEnabled: boolean
}

export const SegmentationPreview: React.FC<SegmentationPreviewProps> = memo(
  ({ isShowShortDetailAboutKhmerWordEnabled, maybeColorMode, onKhmerWordClick, segments, shortDefinitions }) => {
    const { km_map } = useDictionary()
    const { favoritesMap } = useFavorites()
    const { khmerWordsHidingMode, nonKhmerWordsHidingMode } = useSettings()
    let globalWordIndex = 0

    const containerRef = React.useRef<HTMLDivElement>(null)

    useKhmerAndNonKhmerClickListener(
      containerRef,
      onKhmerWordClick,
      khmerWordsHidingMode,
      nonKhmerWordsHidingMode,
      false, // isKhmerPronunciationHidingEnabled
    )

    const srghma_khmer_dict_content_styles = calculateKhmerAndNonKhmerContentStyles(
      !!onKhmerWordClick,
      khmerWordsHidingMode,
      nonKhmerWordsHidingMode,
      false, // isKhmerPronunciationHidingEnabled
      isShowShortDetailAboutKhmerWordEnabled,
    )

    return (
      <div
        ref={containerRef}
        className={`rounded-medium px-3 py-4 text-medium leading-relaxed break-words whitespace-pre-wrap min-h-[100px] ${srghma_khmer_dict_content_styles}`}
      >
        {segments.map((seg, i) => {
          // 1. Handle Whitespace: Render as raw text to preserve pre-wrap behavior
          if (seg.t === 'whitespace') return seg.v

          // 2. Handle non-Khmer text: Render using the NotKhmerPart component
          if (seg.t === 'notKhmer') return <NotKhmerPart key={`nk-${i}`} text={seg.v} />

          // 3. Handle Khmer blocks: Map through segmented words
          return seg.words.map((item, j) => {
            const currentIdx = globalWordIndex++
            const w = typeof item === 'object' ? item.w : item

            return (
              <KhmerWordPart
                key={`k-${i}-${j}`}
                ankiStatus={getFavoriteStatus(favoritesMap, w)}
                colorIndex={currentIdx}
                item={item}
                km_map={km_map}
                maybeColorMode={maybeColorMode}
                shortDefinitions={isShowShortDetailAboutKhmerWordEnabled ? shortDefinitions : undefined}
                wordIndex={currentIdx}
                onWordClick={onKhmerWordClick}
              />
            )
          })
        })}
      </div>
    )
  },
)

SegmentationPreview.displayName = 'SegmentationPreview'
