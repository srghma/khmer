import React, { useMemo, useRef } from 'react'
import { useShortDefinitionPopover } from '../../providers/ShortDefinitionPopoverProvider'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { getKhmerWordCssClass } from '../../utils/text-processing/word-renderer'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import styles_srghma_khmer_dict_content from '../../srghma_khmer_dict_content.module.css'
import { useI18nContext } from '../../i18n/i18n-react-custom'
// Import the TTS hook
import { useGoogleOrNativeTts } from '../../hooks/useGoogleOrNativeTts'

import type { ShortDefinitionKm } from '../../db/dict'
import { useSettings } from '../../providers/SettingsProvider'
import { getBestDefinitionEnOrRuFromKm_fromShort_onlyWithoutHtml } from '../../utils/WordDetailKm_WithoutHtml'
import { getBestDefinitionEnOrRuFromKm_fromShort } from '../../utils/WordDetailKm_WithoutKhmerAndHtml'

import { type FavoriteStatus } from '../../utils/favorite-status'

interface KhmerWordUnitProps {
  colorIndex: number
  colorization: 'none' | 'isKnown' | 'isNotKnown'
  definitionHtml: NonEmptyStringTrimmed | undefined
  shortDefinition: ShortDefinitionKm | null | undefined
  onClick: (() => void) | undefined
  wiktionaryIpa: NonEmptyStringTrimmed | undefined
  word: TypedKhmerWord
  wordIndex: number
  ankiStatus?: FavoriteStatus
}

export const KhmerWordUnit = React.memo(function KhmerWordUnit({
  colorIndex,
  colorization,
  definitionHtml,
  shortDefinition,
  onClick,
  wiktionaryIpa,
  word,
  wordIndex,
  ankiStatus,
}: KhmerWordUnitProps) {
  const { LL } = useI18nContext()
  const tts = useGoogleOrNativeTts()
  const { khmerWordsHidingMode, isShowShortDetailAboutKhmerWordEnabled } = useSettings()
  const { showPopover } = useShortDefinitionPopover()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const dangerouslySetInnerHTML = useMemo(
    () => (definitionHtml ? { __html: definitionHtml } : undefined),
    [definitionHtml],
  )

  const shortBoxDefinitionHtml = useMemo(() => {
    if (!shortDefinition) return definitionHtml
    if (!('source' in shortDefinition)) throw new Error('impossible')

    const stripped =
      khmerWordsHidingMode !== 'disabled'
        ? getBestDefinitionEnOrRuFromKm_fromShort(shortDefinition) || shortDefinition.definition
        : getBestDefinitionEnOrRuFromKm_fromShort_onlyWithoutHtml(shortDefinition) || shortDefinition.definition

    return stripped
  }, [shortDefinition, definitionHtml, khmerWordsHidingMode])

  const dangerouslySetInnerHTMLShortBox = useMemo(
    () => (shortBoxDefinitionHtml ? { __html: shortBoxDefinitionHtml } : undefined),
    [shortBoxDefinitionHtml],
  )

  const wordClass = useMemo(
    () =>
      getKhmerWordCssClass(
        colorIndex,
        colorization === 'isKnown',
        colorization === 'none' ? 'none' : 'dictionary',
        ankiStatus,
      ),
    [colorIndex, colorization, ankiStatus],
  )

  return (
    <div
      className={`inline-flex flex-col items-center mx-[2px] align-top vertical-align-top relative group ${styles_srghma_khmer_dict_content.srghma_khmer_dict_content}`}
    >
      {/* 1. The Khmer Word */}
      <button
        className={`text-lg leading-normal cursor-text select-text ${wordClass}`}
        data-navigate-khmer-word={word}
        data-word-index={wordIndex}
        onClick={onClick}
      >
        {word}
      </button>

      {wiktionaryIpa && (
        <span className="select-none text-xs leading-[1.2] text-center text-foreground/80 line-clamp-2 pointer-events-none [&_i]:not-italic [&_i]:text-primary">
          {wiktionaryIpa}
        </span>
      )}

      {/* 2. The Definition Slot (Button triggering shared popover) */}
      {isShowShortDetailAboutKhmerWordEnabled && dangerouslySetInnerHTML && (
        <div className="relative w-full flex justify-center mt-1">
          <button
            ref={buttonRef}
            className={`w-full min-w-[60px] max-w-[80px] h-[2.6em] px-1 rounded-sm bg-default-200/60 hover:bg-default-300/60 cursor-pointer select-none overflow-hidden outline-none transition-opacity ${
              tts.t === 'speaking' ? 'opacity-50 animate-pulse' : 'opacity-100'
            }`}
            title={LL.ANALYZER.EXPAND_DEFINITION()}
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (buttonRef.current) {
                showPopover(word, buttonRef.current, shortDefinition)
              }
            }}
          >
            <div
              dangerouslySetInnerHTML={dangerouslySetInnerHTMLShortBox}
              className="text-xs leading-[1.2] text-center text-foreground/80 line-clamp-2 pointer-events-none [&_i]:not-italic [&_i]:text-primary"
            />
          </button>
        </div>
      )}
    </div>
  )
})
