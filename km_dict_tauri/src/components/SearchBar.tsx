import { Input } from '@heroui/input'
import { memo, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CiSearch } from 'react-icons/ci'
import { useDebounce } from 'use-debounce'

interface SearchBarProps {
  onSearch: (query: string) => void
  isRegex: boolean
  count?: number
  initialValue?: string
}

// Format once outside to reuse the formatter instance
const numberFormatter = new Intl.NumberFormat('en-US')

const startContent = <CiSearch className="text-default-400 text-lg pointer-events-none shrink-0" />

export const SearchBar = memo(({ onSearch, isRegex, count, initialValue = '' }: SearchBarProps) => {
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
    // UX Optimization: Force immediate search update on clear, bypassing the debounce delay.
    // When debouncedValue eventually updates to '' in 300ms, the effect will fire again,
    // but React will bail out since the state in the parent is already ''.
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

  return (
    <Input
      isClearable
      endContent={endContent}
      placeholder={isRegex ? 'Search with regex...' : 'Search words...'}
      radius="none"
      size="sm"
      startContent={startContent}
      value={localValue}
      onClear={handleClear}
      onValueChange={handleChange}
    />
  )
})

SearchBar.displayName = 'SearchBar'
