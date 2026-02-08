import React, { useMemo } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/popover'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { getKhmerWordCssClass } from '../../utils/text-processing/word-renderer'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import styles_srghma_khmer_dict_content from '../../srghma_khmer_dict_content.module.css'

// --- Sub-Component: KhmerWordUnit ---

interface KhmerWordUnitProps {
  word: TypedKhmerWord
  definitionHtml: NonEmptyStringTrimmed | undefined
  colorIndex: number
  onClick: (() => void) | undefined
  colorization: 'none' | 'isKnown' | 'isNotKnown'
}

export const KhmerWordUnit = React.memo(
  ({ word, definitionHtml, colorIndex, colorization, onClick }: KhmerWordUnitProps) => {
    // Determine styles based on props
    const dangerouslySetInnerHTML = useMemo(
      () => (definitionHtml ? { __html: definitionHtml } : undefined),
      [definitionHtml],
    )

    const wordClass = useMemo(
      () => (colorization === 'none' ? undefined : getKhmerWordCssClass(colorIndex, colorization === 'isKnown')),
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

        {/* 2. The Definition Slot (Popover) */}
        {dangerouslySetInnerHTML && (
          <div className="relative w-full flex justify-center mt-1">
            <Popover backdrop="transparent" offset={10} placement="bottom" showArrow={true}>
              <PopoverTrigger>
                <button
                  className="w-full min-w-[60px] max-w-[80px] h-[2.6em] px-1 rounded-sm bg-default-200/60 hover:bg-default-300/60 cursor-pointer select-none overflow-hidden outline-none data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2"
                  title="Click to expand definition"
                  type="button"
                >
                  {/* Collapsed Content: Plain HTML, Clamped to 2 lines */}
                  <div
                    dangerouslySetInnerHTML={dangerouslySetInnerHTML}
                    className="text-[10px] leading-[1.2] text-center text-foreground/80 line-clamp-2 pointer-events-none [&_i]:not-italic [&_i]:text-primary"
                  />
                </button>
              </PopoverTrigger>

              <PopoverContent className="p-0 max-w-[300px] w-max">
                <div
                  dangerouslySetInnerHTML={dangerouslySetInnerHTML}
                  className="max-h-[250px] overflow-y-auto p-3 text-xs text-foreground prose prose-sm max-w-none dark:prose-invert [&_i]:text-primary [&_i]:not-italic [&_i]:font-medium select-text"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    )
  },
)

KhmerWordUnit.displayName = 'KhmerWordUnit'
