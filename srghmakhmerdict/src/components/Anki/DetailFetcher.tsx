import React from 'react'
import type { DictionaryLanguage } from '../../types'
import { Spinner } from '@heroui/spinner'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap, WordDetailEnOrRuOrKm } from '../../db/dict/index'
import { DetailSections } from '../DetailView/DetailSections'
import { useWordData } from '../../hooks/useWordData'
import { AnkiCardDetailView } from './AnkiCardDetailView'
import { useSettings } from '../../providers/SettingsProvider'

const DetailFetcher_loading = (
  <div className="flex justify-center p-4">
    <Spinner size="sm" />
  </div>
)

const DetailFetcher_not_found = <div className="text-danger text-center p-4">Failed to load definition</div>

export const DetailFetcher = React.memo(
  ({
    language,
    word,
    km_map,
    isKhmerWordsHidingEnabled,
    isNonKhmerWordsHidingEnabled,
    isRevealed,
    onExit,
    onBack,
  }: {
    language: DictionaryLanguage
    word: NonEmptyStringTrimmed
    km_map: KhmerWordsMap
    isKhmerWordsHidingEnabled: boolean
    isNonKhmerWordsHidingEnabled: boolean
    isRevealed: boolean
    onExit: () => void
    onBack: () => void
  }) => {
    const result = useWordData(word, language)
    const { maybeColorMode } = useSettings()

    if (result.t === 'loading') return DetailFetcher_loading
    if (result.t === 'not_found') return DetailFetcher_not_found

    const d: WordDetailEnOrRuOrKm = result.detail

    if (isRevealed) {
      return <AnkiCardDetailView data={d} km_map={km_map} mode={language} word={word} onBack={onBack} onExit={onExit} />
    }

    return (
      <DetailSections
        desc={d.desc}
        desc_en_only={d.desc_en_only}
        en_km_com={d.en_km_com}
        from_chuon_nath={d.from_chuon_nath}
        from_chuon_nath_translated={d.from_chuon_nath_translated}
        from_csv_noun_forms={d.from_csv_noun_forms}
        from_csv_pronunciations={d.from_csv_pronunciations}
        from_csv_raw_html={d.from_csv_raw_html}
        from_csv_variants={d.from_csv_variants}
        from_russian_wiki={d.from_russian_wiki}
        gorgoniev={d.gorgoniev}
        isKhmerLinksEnabled_ifTrue_passOnNavigate={undefined}
        isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        isNonKhmerWordsHidingEnabled={isNonKhmerWordsHidingEnabled}
        km_map={km_map}
        maybeColorMode={maybeColorMode}
        mode={language}
        wiktionary={d.wiktionary}
      />
    )
  },
)

DetailFetcher.displayName = 'DetailFetcher'
