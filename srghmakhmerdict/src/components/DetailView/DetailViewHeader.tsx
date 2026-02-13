import React, { useMemo } from 'react'
import { CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { DetailViewActions, type DetailViewActionsProps_Common } from './DetailViewHeaderActions'
import { Button } from '@heroui/button'
import { HiArrowLeft } from 'react-icons/hi2'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'

interface DetailViewBackButtonProps {
  onPress: () => void
  desktopOnlyStyles_showButton: boolean
}

export const DetailViewBackButton = React.memo(
  ({ onPress, desktopOnlyStyles_showButton }: DetailViewBackButtonProps) => {
    return (
      <Button
        isIconOnly
        className={`mr-3 text-default-500 -ml-2 ${desktopOnlyStyles_showButton ? '' : 'md:hidden'}`}
        variant="light"
        onPress={onPress}
      >
        <HiArrowLeft className="w-6 h-6" />
      </Button>
    )
  },
)

DetailViewBackButton.displayName = 'DetailViewBackButton'

export interface DetailViewHeaderProps_Common extends DetailViewActionsProps_Common {
  backButton_goBack: (() => void) | undefined
  backButton_desktopOnlyStyles_showButton: boolean
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

const DetailViewHeaderWord = (props: DetailViewHeaderProps_KnownWord | DetailViewHeaderProps_AnkiGame_Back) => {
  const { khmerFontFamily, word_displayHtml, phonetic, word_or_sentence__language } = props

  const h1Style = useMemo(
    () => (word_or_sentence__language === 'km' && khmerFontFamily ? { fontFamily: khmerFontFamily } : undefined),
    [word_or_sentence__language, khmerFontFamily],
  )

  const h1Html = useMemo(() => (word_displayHtml ? { __html: word_displayHtml } : undefined), [word_displayHtml])

  return (
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(env(safe-area-inset-top))]">
      {props.backButton_goBack && (
        <DetailViewBackButton
          desktopOnlyStyles_showButton={props.backButton_desktopOnlyStyles_showButton}
          onPress={props.backButton_goBack}
        />
      )}

      <div className="flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          {h1Html && (
            <h1 dangerouslySetInnerHTML={h1Html} className="font-bold text-foreground font-khmer" style={h1Style} />
          )}
          {phonetic && (
            <Chip className="font-mono" color="secondary" size="sm" variant="flat">
              /{phonetic}/
            </Chip>
          )}
        </div>
        <div className="mt-1 text-tiny font-mono uppercase text-default-400 tracking-widest">
          {word_or_sentence__language} Dictionary
        </div>
      </div>

      <DetailViewActions {...props} />
    </CardHeader>
  )
}

const DetailViewHeaderSentence = (props: DetailViewHeaderProps_SentenceAnalyzer) => {
  return (
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(env(safe-area-inset-top))]">
      {props.backButton_goBack && (
        <DetailViewBackButton
          desktopOnlyStyles_showButton={props.backButton_desktopOnlyStyles_showButton}
          onPress={props.backButton_goBack}
        />
      )}
      <div className="flex-1">{props.header}</div>
      <DetailViewActions {...props} />
    </CardHeader>
  )
}

const AnkiFrontHeaderShown = (props: DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_Shown) => {
  return (
    <CardHeader className="flex justify-between items-center p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(env(safe-area-inset-top))]">
      {props.backButton_goBack && (
        <DetailViewBackButton
          desktopOnlyStyles_showButton={props.backButton_desktopOnlyStyles_showButton}
          onPress={props.backButton_goBack}
        />
      )}
      <div className="flex-1">
        <span className="text-small uppercase text-default-400 font-bold tracking-widest">{props.header}</span>
      </div>
      <DetailViewActions {...props} />
    </CardHeader>
  )
}

const AnkiFrontHeaderNotShown = (props: DetailViewHeaderProps_AnkiGame_Front_And_Khmer_Words_Are_NotShown) => {
  return (
    <CardHeader className="flex shrink-0 items-center px-6 py-4 border-b border-divider bg-content1/50 backdrop-blur-md z-10 sticky top-0 pt-[calc(env(safe-area-inset-top))]">
      {props.backButton_goBack && (
        <DetailViewBackButton
          desktopOnlyStyles_showButton={props.backButton_desktopOnlyStyles_showButton}
          onPress={props.backButton_goBack}
        />
      )}
      <div className="flex-1">
        <span className="text-small uppercase text-default-400 font-bold tracking-widest">{props.header}</span>
      </div>
      <DetailViewActions {...props} />
    </CardHeader>
  )
}

const DetailViewHeaderImpl = (props: DetailViewHeaderProps) => {
  switch (props.type) {
    case 'sentence_analyzer':
      return <DetailViewHeaderSentence {...props} />
    case 'known_word':
    case 'anki_game_back':
      return <DetailViewHeaderWord {...props} />
    case 'anki_game_front_and_khmer_words_are_shown':
      return <AnkiFrontHeaderShown {...props} />
    case 'anki_game_front_and_khmer_words_are_not_shown':
      return <AnkiFrontHeaderNotShown {...props} />
  }
}

export const DetailViewHeader = React.memo(DetailViewHeaderImpl)
