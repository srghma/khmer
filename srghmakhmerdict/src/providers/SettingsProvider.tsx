import { createContext, useContext, useState, useMemo, type ReactNode, useCallback } from 'react'
import { useLocalStorageState } from 'ahooks'
import { type EnglishKhmerCom_Images_Mode } from '../types'
import type { MaybeColorizationMode } from '../utils/text-processing/utils'

// --- Types ---

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

interface SettingsContextType {
  // Search Settings
  isRegex: boolean
  setIsRegex: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  searchInContent: boolean
  setSearchInContent: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  highlightInList: boolean
  setHighlightInList: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  highlightInDetails: boolean
  setHighlightInDetails: (v: boolean | ((prev: boolean | undefined) => boolean)) => void

  // UI Settings
  uiFontSize: number
  setUiFontSize: (v: number | ((prev: number | undefined) => number)) => void
  detailsFontSize: number
  setDetailsFontSize: (v: number | ((prev: number | undefined) => number)) => void

  // Data Filters
  filters: DictFilterSettings
  setFilters: (v: DictFilterSettings | ((prev: DictFilterSettings | undefined) => DictFilterSettings)) => void

  // UI State (Modals triggered from Settings)
  isKhmerTableOpen: boolean
  setIsKhmerTableOpen: (v: boolean) => void
  onOpenKhmerTable: () => void
  onCloseKhmerTable: () => void

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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// --- Provider ---

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Search State
  const [isRegex, setIsRegex] = useLocalStorageState<boolean>('srghmakhmerdict__is_regex', {
    defaultValue: false,
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
  const [uiFontSize, setUiFontSize] = useLocalStorageState<number>('srghmakhmerdict__ui_font_size', {
    defaultValue: 14,
  })

  const [detailsFontSize, setDetailsFontSize] = useLocalStorageState<number>('srghmakhmerdict__details_font_size', {
    defaultValue: 16,
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
    { defaultValue: true }, // Default to off
  )

  // Modal State (Transient - do not persist)
  const [isKhmerTableOpen, setIsKhmerTableOpen] = useState(false)

  const onOpenKhmerTable = useCallback(() => setIsKhmerTableOpen(true), [])
  const onCloseKhmerTable = useCallback(() => setIsKhmerTableOpen(false), [])

  const toggleKhmerLinks = useCallback(() => {
    setIsKhmerLinksEnabled(prev => !prev)
  }, [setIsKhmerLinksEnabled])

  const value = useMemo(
    () => ({
      // We use `?? defaultValue` here to satisfy TypeScript in case useLocalStorageState returns undefined temporarily,
      // though ahooks handles defaultValue well.
      isRegex: isRegex ?? false,
      setIsRegex,
      searchInContent: searchInContent ?? false,
      setSearchInContent,
      highlightInList: highlightInList ?? true,
      setHighlightInList,
      highlightInDetails: highlightInDetails ?? true,
      setHighlightInDetails,
      uiFontSize: uiFontSize ?? 14,
      setUiFontSize,
      detailsFontSize: detailsFontSize ?? 16,
      setDetailsFontSize,
      filters: filters ?? DEFAULT_FILTERS,
      setFilters,
      isKhmerTableOpen,
      setIsKhmerTableOpen,
      onOpenKhmerTable,
      onCloseKhmerTable,
      imageMode: imageMode ?? 'online',
      setImageMode,
      maybeColorMode: maybeColorMode ?? 'segmenter',
      setMaybeColorMode,
      isKhmerLinksEnabled: isKhmerLinksEnabled ?? true,
      setIsKhmerLinksEnabled,
      toggleKhmerLinks,
    }),
    [
      isRegex,
      setIsRegex,
      searchInContent,
      setSearchInContent,
      highlightInList,
      setHighlightInList,
      highlightInDetails,
      setHighlightInDetails,
      uiFontSize,
      setUiFontSize,
      detailsFontSize,
      setDetailsFontSize,
      filters,
      setFilters,
      isKhmerTableOpen,
      imageMode,
      setImageMode,
      maybeColorMode,
      setMaybeColorMode,
      onOpenKhmerTable,
      onCloseKhmerTable,
      isKhmerLinksEnabled,
      setIsKhmerLinksEnabled,
      toggleKhmerLinks,
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
