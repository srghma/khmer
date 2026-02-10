import React, { useMemo } from 'react'
import type { AnkiDirection } from './types'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap, LanguageToDetailMap } from '../../db/dict/index'
import { AnkiContent } from './AnkiContent'
import { AnkiButtons } from './AnkiButtons'
import { DetailSections } from '../DetailView/DetailSections'
import { getBestDefinitionKhmerFromEn } from '../../utils/WordDetailEn_OnlyKhmerAndWithoutHtml'
import { getBestDefinitionKhmerFromRu } from '../../utils/WordDetailRu_OnlyKhmerAndWithoutHtml'
import type { FavoriteItem } from '../../db/favorite/item'
import type { Grade } from 'femto-fsrs'
import type { NOfDays } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/n-of-days'

interface AnkiDeckViewProps<L extends DictionaryLanguage> {
  // Data
  currentCard: FavoriteItem
  currentDescription: LanguageToDetailMap[L]
  remainingCount: number
  nextIntervals: Record<Grade, NOfDays>

  // State
  isRevealed: boolean

  // Actions
  onReveal: () => void
  onRate: (grade: Grade) => void

  // Context
  direction: AnkiDirection
  language: DictionaryLanguage
  km_map: KhmerWordsMap
}


export const AnkiDeckView = React.memo(<L extends DictionaryLanguage>({
  currentCard,
  currentDescription,
  remainingCount,
  nextIntervals,
  isRevealed,
  onReveal,
  onRate,
  direction,
  language,
  km_map
}: AnkiDeckViewProps<L>) => {

  // 1. Determine if the "Word" (Headword) is hidden or visible on the Front side.
  //    Hidden = We are guessing the Word.
  //    Visible = We see the Word, we are guessing the Definition.
  const isCardWordHidden = (language === 'km') === (direction === 'GUESSING_KHMER')

  // 2. Prepare the Content
  const { detailContent, frontContent } = useMemo(() => {
    const detail = currentDescription as any // Use as any to bypass specific language check for now, can be improved.

    // The Back Side (Full Details)
    // If guessing the word (isCardWordHidden), we might want to hide the word in the definition on the FRONT,
    // but on the BACK (detailContent), we usually show everything.
    const back = (
      <DetailSections
        desc={detail.desc}
        desc_en_only={detail.desc_en_only}
        en_km_com={detail.en_km_com}
        from_chuon_nath={detail.from_chuon_nath}
        from_chuon_nath_translated={detail.from_chuon_nath_translated}
        from_csv_noun_forms={detail.from_csv_noun_forms}
        from_csv_pronunciations={detail.from_csv_pronunciations}
        from_csv_raw_html={detail.from_csv_raw_html}
        from_csv_variants={detail.from_csv_variants}
        from_russian_wiki={detail.from_russian_wiki}
        isKhmerLinksEnabled_ifTrue_passOnNavigate={undefined}
        isKhmerWordsHidingEnabled={false} // Detail view reveals all
        isNonKhmerWordsHidingEnabled={false}
        km_map={km_map}
        maybeColorMode="none"
        mode={language}
        wiktionary={detail.wiktionary}
      />
    )

    // The Front Side (Question)
    let front: React.ReactNode = null

    if (!isCardWordHidden) {
      // Front is simply the Word
      front = <div className="text-5xl md:text-6xl font-bold text-center leading-relaxed">{currentCard.word}</div>
    } else {
      // Front is the Definition (or extracted parts)
      if (language === 'km') {
        // For Khmer, Front is the definition. We MUST hide the Khmer word in it.
        front = (
          <DetailSections
            desc={detail.desc}
            desc_en_only={detail.desc_en_only}
            en_km_com={detail.en_km_com}
            from_chuon_nath={detail.from_chuon_nath}
            from_chuon_nath_translated={detail.from_chuon_nath_translated}
            from_csv_noun_forms={detail.from_csv_noun_forms}
            from_csv_pronunciations={detail.from_csv_pronunciations}
            from_csv_raw_html={detail.from_csv_raw_html}
            from_csv_variants={detail.from_csv_variants}
            from_russian_wiki={detail.from_russian_wiki}
            isKhmerLinksEnabled_ifTrue_passOnNavigate={undefined}
            isKhmerWordsHidingEnabled={true} // HIDE THE ANSWER
            isNonKhmerWordsHidingEnabled={false}
            km_map={km_map}
            maybeColorMode="none"
            mode={language}
            wiktionary={detail.wiktionary}
          />
        )
      } else if (language === 'en') {
        // For English, Front is the Khmer translation
        const val = getBestDefinitionKhmerFromEn(detail as any)

        front = <div className="text-4xl font-khmer text-center leading-relaxed">{val || 'Translation missing'}</div>
      } else if (language === 'ru') {
        // For Russian, Front is the Khmer translation
        const val = getBestDefinitionKhmerFromRu(detail as any)

        front = <div className="text-4xl font-khmer text-center leading-relaxed">{val || 'Translation missing'}</div>
      }
    }

    return { detailContent: back, frontContent: front }
  }, [currentDescription, isCardWordHidden, language, km_map, currentCard.word])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AnkiContent
        cardWord={currentCard.word}
        frontContent={frontContent}
        isCardWordHidden={isCardWordHidden}
        isRevealed={isRevealed}
        language={language}
        richContent={detailContent}
      />

      <AnkiButtons
        isDisabled={false}
        isRevealed={isRevealed}
        nextIntervals={nextIntervals}
        onRate={onRate}
        onReveal={onReveal}
      />

      <div className="absolute top-2 right-2 text-tiny text-default-400 font-mono pointer-events-none">
        {remainingCount} cards left
      </div>
    </div>
  )
}) as <L extends DictionaryLanguage>(props: AnkiDeckViewProps<L>) => React.ReactElement
// AnkiDeckView.displayName = 'AnkiDeckView'
