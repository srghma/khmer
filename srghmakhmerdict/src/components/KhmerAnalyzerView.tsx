import React, { useCallback, memo, useEffect, useRef, useState, useMemo } from 'react'
import { Button } from '@heroui/button'
import { HiArrowLeft } from 'react-icons/hi2'
import { useLocation } from 'wouter'
import { safeBack } from '../utils/safeBack'
import { GoogleTranslateTextarea } from './GoogleTranslateTextarea/GoogleTranslateTextarea'
import { useSettings } from '../providers/SettingsProvider'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import type { TextSegment } from '../utils/text-processing/text'
import type { TextSegmentEnhanced } from '../utils/text-processing/text-enhanced'
import { Alert } from '@heroui/alert'
import { Spinner } from '@heroui/react'
import type { TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import type { NonEmptyRecord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-record'
import type { ShortDefinition } from '../db/dict'
import { KhmerAnalyzer } from './KhmerAnalyzer'
import { SegmentationPreview } from './KhmerAnalyzerModal/SegmentationPreview'
import { useKhmerAnalysis, type KhmerAnalysisResult } from './KhmerAnalyzerModal/useKhmerAnalysis'
import { useDebounce } from 'use-debounce'
import { useI18nContext } from '../i18n/i18n-react-custom'
import {
  getUrlSearchParam,
  KHMER_ANALYZER_PARAM_TEXT,
  makeKhmerAnalyzerUrl,
  setLocation_khmerWord_ifInDictionary,
} from '../utils/url-navigation'
import { type WordsHidingMode } from '../providers/SettingsProvider'
import { RenderHtmlColorized } from './DetailView/atoms'
import { basicMarkdownToHtml } from '../utils/text-processing/markdown'

import { useAnalyzerHistory } from '../hooks/useAnalyzerHistory'
import { AnalyzerHistoryButton } from './KhmerAnalyzerModal/AnalyzerHistoryButton'
import { AnalyzerHeaderToolbar } from './KhmerAnalyzerModal/AnalyzerHeaderToolbar'
import { ReactSelectionPopup } from './react-selection-popup/ReactSelectionPopup'
import { sanitizeTextForAnalyzer } from '../utils/sanitizeTextForAnalyzer'
import { SelectionMenuBody } from './SelectionContextMenu/SelectionMenuBody'
import { useDictionary } from '../providers/DictionaryProvider'
import { useAppToast } from '../providers/ToastProvider'

interface HeaderTogglerOfSegmenterProps {
  children: (data: NonEmptyArray<TextSegment | TextSegmentEnhanced>) => React.ReactNode
  initiallySelected: 'dict' | 'intl'
  segmentsDict: NonEmptyArray<TextSegment | TextSegmentEnhanced> | undefined
  segmentsIntl: NonEmptyArray<TextSegment | TextSegmentEnhanced> | undefined
  title: string
}

export function HeaderTogglerOfSegmenter({
  children,
  initiallySelected,
  segmentsDict,
  segmentsIntl,
  title,
}: HeaderTogglerOfSegmenterProps) {
  const { LL } = useI18nContext()
  const [selected, setSelected] = useState<'dict' | 'intl'>(() => {
    if (initiallySelected === 'dict' && segmentsDict) return 'dict'
    if (initiallySelected === 'intl' && segmentsIntl) return 'intl'

    return segmentsDict ? 'dict' : 'intl'
  })

  // If both are missing (should not happen if WITH_KHMER), just return null
  if (!segmentsDict && !segmentsIntl) return null

  // If one is missing, don't show the toggle button
  const canToggle = !!segmentsDict && !!segmentsIntl
  const isDict = selected === 'dict' && !!segmentsDict
  const activeSegments = isDict ? segmentsDict : segmentsIntl

  if (!activeSegments) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h4 className="text-small font-bold uppercase tracking-wider text-default-500">{title}</h4>
        {canToggle && (
          <button
            className="text-tiny text-primary border border-default-300 bg-default-100 hover:bg-default-200 rounded-full px-2 py-0.5 font-medium transition-colors"
            type="button"
            onClick={() => setSelected(prev => (prev === 'dict' ? 'intl' : 'dict'))}
          >
            {isDict ? LL.ANALYZER.USING_APP_DICT() : LL.ANALYZER.USING_INTL_SEGMENTER()}
          </button>
        )}
      </div>
      {children(activeSegments)}
    </div>
  )
}

const RenderMarkdownColorized = memo(function RenderMarkdownColorized({
  markdown,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isShowShortDetailAboutKhmerWordEnabled,
  shortDefinitions,
}: {
  markdown: NonEmptyStringTrimmed
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isShowShortDetailAboutKhmerWordEnabled: boolean
  shortDefinitions: NonEmptyRecord<TypedKhmerWord, ShortDefinition | null> | undefined
}) {
  const { LL } = useI18nContext()
  const [, setLocation] = useLocation()
  const { isKhmerLinksEnabled } = useSettings()

  const html = useMemo(() => basicMarkdownToHtml(markdown), [markdown])

  const renderPopupContent = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      return (
        <SelectionMenuBody
          currentMode={'km'}
          selectedText={selectedText}
          onClosePopupAndKhmerAnalyzerModal={undefined}
          onClosePopupAndOpenSearch={() => {
            window.getSelection()?.removeAllRanges()
            setLocation(makeKhmerAnalyzerUrl(sanitizeTextForAnalyzer(selectedText)))
          }}
        />
      )
    },
    [setLocation],
  )

  const { km_map } = useDictionary()
  const toast = useAppToast()

  const handleNavigate = useCallback(
    (word: NonEmptyStringTrimmed) => {
      setLocation_khmerWord_ifInDictionary(word, km_map, toast, setLocation, LL)
    },
    [setLocation, km_map, toast, LL],
  )

  if (html.t === 'empty') {
    return (
      <Alert color="warning" variant="flat">
        {LL.ANALYZER.MARKDOWN_ERROR_EMPTY()}
      </Alert>
    )
  }

  if (html.t === 'error') {
    return (
      <Alert color="danger" variant="flat">
        {LL.ANALYZER.MARKDOWN_ERROR()}
      </Alert>
    )
  }

  return (
    <ReactSelectionPopup popupContent={renderPopupContent}>
      <RenderHtmlColorized
        className="overflow-x-auto"
        dictionaryMode_lonelyWordShouldBeSpilt={false}
        excludeWord={undefined}
        hideBrokenImages_enable={false}
        html={html.v}
        isKhmerLinksEnabled_ifTrue_passOnNavigateKm={isKhmerLinksEnabled ? handleNavigate : undefined}
        isKhmerPronunciationHidingEnabled={false}
        isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
        khmerWordsHidingMode={khmerWordsHidingMode}
        nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
        pronunciationSource={undefined}
        shortDefinitions={shortDefinitions}
      />
    </ReactSelectionPopup>
  )
})

