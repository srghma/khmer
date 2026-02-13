import { createContext, useContext, useMemo, type ReactNode, useCallback } from 'react'
import { useLocalStorageState } from 'ahooks'
import { type EnglishKhmerCom_Images_Mode } from '../types'
import { KHMER_FONT_FAMILY, type KhmerFontName, type MaybeColorizationMode } from '../utils/text-processing/utils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

// --- Types ---

export type AutoReadMode = 'disabled' | 'google_then_native' | 'google_only' | 'native_only'

export type SearchMode = 'starts_with' | 'includes' | 'regex'

export type DictFilterSettings_Km_Mode = 'all' | 'only_verified'

export interface DictFilterSettings {
  km: {
    mode: DictFilterSettings_Km_Mode
  }
}

const DEFAULT_FILTERS: DictFilterSettings = {
  km: {
    mode: 'only_verified',
  },
}

// --- Context Interface ---

export interface SettingsContextType {
  // Search Settings
  searchMode: SearchMode
  setSearchMode: (v: SearchMode | ((prev: SearchMode | undefined) => SearchMode)) => void
  searchInContent: boolean
  setSearchInContent: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  highlightInList: boolean
  setHighlightInList: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  highlightInDetails: boolean
  setHighlightInDetails: (v: boolean | ((prev: boolean | undefined) => boolean)) => void

  // UI Settings
  fontSize_ui: number
  setFontSize_ui: (v: number | ((prev: number | undefined) => number)) => void
  fontSize_details: number
  setFontSize_details: (v: number | ((prev: number | undefined) => number)) => void

  // Data Filters
  filters: DictFilterSettings
  setFilters: (v: DictFilterSettings | ((prev: DictFilterSettings | undefined) => DictFilterSettings)) => void

  // Image Mode
  imageMode: EnglishKhmerCom_Images_Mode
  setImageMode: (
    v: EnglishKhmerCom_Images_Mode | ((prev: EnglishKhmerCom_Images_Mode | undefined) => EnglishKhmerCom_Images_Mode),
  ) => void

  // Color Mode
  maybeColorMode: MaybeColorizationMode
  setMaybeColorMode: (
    v: MaybeColorizationMode | ((prev: MaybeColorizationMode | undefined) => MaybeColorizationMode),
  ) => void

  isKhmerLinksEnabled: boolean
  setIsKhmerLinksEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  toggleKhmerLinks: () => void

  isKhmerWordsHidingEnabled: boolean
  setIsKhmerWordsHidingEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  toggleKhmerWordsHiding: () => void

  isNonKhmerWordsHidingEnabled: boolean
  setIsNonKhmerWordsHidingEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  toggleNonKhmerWordsHiding: () => void

  khmerFontName: KhmerFontName
  khmerFontFamily: NonEmptyStringTrimmed | undefined
  setKhmerFontName: (v: KhmerFontName | ((prev: KhmerFontName | undefined) => KhmerFontName)) => void

  autoReadMode: AutoReadMode
  setAutoReadMode: (v: AutoReadMode | ((prev: AutoReadMode | undefined) => AutoReadMode)) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// --- Provider ---

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Search State
  const [searchMode, setSearchMode] = useLocalStorageState<SearchMode>('srghmakhmerdict__search_mode_v2', {
    defaultValue: 'starts_with',
  })

  const [searchInContent, setSearchInContent] = useLocalStorageState<boolean>('srghmakhmerdict__search_in_content', {
    defaultValue: false,
  })

  const [highlightInList, setHighlightInList] = useLocalStorageState<boolean>('srghmakhmerdict__highlight_in_list', {
    defaultValue: true,
  })

  const [highlightInDetails, setHighlightInDetails] = useLocalStorageState<boolean>(
    'srghmakhmerdict__highlight_in_details',
    { defaultValue: true },
  )

  // Font State
  const [fontSize_ui, setFontSize_ui] = useLocalStorageState<number>('srghmakhmerdict__ui_font_size', {
    defaultValue: 14,
  })

  const [fontSize_details, setFontSize_details] = useLocalStorageState<number>('srghmakhmerdict__details_font_size', {
    defaultValue: 16,
  })

  const [khmerFontName, setKhmerFontName] = useLocalStorageState<KhmerFontName>('srghmakhmerdict__khmer_font_name', {
    defaultValue: 'Default',
  })

  // Filter State
  const [filters, setFilters] = useLocalStorageState<DictFilterSettings>('srghmakhmerdict__filters', {
    defaultValue: DEFAULT_FILTERS,
  })

  // Color Mode
  const [maybeColorMode, setMaybeColorMode] = useLocalStorageState<MaybeColorizationMode>(
    'srghmakhmerdict__maybe_color_mode',
    { defaultValue: 'segmenter' },
  )

