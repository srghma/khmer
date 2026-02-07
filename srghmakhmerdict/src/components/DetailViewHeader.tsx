import React, { useMemo } from 'react'
import { HiArrowLeft } from 'react-icons/hi2'
import { Button } from '@heroui/button'
import { CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'

import { type DictionaryLanguage } from '../types'
import { KHMER_FONT_FAMILY, type KhmerFontName } from '../utils/text-processing/utils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { DetailViewActions } from './DetailViewHeaderActions'
import { useSettings } from '../providers/SettingsProvider'

interface HeaderProps {
  displayWordHtml: NonEmptyStringTrimmed | undefined
  phonetic: NonEmptyStringTrimmed | undefined
  mode: DictionaryLanguage
  isFav: boolean
  toggleFav: () => void
  backButton_goBack: () => void | undefined
  backButton_desktopOnlyStyles_showButton: boolean
  khmerFontName: KhmerFontName
  setKhmerFontName: (v: KhmerFontName) => void
  handleNativeSpeak: () => void
  handleGoogleSpeak: () => void
  isGoogleSpeaking: boolean
}

const DetailViewHeaderImpl = (props: HeaderProps) => {
  const {
    displayWordHtml,
    phonetic,
    mode,
    backButton_goBack,
    backButton_desktopOnlyStyles_showButton,
    khmerFontName,
    setKhmerFontName,
    isFav,
    toggleFav,
    handleNativeSpeak,
    handleGoogleSpeak,
    isGoogleSpeaking,
  } = props

  // Pull settings from context here to pass into the pure Actions component
  const {
    maybeColorMode,
    setMaybeColorMode,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    isKhmerWordsHidingEnabled,
    toggleKhmerWordsHiding,
  } = useSettings()

  const h1Style = useMemo(
    () => ({
      fontFamily: KHMER_FONT_FAMILY[khmerFontName],
    }),
    [khmerFontName],
  )

  const h1Html = useMemo(() => (displayWordHtml ? { __html: displayWordHtml } : undefined), [displayWordHtml])

  return (
    <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider">
      {backButton_goBack && (
        <Button
          isIconOnly
          className={`mr-3 text-default-500 -ml-2 ${backButton_desktopOnlyStyles_showButton ? '' : 'md:hidden'}`}
          variant="light"
          onPress={backButton_goBack}
        >
          <HiArrowLeft className="w-6 h-6" />
        </Button>
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
        handleGoogleSpeak={handleGoogleSpeak}
        handleNativeSpeak={handleNativeSpeak}
        isFav={isFav}
        isGoogleSpeaking={isGoogleSpeaking}
        isKhmerLinksEnabled={isKhmerLinksEnabled}
        isKhmerWordsHidingEnabled={isKhmerWordsHidingEnabled}
        khmerFontName={khmerFontName}
        maybeColorMode={maybeColorMode}
        setKhmerFontName={setKhmerFontName}
        setMaybeColorMode={setMaybeColorMode}
        toggleFav={toggleFav}
        toggleKhmerLinks={toggleKhmerLinks}
        toggleKhmerWordsHiding={toggleKhmerWordsHiding}
      />
    </CardHeader>
  )
}

export const DetailViewHeader = React.memo(DetailViewHeaderImpl)
