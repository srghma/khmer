import React, { useCallback, useMemo } from 'react'
import { useAnkiGameInitialData_GUESSING_KHMER, type CardAndDescription } from './useAnkiGameManagerInitialData'
import { AnkiGameSession } from './AnkiGameSession'
import type { DictionaryLanguage } from '../../types'
import type { AnkiDirection } from './types'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { FavoriteItem } from '../../db/favorite/item'
import { Spinner } from '@heroui/spinner'
import type { KhmerWordsMap } from '../../db/dict/index'
import { DetailSections } from '../DetailView/DetailSections'
import type {
  LanguageToShortDefinitionSum,
  ShortDefinitionEn,
  ShortDefinitionKm,
  ShortDefinitionRu,
} from '../../db/dict/types'

interface Props {
  language: DictionaryLanguage
  km_map: KhmerWordsMap
  direction: AnkiDirection
  allFavorites: NonEmptyArray<FavoriteItem>
}

const LoadingState = (
  <div className="flex h-full items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const EmptyState = <div className="p-8 text-center text-default-500">No cards due.</div>

// --- DetailSectionsFromShortDef ---

type DetailSectionsFromShortDefProps = {
  language: DictionaryLanguage
  shortDef: unknown
  hideKhmer: boolean
  km_map: KhmerWordsMap
}

function getDetailSectionsPropsFromShortDef(
  language: DictionaryLanguage,
  shortDef: unknown,
): Omit<
  React.ComponentProps<typeof DetailSections>,
  | 'isKhmerLinksEnabled_ifTrue_passOnNavigate'
  | 'isKhmerWordsHidingEnabled'
  | 'isNonKhmerWordsHidingEnabled'
  | 'km_map'
  | 'maybeColorMode'
  | 'mode'
> {
  const props: ReturnType<typeof getDetailSectionsPropsFromShortDef> = {
    desc: undefined,
    desc_en_only: undefined,
    en_km_com: undefined,
    from_chuon_nath: undefined,
    from_chuon_nath_translated: undefined,
    from_csv_noun_forms: undefined,
    from_csv_pronunciations: undefined,
    from_csv_raw_html: undefined,
    from_csv_variants: undefined,
    from_russian_wiki: undefined,
    gorgoniev: undefined,
    wiktionary: undefined,
  }

  if (!shortDef) return props

  if (language === 'km') {
    const def = shortDef as ShortDefinitionKm
    const { definition, source } = def

    if (source === 'Desc') props.desc = definition
    else if (source === 'Wiktionary') props.wiktionary = definition
    else if (source === 'EnKmCom') props.en_km_com = definition
    else if (source === 'FromCsvRawHtml') props.from_csv_raw_html = definition
    else if (source === 'FromChuonNathTranslated') props.from_chuon_nath_translated = definition
    else if (source === 'FromRussianWiki') props.from_russian_wiki = definition
  } else if (language === 'en') {
    const def = shortDef as ShortDefinitionEn
    const { definition, source } = def

    if (source === 'Desc') props.desc = definition
    else if (source === 'DescEnOnly') props.desc_en_only = definition
    else if (source === 'EnKmCom') props.en_km_com = definition
  } else if (language === 'ru') {
    const def = shortDef as ShortDefinitionRu
    const { definition, source } = def

    if (source === 'Desc') props.desc = definition
  }

  return props
}

const DetailSectionsFromShortDef = React.memo(
  ({ language, shortDef, hideKhmer, km_map }: DetailSectionsFromShortDefProps) => {
    const detailProps = useMemo(() => getDetailSectionsPropsFromShortDef(language, shortDef), [language, shortDef])

    return (
      <DetailSections
        {...detailProps}
        isKhmerLinksEnabled_ifTrue_passOnNavigate={undefined}
        isKhmerWordsHidingEnabled={hideKhmer}
        isNonKhmerWordsHidingEnabled={false}
        km_map={km_map}
        maybeColorMode="none"
        mode={language}
      />
    )
  },
)

DetailSectionsFromShortDef.displayName = 'DetailSectionsFromShortDef'

// --- Front & Back Components ---

interface AnkiFrontProps {
  item: CardAndDescription<DictionaryLanguage>
  language: DictionaryLanguage
  direction: AnkiDirection
  km_map: KhmerWordsMap
}

const AnkiFront = React.memo(({ item, language, direction, km_map }: AnkiFrontProps) => {
  const isGuessingKhmer = direction === 'GUESSING_KHMER'

  if (isGuessingKhmer) {
    if (language === 'km') {
      // Km -> Km (Def -> Word)
      // Front: Definition (Masked)
      return (
        <DetailSectionsFromShortDef hideKhmer={true} km_map={km_map} language={language} shortDef={item.description} />
      )
    } else {
      // En/Ru -> Km (Word -> Translation)
      // Front: Word
      return <div className="text-4xl font-bold text-center">{item.card.word}</div>
    }
  } else {
    // Guessing Non-Khmer
    if (language === 'km') {
      // Km -> En/Ru (Word -> Def)
      // Front: Word
      return <div className="text-4xl font-bold text-center">{item.card.word}</div>
    } else {
      // En/Ru -> En/Ru (Def -> Word??)
      // Usually En -> En is Def -> Word.
      // Front: Def (Masked? Or just Def)
      return (
        <DetailSectionsFromShortDef hideKhmer={false} km_map={km_map} language={language} shortDef={item.description} />
      )
    }
  }
})

AnkiFront.displayName = 'AnkiFront'

interface AnkiBackProps {
  item: CardAndDescription<DictionaryLanguage>
  language: DictionaryLanguage
  km_map: KhmerWordsMap
}

const AnkiBack = React.memo(({ item, language, km_map }: AnkiBackProps) => {
  return (
    <div>
      <div className="text-center font-bold text-4xl mb-4 text-primary">{item.card.word}</div>
      <DetailSectionsFromShortDef hideKhmer={false} km_map={km_map} language={language} shortDef={item.description} />
    </div>
  )
})

AnkiBack.displayName = 'AnkiBack'

// --- Main Component ---

export const AnkiGameSession_GuessingKhmer = React.memo(({ language, km_map, direction, allFavorites }: Props) => {
  const state = useAnkiGameInitialData_GUESSING_KHMER(language, allFavorites)

  const setItemCard = useCallback(
    (item: CardAndDescription<DictionaryLanguage>, newCard: FavoriteItem): CardAndDescription<DictionaryLanguage> => {
      if (newCard.word !== item.card.word) throw new Error('impossible')
      if (newCard.language !== item.card.language) throw new Error('impossible')

      return {
        ...item,
        card: newCard,
      }
    },
    [],
  )

  const getDescription = useCallback(
    (item: CardAndDescription<DictionaryLanguage>): LanguageToShortDefinitionSum => {
      return { t: language, v: item.description } as any
    },
    [language],
  )

  const renderFront = useCallback(
    (item: CardAndDescription<DictionaryLanguage>) => (
      <AnkiFront direction={direction} item={item} km_map={km_map} language={language} />
    ),
    [direction, km_map, language],
  )

  const renderBack = useCallback(
    (item: CardAndDescription<DictionaryLanguage>) => <AnkiBack item={item} km_map={km_map} language={language} />,
    [km_map, language],
  )

  if (state.t !== 'have_enhanced_cards') {
    if (state.t === 'empty') return EmptyState

    return LoadingState
  }

  return (
    <AnkiGameSession
      direction={direction}
      getCard={item => item.card}
      getDescription={getDescription}
      items={state.cards}
      language={language}
      renderBack={renderBack}
      renderFront={renderFront}
      setItemCard={setItemCard}
    />
  )
})

AnkiGameSession_GuessingKhmer.displayName = 'AnkiGameSession_GuessingKhmer'
