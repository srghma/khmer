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

export interface DetailViewHeaderProps_AnkiGame extends DetailViewHeaderProps_Common {
  type: 'anki_game'
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
}

export interface DetailViewHeaderProps_SentenceAnalyzer extends DetailViewHeaderProps_Common {
  type: 'sentence_analyzer'
  header: React.ReactNode
}

export type DetailViewHeaderProps =
  | DetailViewHeaderProps_KnownWord
  | DetailViewHeaderProps_SentenceAnalyzer
  | DetailViewHeaderProps_AnkiGame

const DetailViewHeaderWord = (props: DetailViewHeaderProps_KnownWord | DetailViewHeaderProps_AnkiGame) => {
  const { khmerFontFamily, word_displayHtml, phonetic, word_or_sentence__language } = props

  const h1Style = useMemo(
    () => (word_or_sentence__language === 'km' && khmerFontFamily ? { fontFamily: khmerFontFamily } : undefined),
    [word_or_sentence__language, khmerFontFamily],
  )

  const h1Html = useMemo(() => (word_displayHtml ? { __html: word_displayHtml } : undefined), [word_displayHtml])

  return (
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-6">
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
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-6">
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

const DetailViewHeaderImpl = (props: DetailViewHeaderProps) => {
  switch (props.type) {
    case 'sentence_analyzer':
      return <DetailViewHeaderSentence {...props} />
    case 'known_word':
    case 'anki_game':
      return <DetailViewHeaderWord {...props} />
  }
}

export const DetailViewHeader = React.memo(DetailViewHeaderImpl)
