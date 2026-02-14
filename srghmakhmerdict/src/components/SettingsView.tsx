import React, { memo, useCallback } from 'react'
import type { SharedSelection } from '@heroui/system'
import { Switch } from '@heroui/switch'
import { Button } from '@heroui/button'
import { Select, SelectItem, type SelectedItems } from '@heroui/select'
import { LanguageSelector } from './LanguageSelector'
import { ThemeSwitch } from './theme-switch'
import { GoDash, GoPlus, GoTable, GoInfo } from 'react-icons/go'
import { FaDollarSign, FaSearchPlus } from 'react-icons/fa'
import { SiGooglepay } from 'react-icons/si'
import {
  DICT_FILTER_SETTINGS_KM_MODES,
  stringToDictFilterSettingsKmModeOrThrow,
  useSettings,
  type DictFilterSettings,
  type DictFilterSettings_Km_Mode,
} from '../providers/SettingsProvider'
import { SettingsEnKmOfflineImagesControl } from './SettingsEnKmOfflineImagesControl'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { useLocation } from 'wouter'
import { useI18nContext } from '../i18n/i18n-react-custom'
import type { TranslationFunctions } from '../i18n/i18n-types'

// Pure component for selects
const FilterSelect = memo(
  ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: DictFilterSettings_Km_Mode
    onChange: (val: DictFilterSettings_Km_Mode) => void
  }) => {
    const { LL }: { LL: TranslationFunctions } = useI18nContext()

    const handleSelectionChange = useCallback(
      (keys: SharedSelection) => {
        const val = Array.from(keys)[0] as string

        if (val) onChange(stringToDictFilterSettingsKmModeOrThrow(val))
      },
      [onChange],
    )

    const renderValue = useCallback((items: SelectedItems<object>) => {
      return items.map(item => (
        <div key={item.key} className="flex items-center gap-1">
          {item.rendered}
        </div>
      ))
    }, [])

    return (
      <div className="flex justify-between items-center py-1 gap-4">
        <span className="text-sm text-foreground/80 shrink-0">{label}</span>
        <Select
          disallowEmptySelection
          aria-label={label}
          className="max-w-[200px]"
          classNames={{ trigger: 'min-h-unit-8 h-8' }}
          renderValue={renderValue}
          selectedKeys={new Set([value])}
          size="sm"
          variant="flat"
          onSelectionChange={handleSelectionChange}
        >
          {DICT_FILTER_SETTINGS_KM_MODES.map(mode => {
            const labelValue = mode === 'all' ? LL.SETTINGS.LABELS.ALL() : LL.SETTINGS.LABELS.ONLY_VERIFIED()

            return (
              <SelectItem key={mode} textValue={labelValue}>
                {labelValue}
              </SelectItem>
            )
          })}
        </Select>
      </div>
    )
  },
)

FilterSelect.displayName = 'FilterSelect'

