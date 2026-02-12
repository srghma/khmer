import React, { useMemo } from 'react'
import { Spinner } from '@heroui/spinner'
import type { DictionaryLanguage } from '../../types'
import { useWordData } from '../../hooks/useWordData'
import { colorizeHtml } from '../../utils/text-processing/html'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap, WordDetailEnOrRuOrKm } from '../../db/dict/index'
import { truncateHtmlSafe } from './truncateHtmlSafe'
import srghma_khmer_dict_content_styles from '../../srghma_khmer_dict_content.module.css'
import { isContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { ColorizationMode } from '../../utils/text-processing/utils'

interface FirstNonEmptyShortDetailViewProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  km_map: KhmerWordsMap
  fallback: React.ReactNode
  colorizationMode: ColorizationMode
}

export const Loading = (
  <div className="flex items-center gap-2 text-default-400">
    <Spinner color="current" size="sm" />
    <span className="text-xs">Checking dictionary...</span>
  </div>
)

export const FirstNonEmptyShortDetailView: React.FC<FirstNonEmptyShortDetailViewProps> = React.memo(
  ({ word, mode, km_map, colorizationMode, fallback }) => {
    const res = useWordData(word, mode)

    // 1. Resolve Raw Content from candidates
    const rawContent = useMemo(() => {
      if (res.t !== 'found') return null

      const detail: WordDetailEnOrRuOrKm | undefined = res.detail
      const candidates = [
        detail.from_csv_raw_html,
        detail.wiktionary,
        detail.desc,
        // detail.desc_en_only,
        detail.from_russian_wiki,
        detail.en_km_com,
        detail.from_chuon_nath,
        detail.from_chuon_nath_translated,
      ]

      return candidates.find(c => c && c.trim().length > 0)
    }, [res])

    // 2. Process Content (Truncate -> Colorize)
    const displayHtml = useMemo(() => {
      if (!rawContent) return null

      const truncated = String_toNonEmptyString_orUndefined_afterTrim(truncateHtmlSafe(rawContent, 1000))

      if (!truncated) return null
      if (!km_map || !isContainsKhmer(truncated)) return { __html: truncated }

      const colorized = colorizeHtml(truncated, colorizationMode, km_map)

      return { __html: colorized }
    }, [rawContent, colorizationMode, km_map])

    // 3. Handle Discriminated Union States
    if (res.t === 'loading') return Loading

    if (res.t === 'not_found' || !displayHtml) return fallback

    // 4. Render 'found' state
    return (
      <div className="flex flex-col gap-1 w-full max-w-[400px]">
        <div className="text-[10px] uppercase font-bold text-primary tracking-wider opacity-70">Dictionary Preview</div>

        <div
          className={`text-sm text-foreground-700 prose prose-sm dark:prose-invert max-w-none leading-snug line-clamp-4 max-h-[100px] overflow-hidden relative`}
        >
          <div
            dangerouslySetInnerHTML={displayHtml}
            className={srghma_khmer_dict_content_styles.srghma_khmer_dict_content}
          />
        </div>
      </div>
    )
  },
)

FirstNonEmptyShortDetailView.displayName = 'FirstNonEmptyShortDetailView'
