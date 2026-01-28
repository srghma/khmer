import { Input } from '@heroui/input'
import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CiSearch } from 'react-icons/ci'
import { useDebounce } from 'use-debounce'
import type { DictionaryLanguage, AppTab } from '../types'

interface SearchBarProps {
  onSearch: (query: string) => void
  isRegex: boolean
  count?: number
  initialValue?: string
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

export const SearchBar = memo(({ onSearch, isRegex, count, initialValue = '', activeTab }: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(initialValue)

  // Use the library to debounce the value (updates 300ms after localValue changes)
  const [debouncedValue] = useDebounce(localValue, 300)

  // Optimization: Store latest onSearch in a ref to keep useEffect dependencies stable
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // Trigger the search when the debounced value changes
  useEffect(() => {
    onSearchRef.current(debouncedValue)
  }, [debouncedValue])

  const handleChange = useCallback((val: string) => {
    setLocalValue(val)
  }, [])

  const handleClear = useCallback(() => {
    setLocalValue('')
    // UX Optimization: Force immediate search update on clear
    onSearchRef.current('')
  }, [])

  const endContent = useMemo(
    () =>
      count !== undefined ? (
        <span className="text-default-400 text-xs font-mono shrink-0 pointer-events-none">
          {numberFormatter.format(count)}
        </span>
      ) : null,
    [count],
  )

  const langHint = getLangHint(activeTab)

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

  return (
    <Input
      // Spread native attributes top-level so the library forwards them to the input
      {...nativeInputAttributes}
      isClearable
      endContent={endContent}
      placeholder={isRegex ? 'Search with regex...' : 'Search words...'}
      radius="none"
      size="sm"
      startContent={startContent}
      value={localValue}
      // Callbacks listed last
      onClear={handleClear}
      onValueChange={handleChange}
    />
  )
})

SearchBar.displayName = 'SearchBar'
