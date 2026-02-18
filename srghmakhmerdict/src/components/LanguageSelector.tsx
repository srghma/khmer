import { memo, useCallback, useMemo } from 'react'
import { Select, SelectItem, type SelectedItems } from '@heroui/select'
import { useSettings } from '../providers/SettingsProvider'
import { stringToLanguagesOrAutoOrThrow, LANGUAGES_OR_AUTO } from '../i18n/languages'
import { useI18nContext } from '../i18n/i18n-react-custom'
import type { SharedSelection } from '@heroui/system'
import { herouiSharedSelection_getFirst_string } from '../utils/herouiSharedSelection_getFirst_string'
import {
  assertIsDefinedAndReturn,
  assertNever,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { tab_title_ru } from './SidebarHeader'

export const LanguageSelector = memo(() => {
  const { LL, isLocaleLoading } = useI18nContext()
  const { location, setLocation } = useSettings()

  const selectClassNames = useMemo(
    () => ({
      trigger: `min-h-unit-8 h-8 text-base`,
      value: 'text-base',
    }),
    [],
  )

  const handleSelectionChange = useCallback(
    (keys: SharedSelection) => {
      const val = herouiSharedSelection_getFirst_string(keys)
      if (val) {
        setLocation(stringToLanguagesOrAutoOrThrow(val))
      }
    },
    [setLocation],
  )

  // Memoize the items to drive them from the central LANGUAGES_OR_AUTO array
  const languageOptions = useMemo(() => {
    return LANGUAGES_OR_AUTO.map(lang => {
      switch (lang) {
        case 'auto':
          return {
            key: 'auto',
            textValue: `${LL.SETTINGS.LABELS.AUTO()} ✨`,
            label: LL.SETTINGS.LABELS.AUTO(),
            icon: '✨',
          }
        case 'en':
          return { key: 'en', textValue: 'English 🇬🇧', label: 'English', icon: '🇬🇧' }
        case 'ru':
          return { key: 'ru', textValue: 'Русский', label: 'Русский', icon: tab_title_ru }
        case 'uk':
          return { key: 'uk', textValue: 'Українська 🇺🇦', label: 'Українська', icon: '🇺🇦' }
        case 'km':
          return { key: 'km', textValue: 'ខ្មែរ 🇰🇭', label: 'ខ្មែរ', icon: '🇰🇭' }
        default:
          assertNever(lang)
      }
    })
  }, [LL])

  const selectSelectedKeys = useMemo(() => [location], [location])

  const selectRenderValue = useCallback((items: SelectedItems<object>) => {
    return items.map(item => (
      <div key={item.key} className="flex items-center gap-1">
        {item.rendered}
      </div>
    ))
  }, [])

  return (
    <div className="flex justify-between items-center py-1">
      <div className="flex flex-col">
        <span className="font-medium text-foreground text-base">{LL.SETTINGS.LABELS.APP_LANGUAGE()}</span>
        <span className="text-default-400 text-sm">{LL.SETTINGS.LABELS.APP_LANGUAGE_HINT()}</span>
      </div>
      <Select
        disallowEmptySelection
        aria-label={LL.SETTINGS.LABELS.APP_LANGUAGE()}
        className="max-w-[140px] text-base"
        classNames={selectClassNames}
        isLoading={isLocaleLoading}
        listboxProps={{ className: 'text-base' }}
        popoverProps={{ className: 'text-base' }}
        renderValue={selectRenderValue}
        selectedKeys={selectSelectedKeys}
        size="sm"
        variant="flat"
        onSelectionChange={handleSelectionChange}
      >
        {languageOptions.map(opt => (
          <SelectItem key={opt.key} textValue={opt.textValue}>
            <div className="flex items-center gap-1">
              <span>{opt.label}</span>
              <span>{opt.icon}</span>
            </div>
          </SelectItem>
        ))}
      </Select>
    </div>
  )
})

LanguageSelector.displayName = 'LanguageSelector'
