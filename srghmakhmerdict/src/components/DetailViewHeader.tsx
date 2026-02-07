import React, { useMemo } from 'react'
import { CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'

import { type DictionaryLanguage } from '../types'
import { type KhmerFontName } from '../utils/text-processing/utils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { DetailViewActions } from './DetailView/DetailViewHeaderActions'
import { useSettings } from '../providers/SettingsProvider'
import { Button } from '@heroui/button'
import { HiArrowLeft } from 'react-icons/hi2'

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

interface HeaderProps {
  word: NonEmptyStringTrimmed | undefined
  displayWordHtml: NonEmptyStringTrimmed | undefined
  phonetic: NonEmptyStringTrimmed | undefined
  mode: DictionaryLanguage
  isFav: boolean
  toggleFav: () => void
  backButton_goBack: () => void | undefined
  backButton_desktopOnlyStyles_showButton: boolean
  khmerFontName: KhmerFontName
  setKhmerFontName: (v: KhmerFontName) => void
}

const DetailViewHeaderImpl = (props: HeaderProps) => {
  const {
    word,
    displayWordHtml,
    phonetic,
    mode,
    backButton_goBack,
    backButton_desktopOnlyStyles_showButton,
    khmerFontName,
    setKhmerFontName,
    isFav,
    toggleFav,
  } = props

  // Pull settings from context here to pass into the pure Actions component
  const {
    maybeColorMode,
    setMaybeColorMode,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    isKhmerWordsHidingEnabled,
    toggleKhmerWordsHiding,
    khmerFontFamily,
  } = useSettings()

  const h1Style = useMemo(() => (mode === 'km' ? { fontFamily: khmerFontFamily } : undefined), [khmerFontFamily, mode])

  const h1Html = useMemo(() => (displayWordHtml ? { __html: displayWordHtml } : undefined), [displayWordHtml])

  return (
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider">
      {backButton_goBack && (
        <DetailViewBackButton
          desktopOnlyStyles_showButton={backButton_desktopOnlyStyles_showButton}
          onPress={backButton_goBack}
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
        <div className="mt-1 text-tiny font-mono uppercase text-default-400 tracking-widest">{mode} Dictionary</div>
      </div>

      <DetailViewActions
        isFav={isFav}
        isKhmerLinksEnabled={isKhmerLinksEnabled}
        isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        khmerFontName={khmerFontName}
        maybeColorMode={maybeColorMode}
        mode={mode}
        setKhmerFontName={setKhmerFontName}
        setMaybeColorMode={setMaybeColorMode}
        toggleFav={toggleFav}
        toggleKhmerLinks={toggleKhmerLinks}
        toggleKhmerWordsHiding={toggleKhmerWordsHiding}
        word={word}
      />
    </CardHeader>
  )
}

export const DetailViewHeader = React.memo(DetailViewHeaderImpl)
