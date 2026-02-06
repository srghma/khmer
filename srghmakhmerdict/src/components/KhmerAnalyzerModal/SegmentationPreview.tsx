import React from 'react'
import type { KhmerWordsMap } from '../../db/dict'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { KhmerWordUnit } from './KhmerWordUnit'
import type { TextSegmentEnhanced } from '../../utils/text-processing/text-enhanced'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import type { TextSegment } from '../../utils/text-processing/text'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'

// --- Main Component ---

interface SegmentationPreviewProps {
  segments: NonEmptyArray<TextSegment | TextSegmentEnhanced>
  onKhmerWordClick: (v: TypedKhmerWord) => void
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap
  label: string
  className?: string
}

export const SegmentationPreview: React.FC<SegmentationPreviewProps> = React.memo(
  ({ onKhmerWordClick, segments, maybeColorMode, km_map, label, className = '' }) => {
    let globalWordIndex = 0

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex justify-between items-center">
          <span className="text-small text-default-500">{label}</span>
        </div>

        {/*
          Container for the segmented text.
          Use items-start to align words to the top line.
          min-h ensures consistent spacing even if loading.
        */}
        <div className="rounded-medium bg-default-50 px-3 py-4 text-medium leading-relaxed break-words whitespace-pre-wrap min-h-[100px]">
          {segments.map((seg, i) => {
            if (seg.t === 'notKhmer') {
              return (
                <span key={i} className="align-top mt-1 inline-block text-foreground/80">
                  {seg.v}
                </span>
              )
            }

            return seg.words.map((item, j) => {
              const currentIdx = globalWordIndex++

              const w = typeof item === 'object' ? item.w : item
              const def = typeof item === 'object' ? item.def : undefined

              return (
                <KhmerWordUnit
                  key={`${i}-${j}`}
                  colorIndex={currentIdx}
                  colorization={maybeColorMode === 'none' ? 'none' : km_map.has(w) ? 'isKnown' : 'isNotKnown'}
                  definitionHtml={def}
                  word={w}
                  onClick={() => onKhmerWordClick(w)}
                />
              )
            })
          })}
        </div>
      </div>
    )
  },
)

SegmentationPreview.displayName = 'SegmentationPreview'
