import React, { useMemo, memo } from 'react'
import { Button } from '@heroui/button'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { Spinner } from '@heroui/spinner'
import { RxCaretDown } from 'react-icons/rx'
import srghma_khmer_dict_content_styles from '../../srghma_khmer_dict_content.module.css'

import { colorizeHtml } from '../../utils/text-processing/html'
import type { MaybeColorizationMode } from '../../utils/text-processing/utils'
import {
  stringToToTranslateLanguageOrThrow,
  ToTranslateLanguage_codeNameRecord,
  type ToTranslateLanguage,
} from '../../utils/googleTranslate/toTranslateLanguage'
import type { SharedSelection } from '@heroui/system'
import { herouiSharedSelection_getFirst_string } from '../../utils/herouiSharedSelection_getFirst_string'
import { Record_entriesToArray } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/record'
import { map_ToTranslateLanguage_to_BCP47LanguageTagName } from '../../utils/my-bcp-47'
import { GoogleSpeechAction } from '../DetailView/Tooltips/GoogleSpeechAction'
import { NativeSpeechAction } from '../DetailView/Tooltips/NativeSpeechAction'
import type { TranslateResultSuccess } from '../../utils/googleTranslate/googleTranslate'
import { isContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import { useDictionary } from '../../providers/DictionaryProvider'

// --- Atomic Components ---

interface LanguageSelectorProps {
  targetLang: ToTranslateLanguage
  onSelect: (lang: ToTranslateLanguage) => void
}

export const LanguageSelector = memo(({ targetLang, onSelect }: LanguageSelectorProps) => {
  const selectedKeys = useMemo(() => new Set([targetLang]), [targetLang])

  const handleSelectionChange = React.useCallback(
    (keys: SharedSelection) => {
      // Safe extraction without casting assumption
      const selected = herouiSharedSelection_getFirst_string(keys)

      if (!selected) return

      onSelect(stringToToTranslateLanguageOrThrow(selected))
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
        {Record_entriesToArray(ToTranslateLanguage_codeNameRecord, (code, name) => (
          <DropdownItem key={code}>{name}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
})
LanguageSelector.displayName = 'LanguageSelector'

interface ResultDisplayProps {
  result: TranslateResultSuccess
  targetLang: ToTranslateLanguage
  maybeColorMode: MaybeColorizationMode
}

export const ResultDisplay = memo(({ result, targetLang, maybeColorMode }: ResultDisplayProps) => {
  const { km_map } = useDictionary()
  const resultHtml = useMemo(() => {
    if (!result.text) return undefined
    if (targetLang !== 'km' || maybeColorMode === 'none') return { __html: result.text }
    if (!isContainsKhmer(result.text)) return { __html: result.text }

    return { __html: colorizeHtml(result.text, maybeColorMode, km_map) }
  }, [result.text, targetLang, maybeColorMode, km_map])

  return (
    <div className="bg-default-100/50 border border-default-200 rounded-medium p-3 animate-in fade-in duration-200">
      <div className="flex justify-between items-start gap-3">
        {/* Left Side: Text Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {resultHtml ? (
            <div
              dangerouslySetInnerHTML={resultHtml}
              className={`font-medium text-medium font-khmer leading-relaxed select-text ${srghma_khmer_dict_content_styles.srghma_khmer_dict_content}`}
            />
          ) : (
            <div className="font-medium text-medium select-text">{result.text}</div>
          )}

          {result.transliteration && (
            <div className="text-small text-default-500 font-mono select-text">{result.transliteration}</div>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex gap-1 shrink-0">
          <NativeSpeechAction mode={map_ToTranslateLanguage_to_BCP47LanguageTagName[targetLang]} word={result.text} />
          <GoogleSpeechAction mode={targetLang} word={result.text} />
        </div>
      </div>
    </div>
  )
})
ResultDisplay.displayName = 'ResultDisplay'

export const LoadingStatus = (
  <div className="flex justify-center py-2">
    <Spinner color="default" size="sm" />
  </div>
)
