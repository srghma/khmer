import React, { useCallback } from 'react'
import { useAnkiGameInitialData_GUESSING_NON_KHMER } from './useAnkiGameManagerInitialData'
import { AnkiGameSession } from './AnkiGameSession'
import type { DictionaryLanguage } from '../../types'
import type { AnkiDirection } from './types'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { FavoriteItem } from '../../db/favorite/item'
import { Spinner } from '@heroui/spinner'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { KhmerWordsMap, WordDetailEnOrRuOrKm } from '../../db/dict/index'
import { DetailSections } from '../DetailView/DetailSections'
import { identityFn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/types'
import { useWordDefinition } from '../../hooks/useWordDefinition'

interface Props {
  language: DictionaryLanguage
  km_map: KhmerWordsMap
  direction: AnkiDirection
  allFavorites: NonEmptyArray<FavoriteItem>
}

export const AnkiGameSession_GuessingNonKhmer = React.memo(({ language, km_map, direction, allFavorites }: Props) => {
  const state = useAnkiGameInitialData_GUESSING_NON_KHMER(language, allFavorites)

  const setItemCard = useCallback((item: FavoriteItem, newCard: FavoriteItem): FavoriteItem => {
    if (newCard.word !== item.word) throw new Error('impossible')
    if (newCard.language !== item.language) throw new Error('impossible')

    return newCard
  }, [])

  const isGuessingKhmer = direction === 'GUESSING_KHMER'

  const renderFront = useCallback(
    (item: FavoriteItem) => {
      if (isGuessingKhmer) {
        // Front: Detail (Masked)
        return <DetailFetcher hideKhmer={true} km_map={km_map} language={language} word={item.word} />
      }

      // Front: Word
      return <div className="text-center text-4xl font-bold font-khmer">{item.word}</div>
    },
    [isGuessingKhmer, km_map, language],
  )

  const renderBack = useCallback(
    (item: FavoriteItem) => (
      <div>
        <div className="text-4xl font-bold text-center mb-4 text-primary font-khmer">{item.word}</div>
        <DetailFetcher hideKhmer={false} km_map={km_map} language={language} word={item.word} />
      </div>
    ),
    [km_map, language],
  )

  if (state.t !== 'have_enhanced_cards') {
    if (state.t === 'empty') return <div className="p-8 text-center text-default-500">No cards due.</div>

    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <AnkiGameSession<FavoriteItem>
      direction={direction}
      getCard={identityFn}
      getDescription={undefined}
      items={state.cards}
      language={language}
      renderBack={renderBack}
      renderFront={renderFront}
      setItemCard={setItemCard}
    />
  )
})

AnkiGameSession_GuessingNonKhmer.displayName = 'AnkiGameSession_GuessingNonKhmer'

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
    hideKhmer,
  }: {
    language: DictionaryLanguage
    word: NonEmptyStringTrimmed
    km_map: KhmerWordsMap
    hideKhmer: boolean
  }) => {
    const result = useWordDefinition(word, language)

    if (result.t === 'loading') return DetailFetcher_loading
    if (result.t === 'not_found') return DetailFetcher_not_found

    const d: WordDetailEnOrRuOrKm = result.detail

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
        isKhmerWordsHidingEnabled={hideKhmer}
        isNonKhmerWordsHidingEnabled={false}
        km_map={km_map}
        maybeColorMode="none"
        mode={language}
        wiktionary={d.wiktionary}
      />
    )
  },
)

DetailFetcher.displayName = 'DetailFetcher'