// No props needed now
export const SettingsView: React.FC = memo(() => {
  const {
    filters,
    setFilters,
    fontSize_ui,
    setFontSize_ui,
    fontSize_details,
    setFontSize_details,
    searchMode,
    setSearchMode,
    searchInContent,
    setSearchInContent,
    highlightInList,
    setHighlightInList,
    highlightInDetails,
    setHighlightInDetails,
  } = useSettings()

  const { LL }: { LL: TranslationFunctions } = useI18nContext()
  const [, setLocation] = useLocation()

  const updateKm = useCallback(
    (key: keyof DictFilterSettings['km'], val: string) =>
      setFilters(prev => ({
        ...prev,
        km: { ...assertIsDefinedAndReturn(prev).km, [key]: stringToDictFilterSettingsKmModeOrThrow(val) },
      })),
    [setFilters],
  )

  const decUiFont = useCallback(
    () => setFontSize_ui(p => Math.max(10, assertIsDefinedAndReturn(p) - 1)),
    [setFontSize_ui],
  )
  const incUiFont = useCallback(
    () => setFontSize_ui(p => Math.min(24, assertIsDefinedAndReturn(p) + 1)),
    [setFontSize_ui],
  )
  const decDetFont = useCallback(
    () => setFontSize_details(p => Math.max(12, assertIsDefinedAndReturn(p) - 1)),
    [setFontSize_details],
  )
  const incDetFont = useCallback(
    () => setFontSize_details(p => Math.min(32, assertIsDefinedAndReturn(p) + 1)),
    [setFontSize_details],
  )

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6" style={{ fontSize: '14px' }}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">{LL.SETTINGS.TITLE()}</h2>
        <p className="text-xs text-default-500">{LL.SETTINGS.SUBTITLE()}</p>
      </div>

      <div className="flex flex-col gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Tools Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-primary-50/50 border border-primary-100 dark:bg-primary-900/10 dark:border-primary-900/30">
          <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
            {LL.SETTINGS.GROUPS.TOOLS()}
          </span>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full justify-start font-medium"
              color="primary"
              startContent={<GoTable />}
              variant="flat"
              onPress={() => setLocation('/khmer_complex_table')}
            >
              {LL.SETTINGS.ACTIONS.OPEN_KHMER_COMPLEX_TABLE()}
            </Button>
            <Button
              className="w-full justify-start font-medium"
              color="primary"
              startContent={<FaSearchPlus />}
              variant="flat"
              onPress={() => setLocation('/khmer_analyzer')}
            >
              {LL.SETTINGS.ACTIONS.OPEN_KHMER_ANALYZER()}
            </Button>
          </div>
        </div>

        {/* Search Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">
            {LL.SETTINGS.GROUPS.SEARCH()}
          </span>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.SEARCH_MODE()}</span>
              <span className="text-xs text-default-400">{LL.SETTINGS.LABELS.SEARCH_MODE_HINT()}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-default-200/50 p-1 rounded-lg">
              {(['starts_with', 'includes', 'regex'] as const).map(mode => (
                <Button
                  key={mode}
                  className={`text-[10px] h-8 min-w-0 ${
                    searchMode === mode ? 'bg-background shadow-sm' : 'bg-transparent text-default-500'
                  }`}
                  size="sm"
                  variant={searchMode === mode ? 'flat' : 'light'}
                  onPress={() => setSearchMode(mode)}
                >
                  {
                    {
                      starts_with: LL.DETAIL.SEARCH.STARTS(),
                      includes: LL.DETAIL.SEARCH.INCLUDES(),
                      regex: LL.DETAIL.SEARCH.REGEX(),
                    }[mode]
                  }
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.SEARCH_IN_CONTENT()}</span>
              <span className="text-xs text-default-400">{LL.SETTINGS.LABELS.SEARCH_IN_CONTENT_HINT()}</span>
            </div>
            <Switch isSelected={searchInContent} size="sm" onValueChange={setSearchInContent} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_LIST()}</span>
              <span className="text-xs text-default-400">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_LIST_HINT()}</span>
            </div>
            <Switch isSelected={highlightInList} size="sm" onValueChange={setHighlightInList} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_DETAILS()}</span>
              <span className="text-xs text-default-400">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_DETAILS_HINT()}</span>
            </div>
            <Switch isSelected={highlightInDetails} size="sm" onValueChange={setHighlightInDetails} />
          </div>
        </div>

        {/* Interface Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">
            {LL.SETTINGS.GROUPS.INTERFACE()}
          </span>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.THEME()}</span>
              <span className="text-xs text-default-400">{LL.SETTINGS.LABELS.THEME_HINT()}</span>
            </div>
            <ThemeSwitch />
          </div>

          <LanguageSelector />
        </div>

        {/* Text Size Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">
            {LL.SETTINGS.GROUPS.TEXT_SIZE()}
          </span>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.SIDEBAR_LIST_SIZE()}</span>
            </div>
            <div className="flex items-center gap-2 bg-content2 rounded-lg p-1">
              <Button isIconOnly size="sm" variant="flat" onPress={decUiFont}>
                <GoDash />
              </Button>
              <span className="w-8 text-center text-sm font-mono">{fontSize_ui}</span>
              <Button isIconOnly size="sm" variant="flat" onPress={incUiFont}>
                <GoPlus />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.DEFINITION_TEXT_SIZE()}</span>
            </div>
            <div className="flex items-center gap-2 bg-content2 rounded-lg p-1">
              <Button isIconOnly size="sm" variant="flat" onPress={decDetFont}>
                <GoDash />
              </Button>
              <span className="w-8 text-center text-sm font-mono">{fontSize_details}</span>
              <Button isIconOnly size="sm" variant="flat" onPress={incDetFont}>
                <GoPlus />
              </Button>
            </div>
          </div>
        </div>

        {/* Khmer Filters */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">
            {LL.SETTINGS.GROUPS.KHMER_DICT()}
          </span>
          <div className="flex flex-col gap-2">
            <FilterSelect
              label={LL.SETTINGS.LABELS.DESCRIPTION_FILTER()}
              value={filters.km.mode}
              onChange={v => updateKm('mode', v)}
            />
          </div>
        </div>

        <SettingsEnKmOfflineImagesControl />

        {/* About & Support Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-warning-50/50 border border-warning-100 dark:bg-warning-900/10 dark:border-warning-900/30">
          <span className="text-xs font-semibold text-warning-600 uppercase tracking-wider">
            {LL.SETTINGS.GROUPS.PROJECT()}
          </span>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full justify-start font-medium"
              color="warning"
              startContent={<GoInfo />}
              variant="flat"
              onPress={() => setLocation('/about')}
            >
              {LL.SETTINGS.ACTIONS.ABOUT()}
            </Button>
            <Button
              className="w-full justify-start font-medium"
              color="warning"
              endContent={<SiGooglepay className="text-xl" />}
              startContent={<FaDollarSign />}
              variant="flat"
              onPress={() => {
                alert('Google Pay donation integration would go here (requires native plugin setup).')
              }}
            >
              {LL.SETTINGS.ACTIONS.DONATE()}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})

SettingsView.displayName = 'SettingsView'