interface KhmerAnalysisResultsProps {
  res: KhmerAnalysisResult
  khmerWordsHidingMode: WordsHidingMode
  nonKhmerWordsHidingMode: WordsHidingMode
  isShowShortDetailAboutKhmerWordEnabled: boolean
  isSegmentationEnabled: boolean
  isCharacterAnalysisEnabled: boolean
}

export const KhmerAnalysisResults: React.FC<KhmerAnalysisResultsProps> = ({
  res,
  khmerWordsHidingMode,
  nonKhmerWordsHidingMode,
  isShowShortDetailAboutKhmerWordEnabled,
  isSegmentationEnabled,
  isCharacterAnalysisEnabled,
}) => {
  const { LL } = useI18nContext()
  const { khmerAnalyzerMarkdownEnabled, isKhmerLinksEnabled } = useSettings()
  const [, setLocation] = useLocation()
  const toast = useAppToast()
  const { km_map } = useDictionary()

  const handleNavigate = useCallback(
    (word: NonEmptyStringTrimmed) => {
      setLocation_khmerWord_ifInDictionary(word, km_map, toast, setLocation, LL)
    },
    [setLocation, km_map, toast, LL],
  )

  if (res.t === 'empty_text') {
    return <div className="py-10 text-center text-default-400 italic">{LL.ANALYZER.EMPTY_TEXT()}</div>
  }

  if (res.t === 'non_empty_text_without_at_least_one_khmer_char') {
    return (
      <Alert color="warning" variant="flat">
        {LL.ANALYZER.NO_KHMER_CHAR()}
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {(res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_are_loading' ||
        res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_request_errored' ||
        res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_request_success') && (
        <>
          {res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_are_loading' && (
            <div className="flex items-center gap-3 text-small text-primary animate-pulse">
              <Spinner size="sm" /> <span>{LL.ANALYZER.FETCHING_DEFS()}</span>
            </div>
          )}

          {res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_request_errored' && (
            <Alert color="danger" title={LL.ANALYZER.DEFS_FETCH_FAILED()} variant="flat">
              {res.e || LL.ANALYZER.DEFS_FETCH_ERROR()}
            </Alert>
          )}

          {khmerAnalyzerMarkdownEnabled && (
            <div className="p-4 rounded-medium border border-divider bg-content2/30">
              <RenderMarkdownColorized
                isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
                khmerWordsHidingMode={khmerWordsHidingMode}
                markdown={res.analyzedText}
                nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
                shortDefinitions={
                  res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_request_success'
                    ? res.definitions
                    : undefined
                }
              />
            </div>
          )}

          {isSegmentationEnabled && (
            <HeaderTogglerOfSegmenter
              initiallySelected="dict"
              segmentsDict={res.segmentsDict}
              segmentsIntl={res.segmentsIntl}
              title={LL.ANALYZER.SEGMENTATION()}
            >
              {segments => (
                <SegmentationPreview
                  maybeColorMode="dictionary"
                  segments={segments}
                  shortDefinitions={
                    res.t === 'non_empty_text_with_at_least_one_khmer_char__defs_request_success'
                      ? res.definitions
                      : undefined
                  }
                  onKhmerWordClick={isKhmerLinksEnabled ? handleNavigate : undefined}
                />
              )}
            </HeaderTogglerOfSegmenter>
          )}

          {isCharacterAnalysisEnabled && (
            <HeaderTogglerOfSegmenter
              initiallySelected="intl"
              segmentsDict={res.segmentsDict}
              segmentsIntl={res.segmentsIntl}
              title={LL.ANALYZER.CHARACTER_ANALYSIS()}
            >
              {segments => <KhmerAnalyzer segments={segments} />}
            </HeaderTogglerOfSegmenter>
          )}
        </>
      )}
    </div>
  )
}

