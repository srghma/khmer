import React, { memo, useCallback } from 'react'
import { Switch } from '@heroui/switch'
import { Button } from '@heroui/button'
import { Select, SelectItem } from '@heroui/select'
import { ThemeSwitch } from './theme-switch'
import { GoDash, GoPlus, GoTable } from 'react-icons/go'
import { useSettings, type DictFilterSettings, type DictFilterSettings_Km_Mode } from '../providers/SettingsProvider'
import { SettingsEnKmOfflineImagesControl } from './SettingsEnKmOfflineImagesControl'

const DictFilterSettings_Km_ModeOptions = [
  { key: 'all', label: 'Show All' },
  { key: 'only_verified', label: 'Only Verified' },
]

// Pure component for selects
const FilterSelect = memo(
  ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string
    value: string
    options: typeof DictFilterSettings_Km_ModeOptions
    onChange: (val: string) => void
  }) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-foreground/80">{label}</span>
      <Select
        disallowEmptySelection
        aria-label={label}
        className="max-w-[140px]"
        classNames={{ trigger: 'min-h-unit-8 h-8' }}
        selectedKeys={[value]}
        size="sm"
        variant="flat"
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <SelectItem key={o.key} textValue={o.label}>
            {o.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  ),
)

FilterSelect.displayName = 'FilterSelect'

// No props needed now
export const SettingsView: React.FC = memo(() => {
  const {
    filters,
    setFilters,
    uiFontSize,
    setUiFontSize,
    detailsFontSize,
    setDetailsFontSize,
    isRegex,
    setIsRegex,
    searchInContent,
    setSearchInContent,
    highlightInList,
    setHighlightInList,
    highlightInDetails,
    setHighlightInDetails,
    onOpenKhmerTable,
  } = useSettings()

  const updateKm = useCallback(
    (key: keyof DictFilterSettings['km'], val: string) =>
      setFilters(prev => ({ ...prev, km: { ...prev.km, [key]: val as DictFilterSettings_Km_Mode } })),
    [setFilters],
  )

  const decUiFont = useCallback(() => setUiFontSize(p => Math.max(10, p - 1)), [setUiFontSize])
  const incUiFont = useCallback(() => setUiFontSize(p => Math.min(24, p + 1)), [setUiFontSize])
  const decDetFont = useCallback(() => setDetailsFontSize(p => Math.max(12, p - 1)), [setDetailsFontSize])
  const incDetFont = useCallback(() => setDetailsFontSize(p => Math.min(32, p + 1)), [setDetailsFontSize])

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6" style={{ fontSize: '14px' }}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">App Settings</h2>
        <p className="text-xs text-default-500">Customize your dictionary experience.</p>
      </div>

      <div className="flex flex-col gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Tools Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-primary-50/50 border border-primary-100 dark:bg-primary-900/10 dark:border-primary-900/30">
          <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">Tools</span>
          <Button
            className="w-full justify-start font-medium"
            color="primary"
            startContent={<GoTable />}
            variant="flat"
            onPress={onOpenKhmerTable}
          >
            Open Khmer Complex Table
          </Button>
        </div>

        {/* Search Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Search</span>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Regex Search</span>
              <span className="text-xs text-default-400">Use regular expressions</span>
            </div>
            <Switch isSelected={isRegex} size="sm" onValueChange={setIsRegex} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Search in Content</span>
              <span className="text-xs text-default-400">Include results found in definitions</span>
            </div>
            <Switch isSelected={searchInContent} size="sm" onValueChange={setSearchInContent} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Highlight in List</span>
              <span className="text-xs text-default-400">Highlight matches in word list</span>
            </div>
            <Switch isSelected={highlightInList} size="sm" onValueChange={setHighlightInList} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Highlight in Details</span>
              <span className="text-xs text-default-400">Highlight matches in definition</span>
            </div>
            <Switch isSelected={highlightInDetails} size="sm" onValueChange={setHighlightInDetails} />
          </div>
        </div>

        {/* Interface Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Interface</span>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Theme</span>
              <span className="text-xs text-default-400">Toggle dark/light mode</span>
            </div>
            <ThemeSwitch />
          </div>
        </div>

        {/* Text Size Settings Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Text Size</span>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Sidebar / List Size</span>
            </div>
            <div className="flex items-center gap-2 bg-content2 rounded-lg p-1">
              <Button isIconOnly size="sm" variant="flat" onPress={decUiFont}>
                <GoDash />
              </Button>
              <span className="w-8 text-center text-sm font-mono">{uiFontSize}</span>
              <Button isIconOnly size="sm" variant="flat" onPress={incUiFont}>
                <GoPlus />
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Definition Text Size</span>
            </div>
            <div className="flex items-center gap-2 bg-content2 rounded-lg p-1">
              <Button isIconOnly size="sm" variant="flat" onPress={decDetFont}>
                <GoDash />
              </Button>
              <span className="w-8 text-center text-sm font-mono">{detailsFontSize}</span>
              <Button isIconOnly size="sm" variant="flat" onPress={incDetFont}>
                <GoPlus />
              </Button>
            </div>
          </div>
        </div>

        {/* Khmer Filters */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Khmer Dictionary</span>
          <div className="flex flex-col gap-2">
            <FilterSelect
              label="Description"
              options={DictFilterSettings_Km_ModeOptions}
              value={filters.km.mode}
              onChange={v => updateKm('mode', v)}
            />
          </div>
        </div>

        <SettingsEnKmOfflineImagesControl />
      </div>
    </div>
  )
})

SettingsView.displayName = 'SettingsView'
