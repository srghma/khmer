import React, { useMemo } from 'react'
import type { AnkiFlowMode } from './types'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import { AnkiContent } from './AnkiContent'
import { AnkiButtons } from './AnkiButtons'
import { DetailSections } from '../DetailView/DetailSections'
import { useAnkiDefinition } from './useAnkiDefinition'
import { Spinner } from '@heroui/spinner'
import type { AnkiGameState } from './useAnkiGame'

interface AnkiDeckViewProps {
  state: AnkiGameState & { t: 'review' }
  mode: AnkiFlowMode
  language: DictionaryLanguage
  km_map: KhmerWordsMap
}

const loading = <Spinner size="sm" />
const no_definition_found = <div className="text-default-400 italic">No definition found</div>

export const AnkiDeckView = React.memo(({ state, mode, language, km_map }: AnkiDeckViewProps) => {
  const { currentCard, isRevealed, nextIntervals, rate, reveal, remainingCount } = state

  // Fetch definition ON DEMAND for current card
  const defResult = useAnkiDefinition(currentCard.word, language)

  const contentElement = useMemo(() => {
    if (defResult.t === 'loading') return loading
    if (!defResult.detail) return no_definition_found

    const detail = defResult.detail

    // LOGIC FOR 6 MODES (Implicit via props)
    // 1. KM (WORD->DESC): Show Word. Reveal -> Show Detail (Full).
    // 2. KM (DESC->WORD): Show Detail (Hidden Khmer). Reveal -> Show Word.
    // 3. EN (WORD->DESC): Show EN Word. Reveal -> Show Detail (Full).
    // 4. EN (DESC->WORD): Show Detail (Hidden Non-Khmer?? No, usually standard cloze).
    // ...

    // For DESC_TO_WORD mode, we want the "Question" to be the Definition with the Answer hidden.
    // If language is KM, the Answer is the Khmer Word, so we hide Khmer words in the definition.
    // If language is EN/RU, the Answer is the EN/RU Word. The definition might contain the word?
    // Usually, dictionary definitions don't contain the headword, or we rely on 'isNonKhmerWordsHidingEnabled' if strictly testing EN reading.

    return (
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
        isKhmerWordsHidingEnabled={mode === 'DESC_TO_WORD'}
        isNonKhmerWordsHidingEnabled={false}
        km_map={km_map}
        maybeColorMode="none"
        mode={language}
        wiktionary={detail.wiktionary}
      />
    )
  }, [defResult, mode, language, km_map])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <AnkiContent
        cardWord={currentCard.word}
        isRevealed={isRevealed}
        language={language}
        mode={mode}
        richContent={contentElement}
      />

      <AnkiButtons
        isDisabled={false}
        isRevealed={isRevealed}
        nextIntervals={nextIntervals}
        onRate={rate}
        onReveal={reveal}
      />

      <div className="absolute top-2 right-2 text-tiny text-default-400 font-mono pointer-events-none">
        {remainingCount} cards left
      </div>
    </div>
  )
})
AnkiDeckView.displayName = 'AnkiDeckView'
