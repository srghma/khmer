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
import { useDictionary } from '../../providers/DictionaryProvider'
import { useFavorites } from '../../providers/FavoritesProvider'

// --- Atomic Components ---

interface LanguageSelectorProps {
  targetLang: ToTranslateLanguage
  onSelect: (lang: ToTranslateLanguage) => void
}

export const LanguageSelector = memo(function LanguageSelector({ targetLang, onSelect }: LanguageSelectorProps) {
  const selectedKeys = useMemo(() => new Set([targetLang]), [targetLang])

  // Sort languages to put Khmer (km) first
  const sortedLanguageEntries = useMemo(() => {
    const entries = Record_entriesToArray(ToTranslateLanguage_codeNameRecord, (code, name) => ({ code, name }))

    return entries.sort((a, b) => {
      if (a.code === 'km') return -1
      if (b.code === 'km') return 1

      return a.name.localeCompare(b.name)
    })
  }, [])

  const handleSelectionChange = React.useCallback(
    (keys: SharedSelection) => {
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
          <span className={`font-bold mr-0.5 uppercase text-xs`}>{targetLang}</span>
          <RxCaretDown className="text-base" />
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Select Translation Language"
        className="text-base"
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleSelectionChange}
      >
        {sortedLanguageEntries.map(({ code, name }) => (
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
  dictionaryMode_lonelyWordShouldBeSpilt: boolean
}

export const ResultDisplay = memo(function ResultDisplay({
  result,
  targetLang,
  maybeColorMode,
  dictionaryMode_lonelyWordShouldBeSpilt,
}: ResultDisplayProps) {
  const { km_map } = useDictionary()
  const { favoritesMap } = useFavorites()
  // const dictionaryLanguage = useMemo((): DictionaryLanguage => {
  //   if (targetLang === 'en' || targetLang === 'km' || targetLang === 'ru') return targetLang

  //   return 'km'
  // }, [targetLang])

  const resultHtml = useMemo(() => {
    if (!result.text) return undefined

    return {
      __html: colorizeHtml(
        result.text,
        maybeColorMode,
        km_map,
        dictionaryMode_lonelyWordShouldBeSpilt,
        undefined,
        undefined,
        'disabled',
        favoritesMap,
      ),
    }
  }, [result.text, maybeColorMode, km_map, dictionaryMode_lonelyWordShouldBeSpilt, favoritesMap])

  return (
    <div className="bg-default-100/50 border border-default-200 rounded-medium p-3 animate-in fade-in duration-200 block">
      {/* 1. ACTIONS: Floated Right. Must be BEFORE the text in the DOM */}
      <div className="float-right flex gap-1 ml-3 mb-1 shrink-0 relative z-10">
        <NativeSpeechAction mode={map_ToTranslateLanguage_to_BCP47LanguageTagName[targetLang]} word={result.text} />
        <GoogleSpeechAction mode={targetLang} word={result.text} />
      </div>

      {/* 2. TEXT CONTENT: Standard block flow */}
      <div className="block">
        {resultHtml ? (
          <div
            dangerouslySetInnerHTML={resultHtml}
            className={`font-medium text-medium font-khmer leading-relaxed select-text whitespace-normal break-all ${srghma_khmer_dict_content_styles.srghma_khmer_dict_content}`}
          />
        ) : (
          <div className="font-medium text-medium select-text whitespace-normal break-all">{result.text}</div>
        )}

        {result.transliteration && (
          <div className="text-small text-default-500 font-mono select-text break-all mt-1">
            {result.transliteration}
          </div>
        )}
      </div>

      {/* 3. CLEARFIX: Ensures the parent container expands to fit the buttons if text is very short */}
      <div className="clear-both" />
    </div>
  )
})
ResultDisplay.displayName = 'ResultDisplay'

export const LoadingStatus = (
  <div className="flex justify-center py-2">
    <Spinner color="default" size="sm" />
  </div>
)