  // Image Mode
  const [imageMode, setImageMode] = useLocalStorageState<EnglishKhmerCom_Images_Mode>(
    'srghmakhmerdict__km_dict_image_mode',
    { defaultValue: 'online' },
  )

  const [isKhmerLinksEnabled, setIsKhmerLinksEnabled] = useLocalStorageState<boolean>(
    'srghmakhmerdict__is_khmer_links_enabled',
    { defaultValue: true },
  )

  const [isKhmerWordsHidingEnabled, setIsKhmerWordsHidingEnabled] = useLocalStorageState<boolean>(
    'srghmakhmerdict__is_khmer_words_hiding_enabled',
    { defaultValue: false },
  )

  const [isNonKhmerWordsHidingEnabled, setIsNonKhmerWordsHidingEnabled] = useLocalStorageState<boolean>(
    'srghmakhmerdict__is_non_khmer_words_hiding_enabled',
    { defaultValue: false },
  )

  const [autoReadMode, setAutoReadMode] = useLocalStorageState<AutoReadMode>('srghmakhmerdict__auto_read_mode', {
    defaultValue: 'disabled',
  })

  const toggleKhmerLinks = useCallback(() => {
    setIsKhmerLinksEnabled(prev => !prev)
  }, [setIsKhmerLinksEnabled])

  const toggleKhmerWordsHiding = useCallback(() => {
    setIsKhmerWordsHidingEnabled(prev => !prev)
  }, [setIsKhmerWordsHidingEnabled])

  const toggleNonKhmerWordsHiding = useCallback(() => {
    setIsNonKhmerWordsHidingEnabled(prev => !prev)
  }, [setIsNonKhmerWordsHidingEnabled])

  const value = useMemo(
    () => ({
      // We use `?? defaultValue` here to satisfy TypeScript in case useLocalStorageState returns undefined temporarily,
      // though ahooks handles defaultValue well.
      searchMode: searchMode ?? 'starts_with',
      setSearchMode,
      searchInContent: searchInContent ?? false,
      setSearchInContent,
      highlightInList: highlightInList ?? true,
      setHighlightInList,
      highlightInDetails: highlightInDetails ?? true,
      setHighlightInDetails,
      fontSize_ui: fontSize_ui ?? 14,
      setFontSize_ui,
      fontSize_details: fontSize_details ?? 16,
      setFontSize_details,
      filters: filters ?? DEFAULT_FILTERS,
      setFilters,
      imageMode: imageMode ?? 'online',
      setImageMode,
      maybeColorMode: maybeColorMode ?? 'segmenter',
      setMaybeColorMode,
      isKhmerLinksEnabled: isKhmerLinksEnabled ?? true,
      setIsKhmerLinksEnabled,
      toggleKhmerLinks,
      isKhmerWordsHidingEnabled: isKhmerWordsHidingEnabled ?? false,
      setIsKhmerWordsHidingEnabled,
      toggleKhmerWordsHiding,
      isNonKhmerWordsHidingEnabled: isNonKhmerWordsHidingEnabled ?? false,
      setIsNonKhmerWordsHidingEnabled,
      toggleNonKhmerWordsHiding,
      khmerFontName: khmerFontName ?? 'Default',
      khmerFontFamily: KHMER_FONT_FAMILY[khmerFontName ?? 'Default'],
      setKhmerFontName,
      autoReadMode: autoReadMode ?? 'disabled',
      setAutoReadMode,
    }),
    [
      searchMode,
      setSearchMode,
      searchInContent,
      setSearchInContent,
      highlightInList,
      setHighlightInList,
      highlightInDetails,
      setHighlightInDetails,
      fontSize_ui,
      setFontSize_ui,
      fontSize_details,
      setFontSize_details,
      filters,
      setFilters,
      imageMode,
      setImageMode,
      maybeColorMode,
      setMaybeColorMode,
      isKhmerLinksEnabled,
      setIsKhmerLinksEnabled,
      toggleKhmerLinks,
      isKhmerWordsHidingEnabled,
      setIsKhmerWordsHidingEnabled,
      toggleKhmerWordsHiding,
      isNonKhmerWordsHidingEnabled,
      setIsNonKhmerWordsHidingEnabled,
      toggleNonKhmerWordsHiding,
      khmerFontName,
      setKhmerFontName,
      autoReadMode,
      setAutoReadMode,
    ],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

// --- Hook ---

export const useSettings = () => {
  const context = useContext(SettingsContext)

  if (context === undefined) throw new Error('useSettings must be used within a SettingsProvider')

  return context
}
