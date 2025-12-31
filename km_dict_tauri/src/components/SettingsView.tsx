import React, { memo, useCallback } from 'react'
import { Switch } from '@heroui/switch'
import { Button } from '@heroui/button'
import { Select, SelectItem } from '@heroui/select'
import { ThemeSwitch } from './theme-switch'
import { GoDash, GoPlus, GoTable } from 'react-icons/go'

export type FilterExistence = 'all' | 'with'
export type FilterContent = 'all' | 'with' | 'with_kh'

export interface DictFilterSettings {
  km: {
    desc: FilterContent
    phonetic: FilterExistence
    wiktionary: FilterExistence
    from_csv: FilterExistence
    from_chuon_nath: FilterExistence
    from_russian_wiki: FilterExistence
  }
  en: {
    desc: FilterContent
  }
  ru: {
    desc: FilterContent
  }
}

interface SettingsViewProps {
  isRegex: boolean
  setIsRegex: (v: boolean) => void
  searchInContent: boolean
  setSearchInContent: (v: boolean) => void
  highlightInList: boolean
  setHighlightInList: (v: boolean) => void
  highlightInDetails: boolean
  setHighlightInDetails: (v: boolean) => void
  uiFontSize: number
  setUiFontSize: React.Dispatch<React.SetStateAction<number>>
  detailsFontSize: number
  setDetailsFontSize: React.Dispatch<React.SetStateAction<number>>
  filters: DictFilterSettings
  setFilters: React.Dispatch<React.SetStateAction<DictFilterSettings>>
  onOpenKhmerTable: () => void
}

const ExistenceOptions = [
  { key: 'all', label: 'Show All' },
  { key: 'with', label: 'Only With' },
]

const ContentOptions = [
  { key: 'all', label: 'Show All' },
  { key: 'with', label: 'Only With' },
  { key: 'with_kh', label: 'With + Khmer' },
]

// Pure component for selects to avoid re-rendering entire list on one change
const FilterSelect = memo(
  ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string
    value: string
    options: typeof ExistenceOptions
    onChange: (val: any) => void
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

export const SettingsView: React.FC<SettingsViewProps> = memo(props => {
  const { setFilters, setUiFontSize, setDetailsFontSize } = props

  const updateKm = useCallback(
    (key: keyof DictFilterSettings['km'], val: any) =>
      setFilters(prev => ({ ...prev, km: { ...prev.km, [key]: val } })),
    [setFilters],
  )

  const updateEn = useCallback(
    (key: keyof DictFilterSettings['en'], val: any) =>
      setFilters(prev => ({ ...prev, en: { ...prev.en, [key]: val } })),
    [setFilters],
  )

  const updateRu = useCallback(
    (key: keyof DictFilterSettings['ru'], val: any) =>
      setFilters(prev => ({ ...prev, ru: { ...prev.ru, [key]: val } })),
    [setFilters],
  )

  // Handlers for font size buttons to avoid inline arrow functions
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

      <div className="flex flex-col gap-4">
        {/* Tools Group */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-primary-50/50 border border-primary-100 dark:bg-primary-900/10 dark:border-primary-900/30">
          <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">Tools</span>
          <Button
            className="w-full justify-start font-medium"
            color="primary"
            startContent={<GoTable />}
            variant="flat"
            onPress={props.onOpenKhmerTable}
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
            <Switch isSelected={props.isRegex} size="sm" onValueChange={props.setIsRegex} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Search in Content</span>
              <span className="text-xs text-default-400">Include results found in definitions</span>
            </div>
            <Switch isSelected={props.searchInContent} size="sm" onValueChange={props.setSearchInContent} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Highlight in List</span>
              <span className="text-xs text-default-400">Highlight matches in word list</span>
            </div>
            <Switch isSelected={props.highlightInList} size="sm" onValueChange={props.setHighlightInList} />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Highlight in Details</span>
              <span className="text-xs text-default-400">Highlight matches in definition</span>
            </div>
            <Switch isSelected={props.highlightInDetails} size="sm" onValueChange={props.setHighlightInDetails} />
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
              <span className="w-8 text-center text-sm font-mono">{props.uiFontSize}</span>
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
              <span className="w-8 text-center text-sm font-mono">{props.detailsFontSize}</span>
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
              options={ContentOptions}
              value={props.filters.km.desc}
              onChange={v => updateKm('desc', v)}
            />
            <FilterSelect
              label="Phonetic"
              options={ExistenceOptions}
              value={props.filters.km.phonetic}
              onChange={v => updateKm('phonetic', v)}
            />
            <FilterSelect
              label="Wiktionary"
              options={ExistenceOptions}
              value={props.filters.km.wiktionary}
              onChange={v => updateKm('wiktionary', v)}
            />
            <FilterSelect
              label="From CSV"
              options={ExistenceOptions}
              value={props.filters.km.from_csv}
              onChange={v => updateKm('from_csv', v)}
            />
            <FilterSelect
              label="Chuon Nath"
              options={ExistenceOptions}
              value={props.filters.km.from_chuon_nath}
              onChange={v => updateKm('from_chuon_nath', v)}
            />
            <FilterSelect
              label="Russian Wiki"
              options={ExistenceOptions}
              value={props.filters.km.from_russian_wiki}
              onChange={v => updateKm('from_russian_wiki', v)}
            />
          </div>
        </div>

        {/* English Filters */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">English Dictionary</span>
          <div className="flex flex-col gap-2">
            <FilterSelect
              label="Description"
              options={ContentOptions}
              value={props.filters.en.desc}
              onChange={v => updateEn('desc', v)}
            />
          </div>
        </div>

        {/* Russian Filters */}
        <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
          <span className="text-xs font-semibold text-default-500 uppercase tracking-wider">Russian Dictionary</span>
          <div className="flex flex-col gap-2">
            <FilterSelect
              label="Description"
              options={ContentOptions}
              value={props.filters.ru.desc}
              onChange={v => updateRu('desc', v)}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

SettingsView.displayName = 'SettingsView'
