import { memo, useMemo } from 'react'
import { CardBody } from '@heroui/card'
import { HiMagnifyingGlass } from 'react-icons/hi2'

import { KhmerAnalyzer } from '../KhmerAnalyzer'
import { FirstNonEmptyShortDetailView } from './FirstNonEmptyShortDetailView'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict/index'
import { generateTextSegments, type TextSegment } from '../../utils/text-processing/text' // Adjust import path as needed
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { detectModeFromText } from '../../utils/detectModeFromText'
import { GoogleSpeechAction } from './MenuButtons/GoogleSpeechAction'
import { NativeSpeechAction } from './MenuButtons/NativeSpeechAction'
import { MenuButton } from './MenuButton'
import { map_DictionaryLanguage_to_BCP47LanguageTagName } from '../../utils/my-bcp-47'

// Define icons outside component to prevent re-creation
const HiMagnifyingGlass_ = <HiMagnifyingGlass className="text-xl text-primary" />
const KhmerKaIcon = <span className="text-xl text-default-500">ក</span>

export interface SelectionMenuBodyProps {
  selectedText: NonEmptyStringTrimmed
  km_map: KhmerWordsMap
  currentMode: DictionaryLanguage
  onClosePopupAndOpenSearch: () => void
  onClosePopupAndKhmerAnalyzerModal: () => void
}

export const SelectionMenuBody = memo<SelectionMenuBodyProps>(
  ({ selectedText, km_map, currentMode, onClosePopupAndOpenSearch, onClosePopupAndKhmerAnalyzerModal }) => {
    // --- Data Preparation ---

    const searchFallback = useMemo(() => {
      const truncatedText = selectedText.length > 15 ? selectedText.slice(0, 12) + '...' : selectedText
      const known = km_map.has(selectedText)

      return (
        <span className="font-medium group-hover:text-primary transition-colors">
          {known ? 'Open' : 'Search'} &quot;{truncatedText}&quot;
        </span>
      )
    }, [selectedText, km_map])

    const segments: NonEmptyArray<TextSegment> | undefined = useMemo(() => {
      if (selectedText.length > 20) return undefined
      if (!km_map) return undefined
      const k = strToContainsKhmerOrUndefined(selectedText)

      if (!k) return undefined

      return generateTextSegments(k, 'segmenter', km_map)
    }, [selectedText, km_map])

    const resolvedMode = useMemo(() => detectModeFromText(selectedText) ?? currentMode, [selectedText, currentMode])

    return (
      <CardBody className="p-1 pt-0">
        <div className="flex flex-col p-1 w-full min-w-[240px] gap-0.5">
          {/* 1. Search Item */}
          <MenuButton icon={HiMagnifyingGlass_} onClick={onClosePopupAndOpenSearch}>
            <FirstNonEmptyShortDetailView
              colorizationMode="segmenter"
              fallback={searchFallback}
              km_map={km_map}
              mode={currentMode}
              word={selectedText}
            />
          </MenuButton>

          {/* 2. Native Speak - Now using Global Hook Component */}
          <NativeSpeechAction mode={map_DictionaryLanguage_to_BCP47LanguageTagName[resolvedMode]} word={selectedText} />

          {/* 3. Google Speak - Now using Global Hook Component */}
          <GoogleSpeechAction mode={resolvedMode} word={selectedText} />

          {/* 4. Khmer Analyzer */}
          <MenuButton icon={KhmerKaIcon} onClick={onClosePopupAndKhmerAnalyzerModal}>
            Open Khmer Analyzer
          </MenuButton>
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
