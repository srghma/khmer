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
}

export interface DetailViewHeaderProps_SentenceAnalyzer extends DetailViewHeaderProps_Common {
  type: 'sentence_analyzer'
  header: React.ReactNode
}

export type DetailViewHeaderProps = DetailViewHeaderProps_KnownWord | DetailViewHeaderProps_SentenceAnalyzer

const DetailViewHeaderImpl = (props: DetailViewHeaderProps) => {
  const { type } = props

  const isKnownWord = type === 'known_word'

  const khmerFontFamily = isKnownWord ? props.khmerFontFamily : undefined
  const word_displayHtml = isKnownWord ? props.word_displayHtml : undefined

  const h1Style = useMemo(
    () => (props.word_or_sentence__language === 'km' && khmerFontFamily ? { fontFamily: khmerFontFamily } : undefined),
    [props.word_or_sentence__language, type, khmerFontFamily],
  )

  const h1Html = useMemo(() => (word_displayHtml ? { __html: word_displayHtml } : undefined), [word_displayHtml])

  return (
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider">
      {props.backButton_goBack && (
        <DetailViewBackButton
          desktopOnlyStyles_showButton={props.backButton_desktopOnlyStyles_showButton}
          onPress={props.backButton_goBack}
        />
      )}

      <div className="flex-1">
        {isKnownWord ? (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              {h1Html && (
                <h1 dangerouslySetInnerHTML={h1Html} className="font-bold text-foreground font-khmer" style={h1Style} />
              )}
              {props.phonetic && (
                <Chip className="font-mono" color="secondary" size="sm" variant="flat">
                  /{props.phonetic}/
                </Chip>
              )}
            </div>
            <div className="mt-1 text-tiny font-mono uppercase text-default-400 tracking-widest">
              {props.word_or_sentence__language} Dictionary
            </div>
          </>
        ) : (
          props.header
        )}
      </div>

      <DetailViewActions {...props} />
    </CardHeader>
  )
}

export const DetailViewHeader = React.memo(DetailViewHeaderImpl)
