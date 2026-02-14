import { Input } from '@heroui/input'
import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { IoClose } from 'react-icons/io5'
import { Button } from '@heroui/button'
import { CiSearch } from 'react-icons/ci'
import { useDebounce } from 'use-debounce'
import { useI18nContext } from '../i18n/i18n-react-custom'
import type { DictionaryLanguage, AppTab } from '../types'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { SearchMode } from '../providers/SettingsProvider'
import { assertNever } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'

interface SearchBarProps {
  onSearch: (query: NonEmptyStringTrimmed | undefined) => void
  searchMode: SearchMode
  count: number | undefined
  initialValue: NonEmptyStringTrimmed | undefined
  /**
   * The current active tab/language context.
   * Used to hint the keyboard layout.
   */
  activeTab: AppTab
}

// Format once outside to reuse the formatter instance
const numberFormatter = new Intl.NumberFormat('en-US')

const startContent = <CiSearch className="text-default-400 text-lg pointer-events-none shrink-0" />

// Maps internal app tabs to standard HTML lang codes
const getLangHint = (tab: AppTab): DictionaryLanguage => {
  switch (tab) {
    case 'ru':
      return 'ru'
    case 'km':
      return 'km'
    default:
      return 'en' // history, favorites, settings, en -> english
  }
}

export const SearchBar = memo(({ onSearch, searchMode, count, initialValue, activeTab }: SearchBarProps) => {
  const { LL } = useI18nContext()
  const [localValue, setLocalValue] = useState<string>(initialValue ?? '')

  // Use the library to debounce the value (updates 300ms after localValue changes)
  const [debouncedValue] = useDebounce<string>(localValue, 300)

  // Trigger the search when the debounced value changes
  useEffect(() => {
    onSearch(String_toNonEmptyString_orUndefined_afterTrim(debouncedValue))
  }, [debouncedValue])

  const handleChange = useCallback((val: string) => {
    setLocalValue(val)
  }, [])

  const handleClear = useCallback(() => {
    setLocalValue('')
    onSearch(undefined)
  }, [onSearch])

  const endContent = useMemo(
    () => (
      <div className="flex items-center gap-0.5">
        {localValue.length > 0 && (
          <Button
            isIconOnly
            className="h-7 w-7 min-w-7 text-default-400 hover:text-default-600 -mr-1"
            radius="full"
            size="sm"
            variant="light"
            onPress={handleClear}
          >
            <IoClose className="text-lg" />
          </Button>
        )}
        {count !== undefined && (
          <span className="text-default-400 text-xs font-mono shrink-0 pointer-events-none ml-1">
            {numberFormatter.format(count)}
          </span>
        )}
      </div>
    ),
    [count, localValue, handleClear],
  )

  const langHint = getLangHint(activeTab)

  const isRegex = searchMode === 'regex'

  // Memoize attributes that passed down to the native input element
  const nativeInputAttributes = useMemo(
    () =>
      ({
        lang: langHint,
        // Spellcheck usually helps trigger the language context on Android
        spellCheck: isRegex ? 'true' : 'false',
        // Optional: prevent suggestions interfering when typing regex
        autoComplete: isRegex ? 'off' : 'on',
        autoCorrect: isRegex ? 'off' : 'on',
      }) as const,
    [langHint, isRegex],
  )

  const placeholder = useMemo(() => {
    switch (searchMode) {
      case 'regex':
        return LL.SEARCH.PLACEHOLDER_REGEX()
      case 'starts_with':
        return LL.SEARCH.PLACEHOLDER_STARTS_WITH()
      case 'includes':
        return LL.SEARCH.PLACEHOLDER_INCLUDES()
      default:
        assertNever(searchMode)
    }
  }, [searchMode, LL])

  return (
    <Input
      // Spread native attributes top-level so the library forwards them to the input
      {...nativeInputAttributes}
      endContent={endContent}
      placeholder={placeholder}
      radius="none"
      size="sm"
      startContent={startContent}
      value={localValue}
      // Callbacks listed last
      onValueChange={handleChange}
    />
  )
})

SearchBar.displayName = 'SearchBar'
