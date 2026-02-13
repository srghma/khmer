import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { KhmerAnalyzerModal } from '../components/KhmerAnalyzerModal/KhmerAnalyzerModal'
import { useSettings } from './SettingsProvider'
import { useLocation } from 'wouter'

interface KhmerAnalyzerContextType {
  openKhmerAnalyzer: (text: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  closeKhmerAnalyzer: () => void
}

const KhmerAnalyzerContext = createContext<KhmerAnalyzerContextType | undefined>(undefined)

export const useKhmerAnalyzer = () => {
  const context = useContext(KhmerAnalyzerContext)

  if (!context) {
    throw new Error('useKhmerAnalyzer must be used within a KhmerAnalyzerProvider')
  }

  return context
}

export const KhmerAnalyzerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [, setLocation] = useLocation()
  const { maybeColorMode } = useSettings()

  const [khmerAnalyzerState, setKhmerAnalyzerState] = useState<
    | {
        text: NonEmptyStringTrimmed
        mode: DictionaryLanguage
      }
    | undefined
  >()

  const openKhmerAnalyzer = useCallback((text: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
    setKhmerAnalyzerState({ text, mode })
  }, [])

  const closeKhmerAnalyzer = useCallback(() => {
    setKhmerAnalyzerState(undefined)
  }, [])

  const handleKhmerAnalyzerWordSelect = useCallback(
    (word: NonEmptyStringTrimmed) => {
      setKhmerAnalyzerState(undefined)
      setLocation(`/km/${encodeURIComponent(word)}`)
    },
    [setLocation],
  )

  const value = useMemo(
    () => ({
      openKhmerAnalyzer,
      closeKhmerAnalyzer,
    }),
    [openKhmerAnalyzer, closeKhmerAnalyzer],
  )

  return (
    <KhmerAnalyzerContext.Provider value={value}>
      {children}
      {khmerAnalyzerState && (
        <KhmerAnalyzerModal
          currentMode={khmerAnalyzerState.mode}
          maybeColorMode={maybeColorMode}
          textAndOpen={khmerAnalyzerState.text}
          onClose={closeKhmerAnalyzer}
          onNavigate={handleKhmerAnalyzerWordSelect}
        />
      )}
    </KhmerAnalyzerContext.Provider>
  )
}