interface KhmerAnalyzerViewProps {
  initialText?: NonEmptyStringTrimmed
}

export const KhmerAnalyzerView: React.FC<KhmerAnalyzerViewProps> = memo(({ initialText: _ignored }) => {
  const { LL } = useI18nContext()
  const [, setLocation] = useLocation()
  const {
    filters,
    khmerWordsHidingMode,
    nonKhmerWordsHidingMode,
    isShowShortDetailAboutKhmerWordEnabled,
    khmerAnalyzerEnabledSegmenters,
    khmerAnalyzerSegmentationEnabled,
    khmerAnalyzerCharacterAnalysisEnabled,
    maybeColorMode,
  } = useSettings()

  const [text_, setText] = useState<string>(() => getUrlSearchParam(KHMER_ANALYZER_PARAM_TEXT) ?? '')
  const textNonEmpty = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(text_), [text_])

  const [debouncedText] = useDebounce(textNonEmpty, 1500)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false

      return
    }
    const targetUrl = makeKhmerAnalyzerUrl(debouncedText)

    setLocation(targetUrl, { replace: true })
  }, [debouncedText, setLocation])

  useEffect(() => {
    const handlePopState = () => {
      const url = getUrlSearchParam(KHMER_ANALYZER_PARAM_TEXT)
      const urlText = url ? String_toNonEmptyString_orUndefined_afterTrim(url) : undefined

      if (!urlText) return

      if (urlText !== debouncedText) {
        setText(urlText)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [debouncedText])

  const handleBack = useCallback(() => {
    safeBack(setLocation)
  }, [setLocation])

  const res = useKhmerAnalysis(debouncedText, filters.km.mode === 'all' ? 'km' : 'km', khmerAnalyzerEnabledSegmenters)

  const { history, saveToHistory, removeFromHistory, clearHistory } = useAnalyzerHistory()

  return (
    <>
      <div className="flex flex-col shrink-0 bg-content1/50 backdrop-blur-md z-10 sticky top-0 border-b border-divider pt-[calc(env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 w-full overflow-x-auto px-4 py-2 min-w-0">
          <Button isIconOnly className="mr-2 text-default-500 shrink-0" variant="light" onPress={handleBack}>
            <HiArrowLeft className="w-6 h-6" />
          </Button>

          <div className="shrink-0">
            <h1 className="text-xl font-bold">{LL.ANALYZER.TITLE()}</h1>
          </div>

          <div className="shrink-0">
            <AnalyzerHistoryButton
              currentText={debouncedText}
              history={history}
              onClear={clearHistory}
              onRemove={removeFromHistory}
              onSave={saveToHistory}
              onSelect={setText}
            />
          </div>

          <AnalyzerHeaderToolbar />

          {/* Standard spacer is now sufficient since w-screen is fixed */}
          <div className="w-2 shrink-0" />
        </div>
      </div>

      {/* Added flex-1 to ensuring filling available space in parent container */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <GoogleTranslateTextarea
            defaultTargetLang="en"
            labelPlacement="outside"
            maxRows={10}
            maybeColorMode={maybeColorMode}
            minRows={3}
            placeholder={LL.ANALYZER.PLACEHOLDER()}
            value_toShowInBottom={res.t !== 'empty_text' ? res.analyzedText : undefined}
            value_toShowInTextArea={text_}
            variant="faded"
            onValueChange={setText}
          />

          <KhmerAnalysisResults
            isCharacterAnalysisEnabled={khmerAnalyzerCharacterAnalysisEnabled}
            isSegmentationEnabled={khmerAnalyzerSegmentationEnabled}
            isShowShortDetailAboutKhmerWordEnabled={isShowShortDetailAboutKhmerWordEnabled}
            khmerWordsHidingMode={khmerWordsHidingMode}
            nonKhmerWordsHidingMode={nonKhmerWordsHidingMode}
            res={res}
          />
        </div>
      </div>
    </>
  )
})

KhmerAnalyzerView.displayName = 'KhmerAnalyzerView'
