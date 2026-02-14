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
import { safeBack } from '../utils/safeBack'

interface RightPanelProps {
  maybeColorMode: MaybeColorizationMode
  selectedWord: { word: NonEmptyStringTrimmed; mode: DictionaryLanguage } | undefined
  searchQuery: NonEmptyStringTrimmed | undefined
}

const NoSelectedWord = ({ LL }: { LL: TranslationFunctions }) => (
  <div className="hidden md:flex flex-1 bg-background items-center justify-center text-default-400 p-8 text-center">
    <div>
      <p className="mb-2 text-lg font-semibold">{LL.COMMON.WELCOME_TITLE()}</p>
      <p className="text-sm">{LL.COMMON.WELCOME_SUBTITLE()}</p>
    </div>
  </div>
)

export const RightPanel: React.FC<RightPanelProps> = ({ selectedWord, searchQuery }) => {
  const { LL } = useI18nContext()
  // Use the global navigation hooks
  const [location, setLocation] = useLocation()

  const { highlightInDetails } = useSettings()

  const highlightMatch = useMemo(
    () => (highlightInDetails && searchQuery ? String_toNonEmptyString_orUndefined_afterTrim(searchQuery) : undefined),
    [searchQuery, highlightInDetails],
  )

  const onNavigate = useCallback(
    (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => setLocation(`/${mode}/${encodeURIComponent(word)}`),
    [setLocation],
  )

  const canGoBack = location !== '/' && location !== '/en' && location !== '/ru' && location !== '/km'

  const backButton_goBack = useCallback(() => {
    if (canGoBack) {
      safeBack(setLocation)
    } else {
      const langMatch = location.match(/^\/(en|ru|km)/)

      setLocation(langMatch ? `/${langMatch[1]}` : '/en')
    }
  }, [canGoBack, location, setLocation])

  if (!selectedWord) return <NoSelectedWord LL={LL} />

  return (
    <div className="fixed inset-0 z-20 md:static md:z-0 flex-1 flex flex-col h-full bg-background animate-in slide-in-from-right duration-200 md:animate-none">
      {/* Detail View Wrapper with Selection Class */}
      <DetailView
        backButton_desktopOnlyStyles_showButton={canGoBack}
        backButton_goBack={backButton_goBack}
        highlightMatch={highlightMatch}
        mode={selectedWord.mode}
        word={selectedWord.word}
        onNavigate={onNavigate}
      />
    </div>
  )
}
