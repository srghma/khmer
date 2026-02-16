import React, { useMemo } from 'react'
import { CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { ScrollShadow } from '@heroui/scroll-shadow'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { DetailViewActions, type DetailViewActionsProps_Common } from './DetailViewHeaderActions'
import { Button } from '@heroui/button'
import { HiArrowLeft } from 'react-icons/hi2'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import type { TranslationFunctions } from '../../i18n/i18n-types'

interface DetailViewBackButtonProps {
  onPress: () => void
  // desktopOnlyStyles_showButton: boolean
}

export const DetailViewBackButton = React.memo(({ onPress }: DetailViewBackButtonProps) => {
  return (
    <Button isIconOnly className={`mr-1 text-default-500 -ml-2 md:hidden shrink-0`} variant="light" onPress={onPress}>
      <HiArrowLeft className="w-6 h-6" />
    </Button>
  )
})

DetailViewBackButton.displayName = 'DetailViewBackButton'

export interface DetailViewHeaderProps_Common extends DetailViewActionsProps_Common {
  backButton_goBack: (() => void) | undefined
}

export interface DetailViewHeaderProps_KnownWord extends DetailViewHeaderProps_Common {
  type: 'known_word'
  phonetic: NonEmptyStringTrimmed | undefined
  khmerFontFamily: NonEmptyStringTrimmed | undefined
  word_displayHtml: NonEmptyStringTrimmed

  // Favorites
  isFav: boolean
  toggleFav: () => void
  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  // Khmer Words Hiding
  isKhmerWordsHidingEnabled: boolean
  toggleKhmerWordsHiding: () => void

  isNonKhmerWordsHidingEnabled: boolean
  toggleNonKhmerWordsHiding: () => void
}

export interface DetailViewHeaderProps_AnkiGame_Back extends DetailViewHeaderProps_Common {
  type: 'anki_game_back'
  phonetic: NonEmptyStringTrimmed | undefined
  khmerFontFamily: NonEmptyStringTrimmed | undefined
  word_displayHtml: NonEmptyStringTrimmed

  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  // Khmer Words Hiding
  isKhmerWordsHidingEnabled: boolean
  toggleKhmerWordsHiding: () => void
  isNonKhmerWordsHidingEnabled: boolean
  toggleNonKhmerWordsHiding: () => void
  // Autofocus
  isAutoFocusAnswerEnabled: boolean
  toggleAutoFocusAnswer: () => void
}

export interface DetailViewHeaderProps_SentenceAnalyzer extends DetailViewHeaderProps_Common {
  type: 'sentence_analyzer'
  header: React.ReactNode
}

export interface DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_Shown extends DetailViewHeaderProps_Common {
  type: 'anki_game_front_and_khmer_words_are_shown'
  // Colorization
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (v: MaybeColorizationMode) => void
  header: NonEmptyStringTrimmed
  // Autofocus
  isAutoFocusAnswerEnabled: boolean
  toggleAutoFocusAnswer: () => void
}

export interface DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown extends DetailViewHeaderProps_Common {
  type: 'anki_game_front_and_khmer_words_are_not_shown'
  header: NonEmptyStringTrimmed
  // Autofocus
  isAutoFocusAnswerEnabled: boolean
  toggleAutoFocusAnswer: () => void
}

export type DetailViewHeaderProps =
  | DetailViewHeaderProps_KnownWord
  | DetailViewHeaderProps_SentenceAnalyzer
  | DetailViewHeaderProps_AnkiGame_Back
  | DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_Shown
  | DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown

// --- GRID & LAYOUT CONFIGURATION ---

const scrollShadowProps = {
  hideScrollBar: true,
  orientation: 'horizontal' as const,
  // flex-1: Takes all remaining width after Title
  // min-w-0: Allows shrinking below content size (CRITICAL for scroll to trigger)
  className: 'flex-1  min-w-0 h-full pr-[env(safe-area-inset-right)] !overflow-x-none',
}

const actionGridClassName = 'grid grid-rows-2 grid-flow-col auto-cols-max gap-1 items-center h-full w-max'

// -----------------------------------

const DetailViewHeaderWord = (
  props: (DetailViewHeaderProps_KnownWord | DetailViewHeaderProps_AnkiGame_Back) & { LL: TranslationFunctions },
) => {
  const { khmerFontFamily, word_displayHtml, phonetic, word_or_sentence__language } = props

  const h1Style = useMemo(
    () => (word_or_sentence__language === 'km' && khmerFontFamily ? { fontFamily: khmerFontFamily } : undefined),
    [word_or_sentence__language, khmerFontFamily],
  )

  const h1Html = useMemo(() => (word_displayHtml ? { __html: word_displayHtml } : undefined), [word_displayHtml])

  return (
    <CardHeader className="pt-[calc(env(safe-area-inset-top))] flex items-center gap-2 h-auto min-h-[5rem]">
      {/* 1. Back Button (Always Visible) */}
      {props.backButton_goBack && <DetailViewBackButton onPress={props.backButton_goBack} />}

      {/* 2. Central Text (Max 40%, Truncated) */}
      <div className="flex flex-col justify-center max-w-[40%] min-w-0 shrink-0">
        {h1Html && (
          <h1
            dangerouslySetInnerHTML={h1Html}
            className="font-bold text-foreground text-xl font-khmer truncate"
            style={h1Style}
          />
        )}
        <div className="flex items-center gap-1 truncate">
          {phonetic && (
            <Chip className="font-mono shrink-0" color="secondary" size="sm" variant="flat">
              /{phonetic}/
            </Chip>
          )}
        </div>
        <div className="mt-1 text-tiny font-mono uppercase text-default-400 tracking-widest truncate">
          {
            {
              en: props.LL.ANKI.LANGUAGES.ENGLISH(),
              ru: props.LL.ANKI.LANGUAGES.RUSSIAN(),
              km: props.LL.ANKI.LANGUAGES.KHMER(),
            }[word_or_sentence__language]
          }
        </div>
      </div>

      {/* 3. Actions (Fill Remaining Space, 2 Rows, Horizontal Scroll) */}
      <ScrollShadow {...scrollShadowProps}>
        <div className={actionGridClassName}>
          <DetailViewActions {...props} />
        </div>
      </ScrollShadow>
    </CardHeader>
  )
}

const DetailViewHeaderSentence = (props: DetailViewHeaderProps_SentenceAnalyzer) => {
  return (
    <CardHeader className="pt-[calc(env(safe-area-inset-top))] flex items-center gap-2 h-auto min-h-[5rem]">
      {props.backButton_goBack && <DetailViewBackButton onPress={props.backButton_goBack} />}

      {/* Central Text */}
      <div className="max-w-[40%] min-w-0 shrink-0 truncate">{props.header}</div>

      {/* Actions */}
      <ScrollShadow {...scrollShadowProps}>
        <div className={actionGridClassName}>
          <DetailViewActions {...props} />
        </div>
      </ScrollShadow>
    </CardHeader>
  )
}

const AnkiFrontHeaderShown = (props: DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_Shown) => {
  return (
    <CardHeader className="pt-[calc(env(safe-area-inset-top))] flex items-center gap-2 h-auto min-h-[5rem]">
      {props.backButton_goBack && <DetailViewBackButton onPress={props.backButton_goBack} />}

      <div className="flex-1">
        <span className="text-small uppercase text-default-400 font-bold tracking-widest truncate">{props.header}</span>
      </div>

      <DetailViewActions {...props} />
    </CardHeader>
  )
}

const AnkiFrontHeaderNotShown = (props: DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown) => {
  return (
    <CardHeader className="pt-[calc(env(safe-area-inset-top))] flex items-center gap-2 h-auto min-h-[5rem]">
      {props.backButton_goBack && <DetailViewBackButton onPress={props.backButton_goBack} />}

      <div className="flex-1">
        <span className="text-small uppercase text-default-400 font-bold tracking-widest truncate">{props.header}</span>
      </div>

      <DetailViewActions {...props} />
    </CardHeader>
  )
}

const DetailViewHeaderImpl = (props: DetailViewHeaderProps) => {
  const { LL } = useI18nContext()

  switch (props.type) {
    case 'sentence_analyzer':
      return <DetailViewHeaderSentence {...props} />
    case 'known_word':
    case 'anki_game_back':
      return <DetailViewHeaderWord {...props} LL={LL} />
    case 'anki_game_front_and_khmer_words_are_shown':
      return <AnkiFrontHeaderShown {...props} />
    case 'anki_game_front_and_khmer_words_are_not_shown':
      return <AnkiFrontHeaderNotShown {...props} />
  }
}

export const DetailViewHeader = React.memo(DetailViewHeaderImpl)
