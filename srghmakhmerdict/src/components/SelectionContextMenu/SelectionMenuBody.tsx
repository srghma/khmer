import React, { memo, useCallback, useMemo } from 'react'
import { CardBody } from '@heroui/card'
import { Listbox, ListboxItem } from '@heroui/listbox'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { SiGoogletranslate } from 'react-icons/si'

import { NativeSpeakerIcon } from '../NativeSpeakerIcon'
import { KhmerAnalyzer } from '../KhmerAnalyzer'
import { FirstNonEmptyShortDetailView } from './FirstNonEmptyShortDetailView'

import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../../types'
import type { KhmerWordsMap } from '../../db/dict'
import { generateTextSegments, type TextSegment } from '../../utils/text-processing/text' // Adjust import path as needed
import type { NonEmptyArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-array'
import { strToContainsKhmerOrUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { detectModeFromText } from '../../utils/rendererUtils'
import { executeNativeTts, mapModeToNativeLang, executeGoogleTts } from '../../utils/tts'

// Define icons outside component to prevent re-creation
const HiMagnifyingGlass_ = <HiMagnifyingGlass className="text-xl text-primary" />
const NativeSpeakerIcon_ = <NativeSpeakerIcon className="text-xl text-default-500" />
const SiGoogletranslate_ = <SiGoogletranslate className="text-xl text-default-500" />
const KhmerKaIcon = <span className="text-xl text-default-500 font-khmer">ក</span>

export interface SelectionMenuBodyProps {
  selectedText: NonEmptyStringTrimmed
  km_map: KhmerWordsMap | undefined
  currentMode: DictionaryLanguage
  onClosePopupAndOpenSearch: () => void
  onClosePopupAndKhmerAnalyzerModal: () => void
}

export const SelectionMenuBody = memo<SelectionMenuBodyProps>(
  ({ selectedText, km_map, currentMode, onClosePopupAndOpenSearch, onClosePopupAndKhmerAnalyzerModal }) => {
    // --- Data Preparation ---
    const truncatedText = useMemo(() => {
      return selectedText.length > 15 ? selectedText.slice(0, 12) + '...' : selectedText
    }, [selectedText])

    const searchFallback = useMemo(
      () => (
        <span className="font-medium group-hover:text-primary transition-colors">
          Search &quot;{truncatedText}&quot;
        </span>
      ),
      [truncatedText],
    )

    const segments: NonEmptyArray<TextSegment> | undefined = useMemo(() => {
      if (selectedText.length > 20) return undefined
      if (!km_map) return undefined
      const k = strToContainsKhmerOrUndefined(selectedText)

      if (!k) return undefined

      return generateTextSegments(k, 'segmenter', km_map)
    }, [selectedText, km_map])

    // 3. Handle Actions
    const handleAction = useCallback(
      async (key: React.Key) => {
        const detectedMode = () => detectModeFromText(selectedText, currentMode)

        switch (key) {
          case 'search':
            onClosePopupAndOpenSearch()
            break
          case 'native':
            executeNativeTts(selectedText, mapModeToNativeLang(detectedMode()))
            break
          case 'google':
            await executeGoogleTts(selectedText, detectedMode())
            break
          case 'khmer_analyzer':
            onClosePopupAndKhmerAnalyzerModal()
            break
          default:
            throw new Error(`unknown key ${key}`)
        }
      },
      [selectedText, currentMode, onClosePopupAndOpenSearch, onClosePopupAndKhmerAnalyzerModal],
    )

    return (
      <CardBody className="p-1 pt-0">
        <Listbox aria-label="Context Menu Actions" variant="light" onAction={handleAction}>
          <ListboxItem key="search" className="group" startContent={HiMagnifyingGlass_} textValue="Search">
            <FirstNonEmptyShortDetailView
              fallback={searchFallback}
              km_map={km_map}
              mode={currentMode}
              word={selectedText}
            />
          </ListboxItem>
          <ListboxItem key="native" startContent={NativeSpeakerIcon_} textValue="Native">
            Speak Native
          </ListboxItem>
          <ListboxItem key="google" startContent={SiGoogletranslate_} textValue="Google">
            Speak Google
          </ListboxItem>
          <ListboxItem key="khmer_analyzer" startContent={KhmerKaIcon} textValue="Khmer Analyzer">
            Open Khmer Analyzer
          </ListboxItem>
        </Listbox>

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
