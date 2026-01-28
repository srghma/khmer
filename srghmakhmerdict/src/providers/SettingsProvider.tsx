import React, { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

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
  setIsRegex: (v: boolean) => void
  searchInContent: boolean
  setSearchInContent: (v: boolean) => void
  highlightInList: boolean
  setHighlightInList: (v: boolean) => void
  highlightInDetails: boolean
  setHighlightInDetails: (v: boolean) => void

  // UI Settings
  uiFontSize: number
  setUiFontSize: React.Dispatch<React.SetStateAction<number>>
  detailsFontSize: number
  setDetailsFontSize: React.Dispatch<React.SetStateAction<number>>

  // Data Filters
  filters: DictFilterSettings
  setFilters: React.Dispatch<React.SetStateAction<DictFilterSettings>>

  // UI State (Modals triggered from Settings)
  isKhmerTableOpen: boolean
  setIsKhmerTableOpen: (v: boolean) => void
  onOpenKhmerTable: () => void
  onCloseKhmerTable: () => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// --- Provider ---

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // Search State
  const [isRegex, setIsRegex] = useState(false)
  const [searchInContent, setSearchInContent] = useState(false)
  const [highlightInList, setHighlightInList] = useState(true)
  const [highlightInDetails, setHighlightInDetails] = useState(true)

  // Font State
  const [uiFontSize, setUiFontSize] = useState(14)
  const [detailsFontSize, setDetailsFontSize] = useState(16)

  // Filter State
  const [filters, setFilters] = useState<DictFilterSettings>(DEFAULT_FILTERS)

  // Modal State
  const [isKhmerTableOpen, setIsKhmerTableOpen] = useState(false)

  const onOpenKhmerTable = () => setIsKhmerTableOpen(true)
  const onCloseKhmerTable = () => setIsKhmerTableOpen(false)

  const value = useMemo(
    () => ({
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
      setIsKhmerTableOpen,
      onOpenKhmerTable,
      onCloseKhmerTable,
    }),
    [
      isRegex,
      searchInContent,
      highlightInList,
      highlightInDetails,
      uiFontSize,
      detailsFontSize,
      filters,
      isKhmerTableOpen,
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
