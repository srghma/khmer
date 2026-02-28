import { memo, useMemo } from 'react'
import { CardBody } from '@heroui/card'
import { HiMagnifyingGlass } from 'react-icons/hi2'

import { KhmerAnalyzer } from '../KhmerAnalyzer'
import { FirstNonEmptyShortDetailView } from './FirstNonEmptyShortDetailView'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import { generateTextSegments, type TextSegment } from '../../utils/text-processing/text'
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { detectModeFromText } from '../../utils/detectModeFromText'
import { GoogleSpeechAction } from './MenuButtons/GoogleSpeechAction'
import { NativeSpeechAction } from './MenuButtons/NativeSpeechAction'
import { MenuButton } from './MenuButton'
import { map_DictionaryLanguage_to_BCP47LanguageTagName } from '../../utils/my-bcp-47'
import { useDictionary } from '../../providers/DictionaryProvider'
import { DictData_isWordInEitherOf3Dictionaries_caseInsensitive_implementation_computationallyNonExpensive } from '../../initDictionary'
import { FavoriteAction } from './MenuButtons/FavoriteAction'
import { AnkiRatingAction } from './MenuButtons/AnkiRatingAction'

const HiMagnifyingGlass_ = <HiMagnifyingGlass className="text-xl text-primary" />
const KhmerKaIcon = <span className="text-xl text-default-500">ក</span>

export interface SelectionMenuBodyProps {
  selectedText: NonEmptyStringTrimmed
  currentMode: DictionaryLanguage
  onClosePopupAndOpenSearch: () => void
  onClosePopupAndKhmerAnalyzerModal: (() => void) | undefined
}

export const SelectionMenuBody = memo<SelectionMenuBodyProps>(
  ({ selectedText, currentMode, onClosePopupAndOpenSearch, onClosePopupAndKhmerAnalyzerModal }) => {
    const dictData = useDictionary()
    const { km_map } = dictData

    const segments: NonEmptyArray<TextSegment> | undefined = useMemo(() => {
      if (selectedText.length > 20) return undefined
      const k = strToContainsKhmerOrUndefined(selectedText)

      if (!k) return undefined

      return generateTextSegments(k, 'segmenter', km_map, false)
    }, [selectedText, km_map])

    const resolvedMode = useMemo(() => detectModeFromText(selectedText) ?? currentMode, [selectedText, currentMode])

    const dictWordInfo = useMemo(
      () =>
        DictData_isWordInEitherOf3Dictionaries_caseInsensitive_implementation_computationallyNonExpensive(
          dictData,
          selectedText,
        ),
      [dictData, selectedText],
    )

    return (
      <CardBody className="p-1 pt-0">
        <div className="flex flex-col p-1 w-full min-w-[240px] gap-0.5">
          {/* 1. Search Item */}
          <MenuButton icon={HiMagnifyingGlass_} onClick={onClosePopupAndOpenSearch}>
            <FirstNonEmptyShortDetailView
              colorizationMode="segmenter"
              dictionaryMode_lonelyWordShouldBeSpilt={false}
              mode={currentMode}
              selectedText={selectedText}
            />
          </MenuButton>

          {/* 2. Favorite Button (Extracted) */}
          {dictWordInfo && (
            <>
              <FavoriteAction dictWordInfo={dictWordInfo} />
              <AnkiRatingAction dictWordInfo={dictWordInfo} />
            </>
          )}

          {/* 3. Native Speak */}
          <NativeSpeechAction mode={map_DictionaryLanguage_to_BCP47LanguageTagName[resolvedMode]} word={selectedText} />

          {/* 4. Google Speak */}
          <GoogleSpeechAction mode={resolvedMode} word={selectedText} />

          {/* 5. Khmer Analyzer */}
          {onClosePopupAndKhmerAnalyzerModal && (
            <MenuButton icon={KhmerKaIcon} onClick={onClosePopupAndKhmerAnalyzerModal}>
              Open Khmer Analyzer
            </MenuButton>
          )}
        </div>

        {segments && (
          <div className="max-h-[300px] overflow-y-auto p-2 bg-background border-t border-default-100">
            <KhmerAnalyzer segments={segments} />
          </div>
        )}
      </CardBody>
    )
  },
)

SelectionMenuBody.displayName = 'SelectionMenuBody'
