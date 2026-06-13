import { createContext, useContext, useMemo, type ReactNode, useCallback } from 'react'
import { useLocalStorageState } from 'ahooks'
import { type EnglishKhmerCom_Images_Mode } from '../types'
import { KHMER_FONT_FAMILY, type KhmerFontName, type MaybeColorizationMode } from '../utils/text-processing/utils'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { LanguagesOrAuto } from '../i18n/languages'
import {
  isEnumValue,
  stringToEnumOrThrow,
  stringToEnumOrUndefined,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/enum'

// --- Types ---

// AutoReadMode
export const AUTO_READ_MODES = ['disabled', 'google_then_native', 'google_only', 'native_only'] as const

export type AutoReadMode = (typeof AUTO_READ_MODES)[number]

export function isAutoReadMode(value: string): value is AutoReadMode {
  return isEnumValue(value, AUTO_READ_MODES)
}

export function stringToAutoReadModeOrUndefined(value: string): AutoReadMode | undefined {
  return stringToEnumOrUndefined(value, AUTO_READ_MODES)
}

export function stringToAutoReadModeOrThrow(value: string): AutoReadMode {
  return stringToEnumOrThrow(value, AUTO_READ_MODES, 'AutoReadMode')
}

// SearchMode
export const SEARCH_MODES = ['starts_with', 'includes', 'regex'] as const

export type SearchMode = (typeof SEARCH_MODES)[number]

export function isSearchMode(value: string): value is SearchMode {
  return isEnumValue(value, SEARCH_MODES)
}

export function stringToSearchModeOrUndefined(value: string): SearchMode | undefined {
  return stringToEnumOrUndefined(value, SEARCH_MODES)
}

export function stringToSearchModeOrThrow(value: string): SearchMode {
  return stringToEnumOrThrow(value, SEARCH_MODES, 'SearchMode')
}

// DictFilterSettings_Km_Mode
export const DICT_FILTER_SETTINGS_KM_MODES = ['all', 'only_verified'] as const

export type DictFilterSettings_Km_Mode = (typeof DICT_FILTER_SETTINGS_KM_MODES)[number]

export function isDictFilterSettingsKmMode(value: string): value is DictFilterSettings_Km_Mode {
  return isEnumValue(value, DICT_FILTER_SETTINGS_KM_MODES)
}

export function stringToDictFilterSettingsKmModeOrUndefined(value: string): DictFilterSettings_Km_Mode | undefined {
  return stringToEnumOrUndefined(value, DICT_FILTER_SETTINGS_KM_MODES)
}

export function stringToDictFilterSettingsKmModeOrThrow(value: string): DictFilterSettings_Km_Mode {
  return stringToEnumOrThrow(value, DICT_FILTER_SETTINGS_KM_MODES, 'DictFilterSettings_Km_Mode')
}

// KhmerAnalyzerEnabledSegmenters
export const KHMER_ANALYZER_ENABLED_SEGMENTERS = ['segmenter', 'dictionary', 'both'] as const

export type KhmerAnalyzerEnabledSegmenters = (typeof KHMER_ANALYZER_ENABLED_SEGMENTERS)[number]

export function isKhmerAnalyzerEnabledSegmenters(value: string): value is KhmerAnalyzerEnabledSegmenters {
  return isEnumValue(value, KHMER_ANALYZER_ENABLED_SEGMENTERS)
}

export function stringToKhmerAnalyzerEnabledSegmentersOrUndefined(
  value: string,
): KhmerAnalyzerEnabledSegmenters | undefined {
  return stringToEnumOrUndefined(value, KHMER_ANALYZER_ENABLED_SEGMENTERS)
}

export function stringToKhmerAnalyzerEnabledSegmentersOrThrow(value: string): KhmerAnalyzerEnabledSegmenters {
  return stringToEnumOrThrow(value, KHMER_ANALYZER_ENABLED_SEGMENTERS, 'KhmerAnalyzerEnabledSegmenters')
}

///////////////////

export const WORDS_HIDING_MODES = ['disabled', 'on_click_reveal', 'on_click_open_fill_in_the_blank_game_modal'] as const

export type WordsHidingMode = (typeof WORDS_HIDING_MODES)[number]

export function isWordsHidingMode(value: string): value is WordsHidingMode {
  return isEnumValue(value, WORDS_HIDING_MODES)
}

export function stringToWordsHidingModeOrUndefined(value: string): WordsHidingMode | undefined {
  return stringToEnumOrUndefined(value, WORDS_HIDING_MODES)
}

export function stringToWordsHidingModeOrThrow(value: string): WordsHidingMode {
  return stringToEnumOrThrow(value, WORDS_HIDING_MODES, 'WordsHidingMode')
}

////////////////

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

export type AnkiTableSortMode = 'index' | 'due'

export interface AnkiTableState {
  hideFront: boolean
  hideBack: boolean
  hideInfo: boolean
  showDue: boolean
  showNew: boolean
  showNotDue: boolean
  sortMode: AnkiTableSortMode
  disabledPosDue: string[]
  disabledPosNew: string[]
  disabledPosWait: string[]
  currentTime: number
  audioModeOpus: boolean
  audioModeGoogle: boolean
  audioModeNative: boolean
  showShortDefinitionOnSelect: boolean
}

export const DEFAULT_ANKI_TABLE_STATE: AnkiTableState = {
  hideFront: false,
  hideBack: true,
  hideInfo: true,
  showDue: true,
  showNew: true,
  showNotDue: false,
  sortMode: 'index',
  disabledPosDue: [],
  disabledPosNew: [],
  disabledPosWait: [],
  currentTime: Date.now(),
  audioModeOpus: true,
  audioModeGoogle: false,
  audioModeNative: false,
  showShortDefinitionOnSelect: true,
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
  scaling_ui: number
  setScalingPercentage_ui: (v: number | ((prev: number | undefined) => number)) => void
  scaling_details: number
  setScalingPercentage_details: (v: number | ((prev: number | undefined) => number)) => void

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

  khmerWordsHidingMode: WordsHidingMode
  setKhmerWordsHidingMode: (v: WordsHidingMode | ((prev: WordsHidingMode | undefined) => WordsHidingMode)) => void

  nonKhmerWordsHidingMode: WordsHidingMode
  setNonKhmerWordsHidingMode: (v: WordsHidingMode | ((prev: WordsHidingMode | undefined) => WordsHidingMode)) => void

  khmerFontName: KhmerFontName
  khmerFontFamily: NonEmptyStringTrimmed | undefined
  setKhmerFontName: (v: KhmerFontName | ((prev: KhmerFontName | undefined) => KhmerFontName)) => void

  autoReadMode: AutoReadMode
  setAutoReadMode: (v: AutoReadMode | ((prev: AutoReadMode | undefined) => AutoReadMode)) => void

  autoReadLangs: Record<'en' | 'km' | 'ru', boolean>
  setAutoReadLangs: (
    v:
      | Record<'en' | 'km' | 'ru', boolean>
      | ((prev: Record<'en' | 'km' | 'ru', boolean> | undefined) => Record<'en' | 'km' | 'ru', boolean>),
  ) => void

  location: LanguagesOrAuto
  setLocation: (v: LanguagesOrAuto | ((prev: LanguagesOrAuto | undefined) => LanguagesOrAuto)) => void

  khmerAnalyzerEnabledSegmenters: KhmerAnalyzerEnabledSegmenters
  setKhmerAnalyzerEnabledSegmenters: (
    v:
      | KhmerAnalyzerEnabledSegmenters
      | ((prev: KhmerAnalyzerEnabledSegmenters | undefined) => KhmerAnalyzerEnabledSegmenters),
  ) => void

  khmerAnalyzerMarkdownEnabled: boolean
  setKhmerAnalyzerMarkdownEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void

  khmerAnalyzerSegmentationEnabled: boolean
  setKhmerAnalyzerSegmentationEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void

  khmerAnalyzerCharacterAnalysisEnabled: boolean
  setKhmerAnalyzerCharacterAnalysisEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void

  isShowShortDetailAboutKhmerWordEnabled: boolean
  setIsShowShortDetailAboutKhmerWordEnabled: (v: boolean | ((prev: boolean | undefined) => boolean)) => void
  toggleShowShortDetailAboutKhmerWord: () => void

  ankiTableState: AnkiTableState
  setAnkiTableState: (v: AnkiTableState | ((prev: AnkiTableState | undefined) => AnkiTableState)) => void
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
  const [scaling_ui, setScalingPercentage_ui] = useLocalStorageState<number>('srghmakhmerdict__ui_scaling', {
    defaultValue: 100,
  })

  const [scaling_details, setScalingPercentage_details] = useLocalStorageState<number>(
    'srghmakhmerdict__details_scaling',
    {
      defaultValue: 100,
    },
  )

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

  const [khmerWordsHidingMode, setKhmerWordsHidingMode] = useLocalStorageState<WordsHidingMode>(
    'srghmakhmerdict__khmer_words_hiding_mode',
    { defaultValue: 'disabled' },
  )

  const [nonKhmerWordsHidingMode, setNonKhmerWordsHidingMode] = useLocalStorageState<WordsHidingMode>(
    'srghmakhmerdict__non_khmer_words_hiding_mode',
    { defaultValue: 'disabled' },
  )

  const [autoReadMode, setAutoReadMode] = useLocalStorageState<AutoReadMode>('srghmakhmerdict__auto_read_mode', {
    defaultValue: 'disabled',
  })

  const [autoReadLangs, setAutoReadLangs] = useLocalStorageState<Record<'en' | 'km' | 'ru', boolean>>(
    'srghmakhmerdict__auto_read_langs',
    {
      defaultValue: { en: true, km: true, ru: true },
    },
  )

  const [location, setLocation] = useLocalStorageState<LanguagesOrAuto>('srghmakhmerdict__location', {
    defaultValue: 'auto',
  })

  // TODO: delete me, make both always
  const [khmerAnalyzerEnabledSegmenters, setKhmerAnalyzerEnabledSegmenters] =
    useLocalStorageState<KhmerAnalyzerEnabledSegmenters>('srghmakhmerdict__khmer_analyzer_enabled_segmenters', {
      defaultValue: 'both',
    })

  const [khmerAnalyzerMarkdownEnabled, setKhmerAnalyzerMarkdownEnabled] = useLocalStorageState<boolean>(
    'srghmakhmerdict__khmer_analyzer_markdown_enabled',
    { defaultValue: false },
  )

  const [khmerAnalyzerSegmentationEnabled, setKhmerAnalyzerSegmentationEnabled] = useLocalStorageState<boolean>(
    'srghmakhmerdict__khmer_analyzer_segmentation_enabled',
    { defaultValue: true },
  )

  const [khmerAnalyzerCharacterAnalysisEnabled, setKhmerAnalyzerCharacterAnalysisEnabled] =
    useLocalStorageState<boolean>('srghmakhmerdict__khmer_analyzer_character_analysis_enabled', {
      defaultValue: true,
    })

  const [isShowShortDetailAboutKhmerWordEnabled, setIsShowShortDetailAboutKhmerWordEnabled] =
    useLocalStorageState<boolean>('srghmakhmerdict__is_show_short_detail_about_khmer_word_enabled', {
      defaultValue: false,
    })

  const [ankiTableState, setAnkiTableState] = useLocalStorageState<AnkiTableState>(
    'srghmakhmerdict__anki_table_state',
    {
      defaultValue: DEFAULT_ANKI_TABLE_STATE,
    },
  )

  const toggleKhmerLinks = useCallback(() => {
    setIsKhmerLinksEnabled(prev => !prev)
  }, [setIsKhmerLinksEnabled])

  const toggleShowShortDetailAboutKhmerWord = useCallback(() => {
    setIsShowShortDetailAboutKhmerWordEnabled(prev => !prev)
  }, [setIsShowShortDetailAboutKhmerWordEnabled])

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
      scaling_ui: scaling_ui ?? 14,
      setScalingPercentage_ui,
      scaling_details: scaling_details ?? 16,
      setScalingPercentage_details,
      filters: filters ?? DEFAULT_FILTERS,
      setFilters,
      imageMode: imageMode ?? 'online',
      setImageMode,
      maybeColorMode: maybeColorMode ?? 'segmenter',
      setMaybeColorMode,
      isKhmerLinksEnabled: isKhmerLinksEnabled ?? true,
      setIsKhmerLinksEnabled,
      toggleKhmerLinks,
      khmerWordsHidingMode: khmerWordsHidingMode ?? 'disabled',
      setKhmerWordsHidingMode,
      nonKhmerWordsHidingMode: nonKhmerWordsHidingMode ?? 'disabled',
      setNonKhmerWordsHidingMode,
      khmerFontName: khmerFontName ?? 'Default',
      khmerFontFamily: KHMER_FONT_FAMILY[khmerFontName ?? 'Default'],
      setKhmerFontName,
      autoReadMode: autoReadMode ?? 'disabled',
      setAutoReadMode,
      autoReadLangs: autoReadLangs ?? { en: true, km: true, ru: true },
      setAutoReadLangs,
      location: location ?? 'auto',
      setLocation,
      khmerAnalyzerEnabledSegmenters: khmerAnalyzerEnabledSegmenters ?? 'segmenter',
      setKhmerAnalyzerEnabledSegmenters,
      khmerAnalyzerMarkdownEnabled: khmerAnalyzerMarkdownEnabled ?? false,
      setKhmerAnalyzerMarkdownEnabled,

      khmerAnalyzerSegmentationEnabled: khmerAnalyzerSegmentationEnabled ?? true,
      setKhmerAnalyzerSegmentationEnabled,

      khmerAnalyzerCharacterAnalysisEnabled: khmerAnalyzerCharacterAnalysisEnabled ?? true,
      setKhmerAnalyzerCharacterAnalysisEnabled,

      isShowShortDetailAboutKhmerWordEnabled: isShowShortDetailAboutKhmerWordEnabled ?? false,
      setIsShowShortDetailAboutKhmerWordEnabled,
      toggleShowShortDetailAboutKhmerWord,

      ankiTableState: { ...DEFAULT_ANKI_TABLE_STATE, ...ankiTableState },
      setAnkiTableState,
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
      scaling_ui,
      setScalingPercentage_ui,
      scaling_details,
      setScalingPercentage_details,
      filters,
      setFilters,
      imageMode,
      setImageMode,
      maybeColorMode,
      setMaybeColorMode,
      isKhmerLinksEnabled,
      setIsKhmerLinksEnabled,
      toggleKhmerLinks,
      khmerWordsHidingMode,
      setKhmerWordsHidingMode,
      nonKhmerWordsHidingMode,
      setNonKhmerWordsHidingMode,
      khmerFontName,
      setKhmerFontName,
      autoReadMode,
      setAutoReadMode,
      autoReadLangs,
      setAutoReadLangs,
      location,
      setLocation,
      khmerAnalyzerEnabledSegmenters,
      setKhmerAnalyzerEnabledSegmenters,
      khmerAnalyzerMarkdownEnabled,
      setKhmerAnalyzerMarkdownEnabled,

      khmerAnalyzerSegmentationEnabled,
      setKhmerAnalyzerSegmentationEnabled,

      khmerAnalyzerCharacterAnalysisEnabled,
      setKhmerAnalyzerCharacterAnalysisEnabled,

      isShowShortDetailAboutKhmerWordEnabled,
      setIsShowShortDetailAboutKhmerWordEnabled,
      toggleShowShortDetailAboutKhmerWord,

      ankiTableState,
      setAnkiTableState,
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
