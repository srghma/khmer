import { useMemo } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { ScrollShadow } from '@heroui/scroll-shadow'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

import { useKhmerAnalysis } from '../KhmerAnalyzerModal/useKhmerAnalysis'
import { SegmentationPreview } from '../KhmerAnalyzerModal/SegmentationPreview'
import { KhmerAnalyzer } from '../KhmerAnalyzer'

import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import {
  KhmerWordsHidingAction,
  KhmerLinksAction,
  KhmerFontAction,
  ColorizationAction,
} from './DetailViewHeaderActions'
import { useSettings } from '../../providers/SettingsProvider'
import { DetailViewBackButton } from '../DetailViewHeader'
import { GoogleSpeechAction } from './GoogleSpeechAction'
import { NativeSpeechAction } from './NativeSpeechAction'
import { map_DictionaryLanguage_to_BCP47LanguageTagName } from '../../utils/my-bcp-47'

interface DetailViewNotFoundProps {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
  km_map: KhmerWordsMap
  onNavigate: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void

  // Navigation / Header Props
  backButton_goBack: () => void | undefined
  backButton_desktopOnlyStyles_showButton: boolean
}

export const DetailViewNotFound = ({
  word,
  mode,
  km_map,
  onNavigate,
  backButton_goBack,
  backButton_desktopOnlyStyles_showButton,
}: DetailViewNotFoundProps) => {
  // 1. Analyze the unknown text
  const { analyzedText_undefinedUnlessNonEmptyAndContainsKhmer, segmentsDict, segmentsIntl, detectedMode } =
    useKhmerAnalysis(word, mode, km_map)

  const {
    maybeColorMode,
    setMaybeColorMode,
    isKhmerLinksEnabled,
    toggleKhmerLinks,
    isKhmerWordsHidingEnabled,
    toggleKhmerWordsHiding,
    khmerFontName,
    setKhmerFontName,
    khmerFontFamily,
    fontSize_ui,
  } = useSettings()

  // 2. Styling
  const cardStyle = useMemo(
    () => ({
      fontSize: `${fontSize_ui}px`,
      fontFamily: khmerFontFamily,
    }),
    [fontSize_ui, khmerFontFamily],
  )

  return (
    <Card className="h-full w-full border-none rounded-none bg-background shadow-none" style={cardStyle}>
      {backButton_goBack && (
        <DetailViewBackButton
          desktopOnlyStyles_showButton={backButton_desktopOnlyStyles_showButton}
          onPress={backButton_goBack}
        />
      )}

      <CardHeader className="flex justify-between items-start p-6 pb-4 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider">
        <KhmerWordsHidingAction isEnabled={isKhmerWordsHidingEnabled} onToggle={toggleKhmerWordsHiding} />
        <KhmerLinksAction
          isDisabled={maybeColorMode === 'none'}
          isEnabled={isKhmerLinksEnabled}
          onToggle={toggleKhmerLinks}
        />
        <KhmerFontAction khmerFontName={khmerFontName} onChange={setKhmerFontName} />
        <ColorizationAction colorMode={maybeColorMode} onChange={setMaybeColorMode} />
        <NativeSpeechAction mode={map_DictionaryLanguage_to_BCP47LanguageTagName[detectedMode]} word={word} />
        <GoogleSpeechAction mode={detectedMode} word={word} />
      </CardHeader>

      <ScrollShadow className="flex-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <CardBody className="p-6 gap-6">
          <div className="p-4 bg-default-50 rounded-lg border border-default-200 text-center">
            <h3 className="font-semibold text-lg mb-1">Word not found</h3>
            <p className="text-default-500 text-sm">
              This text is not in the dictionary. Showing automated analysis below.
            </p>
          </div>

          {analyzedText_undefinedUnlessNonEmptyAndContainsKhmer && km_map && segmentsDict && (
            <SegmentationPreview
              km_map={km_map}
              label="Dictionary Segmentation"
              maybeColorMode="dictionary"
              segments={segmentsDict}
              onKhmerWordClick={w => onNavigate(w, mode)}
            />
          )}

          {segmentsIntl && (
            <div className="flex flex-col gap-2">
              <h4 className="text-small font-bold uppercase text-default-500">Character Analysis</h4>
              <KhmerAnalyzer segments={segmentsIntl} />
            </div>
          )}
        </CardBody>
      </ScrollShadow>
    </Card>
  )
}
