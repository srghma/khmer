import React, { useMemo, useCallback } from 'react' // Added useCallback
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { getKhmerWordCssClass } from '../../utils/text-processing/word-renderer'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import styles_srghma_khmer_dict_content from '../../srghma_khmer_dict_content.module.css'
import { useI18nContext } from '../../i18n/i18n-react-custom'
// Import the TTS hook
import { useGoogleOrNativeTts } from '../../hooks/useGoogleOrNativeTts'
import { unknown_to_errorMessage } from '../../utils/errorMessage'
import { useAppToast } from '../../providers/ToastProvider'
import type { ShortDefinition } from '../../db/dict'

interface KhmerWordUnitProps {
  colorIndex: number
  colorization: 'none' | 'isKnown' | 'isNotKnown'
  definitionHtml: NonEmptyStringTrimmed | undefined
  shortDefinition: ShortDefinition | null | undefined
  onClick: (() => void) | undefined
  wiktionaryIpa: NonEmptyStringTrimmed | undefined
  word: TypedKhmerWord
}

export const KhmerWordUnit = React.memo(function KhmerWordUnit({
  colorIndex,
  colorization,
  definitionHtml,
  shortDefinition,
  onClick,
  wiktionaryIpa,
  word,
}: KhmerWordUnitProps) {
  const { LL } = useI18nContext()
  const tts = useGoogleOrNativeTts()
  const toast = useAppToast()

  // 1. Controlled state as per HeroUI docs
  const [isOpen, setIsOpen] = React.useState(false)

  // 2. Wrap the state change to trigger TTS immediately
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open)

      // Trigger TTS immediately when the signal to open is received
      if (open) {
        if (tts.t === 'ready') {
          tts.speak(word, 'km').catch((err: unknown) => {
            toast.error('TTS Failed' as NonEmptyStringTrimmed, unknown_to_errorMessage(err))
          })
        } else if (tts.t !== 'speaking') {
          toast.warn('TTS is not ready' as NonEmptyStringTrimmed, 'Offline?' as NonEmptyStringTrimmed)
        }
      }
    },
    [word, tts, toast],
  )

  const dangerouslySetInnerHTML = useMemo(
    () => (definitionHtml ? { __html: definitionHtml } : undefined),
    [definitionHtml],
  )

  const wordClass = useMemo(
    () => getKhmerWordCssClass(colorIndex, colorization === 'isKnown', colorization === 'none' ? 'none' : 'dictionary'),
    [colorIndex, colorization],
  )

  return (
    <div
      className={`inline-flex flex-col items-center mx-[2px] align-top vertical-align-top relative group ${styles_srghma_khmer_dict_content.srghma_khmer_dict_content}`}
    >
      {/* 1. The Khmer Word */}
      <button className={`text-lg leading-normal cursor-text select-text ${wordClass}`} onClick={onClick}>
        {word}
      </button>

      {wiktionaryIpa && (
        <span className="text-xs leading-[1.2] text-center text-foreground/80 line-clamp-2 pointer-events-none [&_i]:not-italic [&_i]:text-primary">
          {wiktionaryIpa}
        </span>
      )}

      {/* 2. The Definition Slot (Controlled Popover) */}
      {dangerouslySetInnerHTML && (
        <div className="relative w-full flex justify-center mt-1">
          <Popover
            backdrop="transparent"
            isOpen={isOpen}
            offset={10}
            placement="bottom"
            showArrow={true}
            onOpenChange={handleOpenChange}
          >
            <PopoverTrigger>
              <button
                className={`w-full min-w-[60px] max-w-[80px] h-[2.6em] px-1 rounded-sm bg-default-200/60 hover:bg-default-300/60 cursor-pointer select-none overflow-hidden outline-none transition-opacity ${
                  tts.t === 'speaking' ? 'opacity-50 animate-pulse' : 'opacity-100'
                }`}
                title={LL.ANALYZER.EXPAND_DEFINITION()}
                type="button"
              >
                <div
                  dangerouslySetInnerHTML={dangerouslySetInnerHTML}
                  className={`text-xs leading-[1.2] text-center text-foreground/80 line-clamp-2 pointer-events-none [&_i]:not-italic [&_i]:text-primary`}
                />
              </button>
            </PopoverTrigger>

            <PopoverContent className="p-0 max-w-[300px] w-max">
              <div className="flex flex-col max-h-[400px] overflow-y-auto outline-none">
                {shortDefinition && (
                  <div className="p-3 border-b border-divider bg-content2/30">
                    <div className="text-tiny font-bold text-primary uppercase mb-1">
                      {LL.DETAIL.SECTION.DEFINITION()}
                    </div>
                    <div className="text-sm font-medium">{shortDefinition.definition}</div>
                    {'wiktionary_ipa_or_from_csv_pronunciations' in shortDefinition &&
                      shortDefinition.wiktionary_ipa_or_from_csv_pronunciations && (
                        <div className="text-tiny text-foreground/60">
                          {shortDefinition.wiktionary_ipa_or_from_csv_pronunciations}
                        </div>
                      )}
                  </div>
                )}
                <div
                  dangerouslySetInnerHTML={dangerouslySetInnerHTML}
                  className="p-3 text-xs text-foreground prose prose-sm max-w-none dark:prose-invert [&_i]:text-primary [&_i]:not-italic [&_i]:font-medium select-text"
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
})
