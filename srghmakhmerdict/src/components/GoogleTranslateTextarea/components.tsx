import React, { useMemo, memo } from 'react'
import { Button } from '@heroui/button'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { Spinner } from '@heroui/spinner'
import { Alert } from '@heroui/alert'
import { HiSpeakerWave } from 'react-icons/hi2'
import { SiGoogletranslate } from 'react-icons/si'
import { RxCaretDown } from 'react-icons/rx'

import { TO_LANGUAGES, type ToTranslateLanguage, type TranslateResult } from '../../utils/googleTranslate'
import { colorizeHtml } from '../../utils/text-processing/html'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import type { KhmerWordsMap } from '../../db/dict'

// --- Atomic Components ---

interface LanguageSelectorProps {
  targetLang: ToTranslateLanguage
  onSelect: (lang: ToTranslateLanguage) => void
}

export const LanguageSelector = memo(({ targetLang, onSelect }: LanguageSelectorProps) => {
  const selectedKeys = useMemo(() => new Set([targetLang]), [targetLang])

  const handleSelectionChange = React.useCallback(
    (keys: any) => {
      // Safe extraction without casting assumption
      const selected = Array.from(keys)[0]

      if (typeof selected === 'string') {
        onSelect(selected as ToTranslateLanguage)
      }
    },
    [onSelect],
  )

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button isIconOnly className="w-9 min-w-8 px-0 border-l border-default-400/30">
          <span className="text-xs font-bold mr-0.5 uppercase">{targetLang}</span>
          <RxCaretDown />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Select Translation Language"
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleSelectionChange}
      >
        {TO_LANGUAGES.map(lang => (
          <DropdownItem key={lang.code}>{lang.name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
})
LanguageSelector.displayName = 'LanguageSelector'

interface SpeakButtonsProps {
  onSpeakNative: () => void
  onSpeakGoogle: () => void
  size?: 'sm' | 'md'
  className?: string
}

export const SpeakButtons = memo(({ onSpeakNative, onSpeakGoogle, size = 'sm', className }: SpeakButtonsProps) => (
  <div className={`flex gap-1 ${className || ''}`}>
    <Button isIconOnly size={size} title="Speak (Native)" variant="light" onPress={onSpeakNative}>
      <HiSpeakerWave className="text-default-500" />
    </Button>
    <Button isIconOnly size={size} title="Speak (Google)" variant="light" onPress={onSpeakGoogle}>
      <SiGoogletranslate className="text-default-500 text-xs" />
    </Button>
  </div>
))
SpeakButtons.displayName = 'SpeakButtons'

interface ResultDisplayProps {
  result: TranslateResult
  targetLang: ToTranslateLanguage
  maybeColorMode: MaybeColorizationMode
  km_map: KhmerWordsMap | undefined
  onSpeakNative: () => void
  onSpeakGoogle: () => void
}

export const ResultDisplay = memo(
  ({ result, targetLang, maybeColorMode, km_map, onSpeakNative, onSpeakGoogle }: ResultDisplayProps) => {
    const resultHtml = useMemo(() => {
      if (!result.text) return null
      if (targetLang !== 'km' || maybeColorMode === 'none' || !km_map) return { __html: result.text }

      return { __html: colorizeHtml(result.text, maybeColorMode, km_map) }
    }, [result.text, targetLang, maybeColorMode, km_map])

    return (
      <div className="bg-default-100/50 border border-default-200 rounded-medium p-3 animate-in fade-in duration-200">
        {resultHtml ? (
          <div
            dangerouslySetInnerHTML={resultHtml}
            className="font-medium text-medium font-khmer leading-relaxed select-text"
          />
        ) : (
          <div className="font-medium text-medium select-text">{result.text}</div>
        )}

        {result.transliteration && (
          <div className="text-small text-default-500 font-mono mt-1 select-text">{result.transliteration}</div>
        )}

        <div className="flex justify-end mt-2 border-t border-default-200/50 pt-2">
          <SpeakButtons onSpeakGoogle={onSpeakGoogle} onSpeakNative={onSpeakNative} />
        </div>
      </div>
    )
  },
)
ResultDisplay.displayName = 'ResultDisplay'

interface StatusDisplayProps {
  loading: boolean
  error: string | null
}

export const StatusDisplay = memo(({ loading, error }: StatusDisplayProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-2">
        <Spinner color="default" size="sm" />
      </div>
    )
  }
  if (error) {
    return <Alert color="danger" description={error} title="Request error" />
  }

  return null
})
StatusDisplay.displayName = 'StatusDisplay'
