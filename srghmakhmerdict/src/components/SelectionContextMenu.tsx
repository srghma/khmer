import React, { useRef, useCallback } from 'react'
import { Card, CardBody } from '@heroui/card'
import { Listbox, ListboxItem } from '@heroui/listbox'
import { HiMagnifyingGlass } from 'react-icons/hi2'
import { createPortal } from 'react-dom'

import { executeNativeTts, executeGoogleTts, mapModeToNativeLang } from '../utils/tts'
import { type DictionaryLanguage } from '../types'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { NativeSpeakerIcon } from './NativeSpeakerIcon'
import { useTextSelection } from '../hooks/useTextSelection'
import { KhmerAnalyzer } from './KhmerAnalyzer'
import { SiGoogletranslate } from 'react-icons/si'

// --- 1. Helper moved outside component (Pure Function) ---
const detectMode = (text: string, currentMode: DictionaryLanguage): DictionaryLanguage => {
  const t = text.trim()

  if (!t) return currentMode
  const firstChar = t.charAt(0)

  if (/\p{Script=Khmer}/u.test(firstChar)) return 'km'
  if (/\p{Script=Cyrillic}/u.test(firstChar)) return 'ru'
  if (/[a-zA-Z]/.test(firstChar)) return 'en'

  return currentMode
}

interface SelectionContextMenuProps {
  currentMode: DictionaryLanguage
  onSearch: (text: string) => void
  containerRef?: React.RefObject<HTMLElement | null>
}

// --- 2. Main Component ---
export const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({ currentMode, onSearch, containerRef }) => {
  // Use extracted hook for logic
  const { visible, position, selectedText, clearSelection, setVisible } = useTextSelection(containerRef)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleAction = useCallback(
    async (key: React.Key) => {
      const action = key as 'search' | 'native' | 'google'

      if (!selectedText) return

      // Logic now relies on external pure function, so no dependency on unstable internal function
      const detectedMode = detectMode(selectedText, currentMode)
      const textToUse = selectedText as NonEmptyStringTrimmed

      switch (action) {
        case 'search':
          onSearch(selectedText)
          break
        case 'native':
          executeNativeTts(textToUse, mapModeToNativeLang(detectedMode))
          break
        case 'google':
          await executeGoogleTts(textToUse, detectedMode)
          break
      }

      setVisible(false)
      clearSelection()
    },
    [selectedText, onSearch, currentMode, setVisible, clearSelection],
  )

  if (!visible) return null

  // Use Portal to ensure it floats above everything (z-index battles)
  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
      style={{ top: position.y, left: position.x }}
    >
      <Card className="shadow-lg border border-default-200 dark:border-default-100 bg-content1/90 backdrop-blur-md">
        <CardBody className="p-1">
          <Listbox aria-label="Context Menu Actions" variant="light" onAction={handleAction}>
            <ListboxItem
              key="search"
              className="group"
              startContent={<HiMagnifyingGlass className="text-xl text-primary" />}
              textValue="Search"
            >
              <span className="font-medium group-hover:text-primary transition-colors">
                Search &quot;{selectedText.length > 15 ? selectedText.slice(0, 12) + '...' : selectedText}&quot;
              </span>
            </ListboxItem>
            <ListboxItem
              key="native"
              startContent={<NativeSpeakerIcon className="text-xl text-default-500" />}
              textValue="Native"
            >
              Speak Native
            </ListboxItem>
            <ListboxItem
              key="google"
              startContent={<SiGoogletranslate className="text-xl text-default-500" />}
              textValue="Google"
            >
              Speak Google
            </ListboxItem>
          </Listbox>

          <div className="max-h-[300px] overflow-y-auto p-2 bg-background">
            <KhmerAnalyzer text={selectedText} />
          </div>
        </CardBody>
      </Card>
    </div>,
    document.body,
  )
}
