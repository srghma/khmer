import type { WordsHidingMode } from '../../providers/SettingsProvider'
import React, { memo, useMemo, useRef } from 'react'
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
import { colorizeHtml } from '../../utils/text-processing/html'
import { useDictionary } from '../../providers/DictionaryProvider'
import { calculateKhmerAndNonKhmerContentStyles, useKhmerAndNonKhmerClickListener } from '../../hooks/useKhmerLinks'
import type { DictionaryLanguage } from '../../types'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { setLocation_khmerWord_ifInDictionary } from '../../utils/url-navigation'
import { useAppToast } from '../../providers/ToastProvider'
import { useLocation } from 'wouter'

interface DetailViewBackButtonProps {
  onPress: () => void
  // desktopOnlyStyles_showButton: boolean
}

export const DetailViewBackButton = React.memo(function DetailViewBackButton({ onPress }: DetailViewBackButtonProps) {
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
  khmerWordsHidingMode: WordsHidingMode
  setKhmerWordsHidingMode: (v: WordsHidingMode) => void

  nonKhmerWordsHidingMode: WordsHidingMode
  setNonKhmerWordsHidingMode: (v: WordsHidingMode) => void
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
  khmerWordsHidingMode: WordsHidingMode
  setKhmerWordsHidingMode: (v: WordsHidingMode) => void
  nonKhmerWordsHidingMode: WordsHidingMode
  setNonKhmerWordsHidingMode: (v: WordsHidingMode) => void
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

export const scrollShadowProps = {
  hideScrollBar: true,
  orientation: 'horizontal' as const,
  // flex-1: Takes all remaining width after Title
  // min-w-0: Allows shrinking below content size (CRITICAL for scroll to trigger)
  className: 'flex-1 min-w-0 h-full pr-[env(safe-area-inset-right)]',
}

export const actionGridClassName = 'flex items-center gap-1 h-full w-max ml-auto'

// -----------------------------------

const DetailViewHeaderWord_WordHeader = memo(function DetailViewHeaderWord_WordHeader({
  word_displayHtml,
  word_or_sentence__language,
  maybeColorMode,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isKhmerLinkEnabled,
}: {
  word_displayHtml: NonEmptyStringTrimmed
  word_or_sentence__language: DictionaryLanguage
  maybeColorMode: MaybeColorizationMode
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isKhmerLinkEnabled: boolean
}) {
  const { km_map } = useDictionary()
  const { LL } = useI18nContext()
  const toast = useAppToast()
  const [, setLocation] = useLocation()

  const h1Html = useMemo(() => {
    if (!word_displayHtml) return undefined
    if (word_or_sentence__language === 'km') {
      const html = colorizeHtml(
        word_displayHtml,
        maybeColorMode,
        km_map,
        true,
        undefined,
        undefined,
        khmerWordsHidingMode,
      )

      return { __html: html }
    }

    return { __html: word_displayHtml }
  }, [word_displayHtml, word_or_sentence__language, maybeColorMode, km_map, khmerWordsHidingMode])

  const h1ClassName = useMemo(() => {
    const common = 'font-bold text-foreground text-xl truncate'

    const khmerContentClass =
      word_or_sentence__language === 'km'
        ? calculateKhmerAndNonKhmerContentStyles(false, khmerWordsHidingMode, nonKhmerWordsHidingMode, false, false)
        : undefined

    return `${common} ${khmerContentClass}`
  }, [word_or_sentence__language, khmerWordsHidingMode, nonKhmerWordsHidingMode])

  const containerRef = useRef<HTMLDivElement>(null)

  const isKhmerLinksEnabled_ifTrue_passOnNavigateKm: ((w: TypedKhmerWord) => void) | undefined = useMemo(() => {
    if (!isKhmerLinkEnabled) return undefined

    return (w: TypedKhmerWord) => {
      setLocation_khmerWord_ifInDictionary(w, km_map, toast, setLocation, LL)
    }
  }, [isKhmerLinkEnabled, km_map, toast, LL, setLocation])

  useKhmerAndNonKhmerClickListener(
    containerRef,
    isKhmerLinksEnabled_ifTrue_passOnNavigateKm,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    false,
  )

  return <h1 dangerouslySetInnerHTML={h1Html} ref={containerRef} className={h1ClassName} />
})

const DetailViewHeaderWord = (
  props: (DetailViewHeaderProps_KnownWord | DetailViewHeaderProps_AnkiGame_Back) & { LL: TranslationFunctions },
) => {
  const { phonetic, word_or_sentence__language } = props

  return (
    <CardHeader className="pt-[calc(env(safe-area-inset-top))] flex items-center gap-2 h-auto min-h-[5rem]">
      {/* 1. Back Button (Always Visible) */}
      {props.backButton_goBack && <DetailViewBackButton onPress={props.backButton_goBack} />}

      {/* 2. Central Text (Max 40%, Truncated) */}
      <div className="flex flex-col justify-center max-w-[40%] min-w-0 shrink-0 mr-auto">
        <DetailViewHeaderWord_WordHeader
          isKhmerLinkEnabled={props.isKhmerLinksEnabled}
          khmerWordsHidingMode={props.khmerWordsHidingMode}
          maybeColorMode={props.maybeColorMode}
          nonKhmerWordsHidingMode={props.nonKhmerWordsHidingMode}
          word_displayHtml={props.word_displayHtml}
          word_or_sentence__language={props.word_or_sentence__language}
        />
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
