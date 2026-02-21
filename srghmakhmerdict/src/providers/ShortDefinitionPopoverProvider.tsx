import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@heroui/popover'
import { type TypedKhmerWord } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/khmer-word'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useGoogleOrNativeTts } from '../hooks/useGoogleOrNativeTts'
import { useAppToast } from './ToastProvider'
import { unknown_to_errorMessage } from '../utils/errorMessage'
import type { ShortDefinition } from '../db/dict'
import { Set_toNonEmptySet_orUndefined } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { useKhmerDefinitions } from '../hooks/useKhmerDefinitions'

interface ShortDefinitionPopoverContextType {
  showPopover: (word: TypedKhmerWord, anchor: HTMLElement, definition?: ShortDefinition | null) => void
  hidePopover: () => void
}

const ShortDefinitionPopoverContext = createContext<ShortDefinitionPopoverContextType | undefined>(undefined)

export const useShortDefinitionPopover = () => {
  const context = useContext(ShortDefinitionPopoverContext)

  if (!context) {
    throw new Error('useShortDefinitionPopover must be used within a ShortDefinitionPopoverProvider')
  }

  return context
}

export const ShortDefinitionPopoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tts = useGoogleOrNativeTts()
  const toast = useAppToast()
  const [activeWord, setActiveWord] = useState<TypedKhmerWord | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [definitionState, setDefinitionState] = useState<ShortDefinition | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const showPopover = useCallback(
    (word: TypedKhmerWord, targetAnchor: HTMLElement, def?: ShortDefinition | null) => {
      setActiveWord(word)
      setAnchor(targetAnchor)
      // Save definition passed in, or default to some other behavior if we want to fallback
      setDefinitionState(def ?? null)
      setIsOpen(true)

      // Trigger TTS
      if (tts.t === 'ready') {
        tts.speak(word, 'km').catch((err: unknown) => {
          toast.error('TTS Failed' as NonEmptyStringTrimmed, unknown_to_errorMessage(err))
        })
      }
    },
    [tts, toast],
  )

  const hidePopover = useCallback(() => {
    setIsOpen(false)
  }, [])

  const uniqueWords = useMemo(
    () => (activeWord ? Set_toNonEmptySet_orUndefined(new Set([activeWord])) : undefined),
    [activeWord],
  )
  const khmerDefsResult = useKhmerDefinitions(uniqueWords)
  const fetchedDef = khmerDefsResult.t === 'success' && activeWord ? khmerDefsResult.definitions[activeWord] : null

  const definition = definitionState || fetchedDef

  const contextValue = useMemo(
    () => ({
      showPopover,
      hidePopover,
    }),
    [showPopover, hidePopover],
  )

  return (
    <ShortDefinitionPopoverContext.Provider value={contextValue}>
      {children}
      {anchor && (
        <Popover
          backdrop="transparent"
          isOpen={isOpen}
          placement="bottom"
          shouldBlockScroll={false}
          showArrow={true}
          style={{
            position: 'absolute',
            left: anchor.getBoundingClientRect().left + window.scrollX,
            top: anchor.getBoundingClientRect().top + window.scrollY,
          }}
          triggerType="listbox" // Use a trigger type that doesn't interfere with the anchor's own events
          onOpenChange={setIsOpen}
        >
          <div
            style={{
              position: 'absolute',
              top: anchor.getBoundingClientRect().top + window.scrollY,
              left: anchor.getBoundingClientRect().left + window.scrollX,
              width: anchor.offsetWidth,
              height: anchor.offsetHeight,
              pointerEvents: 'none',
              visibility: 'hidden',
            }}
          >
            <PopoverTrigger>
              <div style={{ width: '100%', height: '100%' }} />
            </PopoverTrigger>
          </div>
          <PopoverContent className="p-0 max-w-[300px] w-max">
            <div className="flex flex-col max-h-[400px] overflow-y-auto outline-none">
              {activeWord && (
                <div className="p-3 border-b border-divider bg-content2/30">
                  {definition?.wiktionary_ipa_or_from_csv_pronunciations && (
                    <div className="text-sm font-medium">{definition.wiktionary_ipa_or_from_csv_pronunciations}</div>
                  )}
                  {definition && definition.definition && (
                    <div
                      dangerouslySetInnerHTML={{ __html: definition.definition }}
                      className="flex gap-2 text-sm text-default-500"
                    />
                  )}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </ShortDefinitionPopoverContext.Provider>
  )
}
