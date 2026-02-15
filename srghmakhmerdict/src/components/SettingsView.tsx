import React, { memo, useCallback } from 'react'
import type { SharedSelection } from '@heroui/system'
import { Switch } from '@heroui/switch'
import { Button } from '@heroui/button'
import { Select, SelectItem, type SelectedItems } from '@heroui/select'
import { Slider } from '@heroui/slider'
import { LanguageSelector } from './LanguageSelector'
import { ThemeSwitch } from './theme-switch'
import { GoTable, GoInfo } from 'react-icons/go'
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
import {
  ScalingPercentage_default,
  ScalingPercentage_max,
  ScalingPercentage_min,
  ScalingPercentage_sliderMarks,
  numberToScalingPercentageOrThrow,
} from '../utils/ScalingPercentage'
import { herouiSharedSelection_getFirst_string } from '../utils/herouiSharedSelection_getFirst_string'

const SiGooglepay_ = <SiGooglepay className="text-2xl" />
const FaDollarSign_ = <FaDollarSign className="text-xl" />

const selectClassNames = {
  trigger: `min-h-unit-8 h-8 text-base`,
  value: `font-medium text-base`,
}
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
        const val = herouiSharedSelection_getFirst_string(keys)

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
        <span className="text-foreground/80 shrink-0 text-base">{label}</span>
        <Select
          disallowEmptySelection
          aria-label={label}
          className="max-w-[200px]"
          classNames={selectClassNames}
          listboxProps={{ className: 'text-base' }}
          popoverProps={{ className: 'text-base' }}
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
    scaling_ui,
    setScalingPercentage_ui,
    scaling_details,
    setScalingPercentage_details,
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

  const handleUiScaleChange = useCallback(
    (v: number | number[]) => {
      if (Array.isArray(v)) throw new Error('Array is not expected')
      if (typeof v !== 'number') throw new Error('Number is expected')
      setScalingPercentage_ui(numberToScalingPercentageOrThrow(v))
    },
    [setScalingPercentage_ui],
  )

  const handleDetailsScaleChange = useCallback(
    (v: number | number[]) => {
      if (Array.isArray(v)) throw new Error('Array is not expected')
      if (typeof v !== 'number') throw new Error('Number is expected')
      setScalingPercentage_details(numberToScalingPercentageOrThrow(v))
    },
    [setScalingPercentage_details],
  )

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-foreground text-xl">{LL.SETTINGS.TITLE()}</h2>
        <p className="text-default-500 text-sm">{LL.SETTINGS.SUBTITLE()}</p>
      </div>

      <div className="flex flex-col gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Text Size Settings Group - Moved to Top */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="font-semibold text-default-500 uppercase tracking-wider text-xs">
            {LL.SETTINGS.GROUPS.TEXT_SIZE()}
          </span>

          {/* UI Scale Slider */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex justify-between">
              <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.UI_SIZE()}</span>
              <span className="text-tiny text-default-400">{scaling_ui}%</span>
            </div>
            <Slider
              showSteps
              showTooltip
              aria-label={LL.SETTINGS.LABELS.UI_SIZE()}
              color="primary"
              defaultValue={ScalingPercentage_default}
              marks={ScalingPercentage_sliderMarks}
              maxValue={ScalingPercentage_max}
              minValue={ScalingPercentage_min}
              size="sm"
              step={1}
              value={scaling_ui}
              onChange={handleUiScaleChange}
            />
          </div>

          {/* Details Text Size Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.DEFINITION_TEXT_SIZE()}</span>
              <span className="text-tiny text-default-400">{scaling_details}%</span>
            </div>
            <Slider
              showSteps
              showTooltip
              aria-label={LL.SETTINGS.LABELS.DEFINITION_TEXT_SIZE()}
              color="primary"
              defaultValue={ScalingPercentage_default}
              marks={ScalingPercentage_sliderMarks}
              maxValue={ScalingPercentage_max}
              minValue={ScalingPercentage_min}
              size="sm"
              step={1}
              value={scaling_details}
              onChange={handleDetailsScaleChange}
            />
          </div>
        </div>

        {/* Tools Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-primary-50/50 border border-primary-100 dark:bg-primary-900/10 dark:border-primary-900/30">
          <span className="font-semibold text-primary-500 uppercase tracking-wider text-xs">
            {LL.SETTINGS.GROUPS.TOOLS()}
          </span>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full justify-start font-medium"
              color="primary"
              startContent={<GoTable className="text-xl" />}
              variant="flat"
              onPress={() => setLocation('/khmer_complex_table')}
            >
              <span className="text-base">{LL.SETTINGS.ACTIONS.OPEN_KHMER_COMPLEX_TABLE()}</span>
            </Button>
            <Button
              className="w-full justify-start font-medium"
              color="primary"
              startContent={<FaSearchPlus className="text-xl" />}
              variant="flat"
              onPress={() => setLocation('/khmer_analyzer')}
            >
              <span className="text-base">{LL.SETTINGS.ACTIONS.OPEN_KHMER_ANALYZER()}</span>
            </Button>
          </div>
        </div>

        {/* Search Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="font-semibold text-default-500 uppercase tracking-wider text-xs">
            {LL.SETTINGS.GROUPS.SEARCH()}
          </span>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.SEARCH_MODE()}</span>
              <span className="text-default-400 text-sm">{LL.SETTINGS.LABELS.SEARCH_MODE_HINT()}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-default-200/50 p-1 rounded-lg">
              {(['starts_with', 'includes', 'regex'] as const).map(mode => (
                <Button
                  key={mode}
                  className={`h-8 min-w-0 ${
                    searchMode === mode ? 'bg-background shadow-sm' : 'bg-transparent text-default-500'
                  } text-sm`}
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
              <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.SEARCH_IN_CONTENT()}</span>
              <span className="text-default-400 text-sm">{LL.SETTINGS.LABELS.SEARCH_IN_CONTENT_HINT()}</span>
            </div>
            <Switch isSelected={searchInContent} size="sm" onValueChange={setSearchInContent} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_LIST()}</span>
              <span className="text-default-400 text-sm">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_LIST_HINT()}</span>
            </div>
            <Switch isSelected={highlightInList} size="sm" onValueChange={setHighlightInList} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_DETAILS()}</span>
              <span className="text-default-400 text-sm">{LL.SETTINGS.LABELS.HIGHLIGHT_IN_DETAILS_HINT()}</span>
            </div>
            <Switch isSelected={highlightInDetails} size="sm" onValueChange={setHighlightInDetails} />
          </div>
        </div>

        {/* Interface Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="font-semibold text-default-500 uppercase tracking-wider text-xs">
            {LL.SETTINGS.GROUPS.INTERFACE()}
          </span>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.THEME()}</span>
              <span className="text-default-400 text-sm">{LL.SETTINGS.LABELS.THEME_HINT()}</span>
            </div>
            <ThemeSwitch />
          </div>

          <LanguageSelector />
        </div>

        {/* Khmer Filters */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="font-semibold text-default-500 uppercase tracking-wider text-xs">
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
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-warning-50/50 border border-warning-100 dark:bg-warning-900/10 dark:border-primary-900/30">
          <span className="font-semibold text-warning-600 uppercase tracking-wider text-xs">
            {LL.SETTINGS.GROUPS.PROJECT()}
          </span>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full justify-start font-medium"
              color="warning"
              startContent={<GoInfo className="text-xl" />}
              variant="flat"
              onPress={() => setLocation('/about')}
            >
              <span className="text-base">{LL.SETTINGS.ACTIONS.ABOUT()}</span>
            </Button>
            <Button
              className="w-full justify-start font-medium"
              color="warning"
              endContent={SiGooglepay_}
              startContent={FaDollarSign_}
              variant="flat"
              onPress={() => {
                alert('Google Pay donation integration would go here (requires native plugin setup).')
              }}
            >
              <span className="text-base">{LL.SETTINGS.ACTIONS.DONATE()}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})

SettingsView.displayName = 'SettingsView'
