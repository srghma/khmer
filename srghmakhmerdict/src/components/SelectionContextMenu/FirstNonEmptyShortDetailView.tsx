import React, { useMemo } from 'react'
import { Spinner } from '@heroui/spinner'
import type { DictionaryLanguage } from '../../types'
import { useWordData } from '../../hooks/useDetailViewLogic'
import { colorizeHtml } from '../../utils/text-processing/html'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap } from '../../db/dict'
import { truncateHtmlSafe } from './truncateHtmlSafe'

interface FirstNonEmptyShortDetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  km_map: KhmerWordsMap | undefined
  fallback: React.ReactNode
}

export const Loading = (
  <div className="flex items-center gap-2 text-default-400">
    <Spinner color="current" size="sm" />
    <span className="text-xs">Checking dictionary...</span>
  </div>
)

export const FirstNonEmptyShortDetailView: React.FC<FirstNonEmptyShortDetailViewProps> = React.memo(
  ({ word, mode, km_map, fallback }) => {
    // We assume this hook caches results, so it's cheap to call again here
    const { data, loading } = useWordData(word, mode)

    // 2. Resolve Data
    const rawContent = useMemo(() => {
      if (!data) return null

      // Priority list of columns to check
      const candidates = [
        data.from_csv_raw_html, // Generic CSV HTML
        data.wiktionary,
        data.desc,
        // data.desc_en_only,
        data.from_russian_wiki,
        data.en_km_com,
        data.from_chuon_nath,
        data.from_chuon_nath_translated,
      ]

      return candidates.find(c => c && c.trim().length > 0)
    }, [data])

    // 3. Process Content (Truncate -> Colorize)
    const displayHtml = useMemo(() => {
      if (!rawContent) return null

      // Truncate first to avoid processing huge strings
      const truncated = String_toNonEmptyString_orUndefined_afterTrim(truncateHtmlSafe(rawContent, 1000))

      if (!truncated) return null
      if (!km_map) return { __html: truncated }

      // Colorize (inject spans for click handlers etc if needed, though usually just color)
      const displayHtml = colorizeHtml(truncated, 'segmenter', km_map)

      return { __html: displayHtml }
    }, [rawContent, km_map])

    // 1. Loading State
    if (loading) {
      return Loading
    }

    // 4. Render
    if (!displayHtml) {
      return fallback
    }

    return (
      <div className="flex flex-col gap-1 w-full max-w-[400px]">
        {/* Title / Context label */}
        <div className="text-[10px] uppercase font-bold text-primary tracking-wider opacity-70">Dictionary Preview</div>

        {/* HTML Content */}
        {/* We adds max-h and overflow-hidden as a second layer of defense for visual neatness */}
        <div className="text-sm text-foreground-700 font-khmer prose prose-sm dark:prose-invert max-w-none leading-snug line-clamp-4 max-h-[100px] overflow-hidden relative">
          <div dangerouslySetInnerHTML={displayHtml} />

          {/* Fade out effect at bottom */}
          <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-content1 to-transparent pointer-events-none" />
        </div>
      </div>
    )
  },
)

FirstNonEmptyShortDetailView.displayName = 'FirstNonEmptyShortDetailView'
