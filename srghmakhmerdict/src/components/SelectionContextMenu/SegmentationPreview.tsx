import React from 'react'
import type { KhmerWordsMap } from '../../db/dict'
import { Spinner } from '@heroui/spinner'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { KhmerWordUnit } from './KhmerWordUnit'
import type { TextSegmentEnhanced } from '../../utils/text-processing/text-enhanced'
import type { ColorizationMode } from '../../utils/text-processing/utils'

// --- Main Component ---

interface SegmentationPreviewProps {
  segments: NonEmptyArray<TextSegmentEnhanced> | undefined
  loading: boolean
  colorMode: ColorizationMode
  km_map: KhmerWordsMap
  label: string
  className?: string
}

export const SegmentationPreview: React.FC<SegmentationPreviewProps> = React.memo(
  ({ segments, loading = false, colorMode, km_map, label = 'Segmentation Preview', className = '' }) => {
    if (!segments) return null

    let globalWordIndex = 0

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex justify-between items-center">
          <span className="text-small text-default-500">{label}</span>
          {loading && <Spinner color="default" size="sm" />}
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

              return (
                <KhmerWordUnit
                  key={`${i}-${j}`}
                  colorIndex={currentIdx}
                  colorMode={colorMode}
                  definitionHtml={item.def}
                  isKnown={km_map.has(item.w)}
                  word={item.w}
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
