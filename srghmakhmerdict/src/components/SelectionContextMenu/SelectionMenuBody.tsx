import React, { memo, useMemo } from 'react'
import { CardBody } from '@heroui/card'
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

// --- REUSABLE BUTTON COMPONENT (Mimics ListboxItem, but ListboxItem doesnt react on mouse click) ---
const MenuButton = ({
  icon,
  children,
  onClick,
  className = '',
}: {
  icon: React.ReactNode
  children: React.ReactNode
  onClick: () => void
  className?: string
}) => {
  return (
    <button
      className={`
        group w-full flex items-center gap-3 px-3 py-2
        rounded-medium transition-colors duration-150
        hover:bg-default-100 active:bg-default-200
        cursor-pointer outline-none select-none text-start
        ${className}
      `}
      type="button"
      onClick={e => {
        // Prevent default browser behavior but allow propagation to our specific logic
        e.preventDefault()
        onClick()
      }}
    >
      <span className="text-default-500 text-lg flex-shrink-0 group-hover:text-default-900 transition-colors">
        {icon}
      </span>
      <div className="flex-1 text-small text-default-700 truncate font-medium">{children}</div>
    </button>
  )
}

// Define icons outside component to prevent re-creation
const HiMagnifyingGlass_ = <HiMagnifyingGlass className="text-xl text-primary" />
const NativeSpeakerIcon_ = <NativeSpeakerIcon className="text-xl text-default-500" />
const SiGoogletranslate_ = <SiGoogletranslate className="text-xl text-default-500" />
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

    return (
      <CardBody className="p-1 pt-0">
        <div className="flex flex-col p-1 w-full min-w-[240px] gap-0.5">
          {/* 1. Search Item */}
          <MenuButton icon={HiMagnifyingGlass_} onClick={onClosePopupAndOpenSearch}>
            <FirstNonEmptyShortDetailView
              fallback={searchFallback}
              km_map={km_map}
              mode={currentMode}
              word={selectedText}
            />
          </MenuButton>

          {/* 2. Native Speak */}
          <MenuButton
            icon={NativeSpeakerIcon_}
            onClick={() =>
              executeNativeTts(selectedText, mapModeToNativeLang(detectModeFromText(selectedText) ?? currentMode))
            }
          >
            Speak Native
          </MenuButton>

          {/* 3. Google Speak */}
          <MenuButton
            icon={SiGoogletranslate_}
            onClick={() => executeGoogleTts(selectedText, detectModeFromText(selectedText) ?? currentMode)}
          >
            Speak Google
          </MenuButton>

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
