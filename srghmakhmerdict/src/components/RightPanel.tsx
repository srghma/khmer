import React, { useCallback, useMemo } from 'react'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'
import { useSettings } from '../providers/SettingsProvider'
import { DetailView } from './DetailView'
import { useLocation } from 'wouter'
import { useI18nContext } from '../i18n/i18n-react-custom'
import type { TranslationFunctions } from '../i18n/i18n-types'

interface RightPanelProps {
  maybeColorMode: MaybeColorizationMode
  selectedWord: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | undefined
  lastSelectedWord: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | undefined
  searchQuery: NonEmptyStringTrimmed | undefined
}

const NoSelectedWord = ({ LL }: { LL: TranslationFunctions }) => (
  <div className="hidden md:flex flex-1 flex-col bg-background h-full relative">
    <div className="flex-1 flex items-center justify-center text-default-400 p-8 text-center">
      <div>
        <p className="mb-2 text-lg font-semibold">{LL.COMMON.WELCOME_TITLE()}</p>
        <p className="text-sm">{LL.COMMON.WELCOME_SUBTITLE()}</p>
      </div>
    </div>
  </div>
)

export const RightPanel: React.FC<RightPanelProps> = ({ selectedWord, lastSelectedWord, searchQuery }) => {
  const { LL } = useI18nContext()
  // Use the global navigation hooks
  const [location, setLocation] = useLocation()

  const { highlightInDetails } = useSettings()

  const highlightMatch = useMemo(
    () => (highlightInDetails && searchQuery ? String_toNonEmptyString_orUndefined_afterTrim(searchQuery) : undefined),
    [searchQuery, highlightInDetails],
  )

  // const canGoBack = location !== '/' && location !== '/en' && location !== '/ru' && location !== '/km'

  const backButton_goBack = useCallback(() => {
    // 1. Explicit Detail routes: /{history,favorites}/{en,ru,km}/:word
    const detailListMatch = location.match(/^\/(history|favorites)\/(en|ru|km)\/.+$/)

    if (detailListMatch) {
      setLocation(`~/${detailListMatch[1]}`)

      return
    }

    // 2. Standard Dashboard/Word routes: /en/:word, etc.
    const langMatch = location.match(/^\/(en|ru|km)\/.+$/)

    if (langMatch) {
      setLocation(`~/${langMatch[1]}`)

      return
    }

    // Fallback to English tab if no match
    setLocation('~/en')
  }, [location, setLocation])

  const effectiveWord = selectedWord || lastSelectedWord

  if (!effectiveWord) return <NoSelectedWord LL={LL} />

  // If we only have lastSelectedWord but no active selection,
  // we only show it on desktop (md+) because on mobile we want to see the list/settings.
  // Actually, AppMain already handles visibility via 'hidden md:flex' for the sidebar,
  // but for the RightPanel, if selectedWord is undefined, it means we are in a state
  // like '/settings'. On mobile, '/settings' should show SettingsView (sidebar).
  // On desktop, '/settings' should show SettingsView on the left AND RightPanel (with last word) on the right.

  return (
    <DetailView
      backButton_goBack={backButton_goBack}
      highlightMatch={highlightMatch}
      mode={effectiveWord.mode}
      word={effectiveWord.word}
    />
  )
}
