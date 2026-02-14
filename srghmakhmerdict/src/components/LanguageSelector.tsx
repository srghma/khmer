import { memo, useCallback, useMemo } from 'react'
import { Select, SelectItem, type SelectedItems } from '@heroui/select'
import { useSettings } from '../providers/SettingsProvider'
import { stringToLanguagesOrAutoOrThrow } from '../i18n/languages'
import { useI18nContext } from '../i18n/i18n-react-custom'
import type { SharedSelection } from '@heroui/system'
import { herouiSharedSelection_getFirst_string } from '../utils/herouiSharedSelection_getFirst_string'
import { assertIsDefinedAndReturn } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/asserts'
import { tab_title_ru } from './SidebarHeader'

export const LanguageSelector = memo(() => {
  const { LL, isLocaleLoading } = useI18nContext()
  const { location, setLocation } = useSettings()

  const selectClassNames = useMemo(
    () => ({
      trigger: 'min-h-unit-8 h-8',
    }),
    [],
  )

  const selectSelectedKeys = useMemo(() => [location], [location])

  const handleSelectionChange = useCallback(
    (keys: SharedSelection) => {
      setLocation(stringToLanguagesOrAutoOrThrow(assertIsDefinedAndReturn(herouiSharedSelection_getFirst_string(keys))))
    },
    [setLocation],
  )

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
        <span className="text-sm font-medium text-foreground">{LL.SETTINGS.LABELS.APP_LANGUAGE()}</span>
        <span className="text-xs text-default-400">{LL.SETTINGS.LABELS.APP_LANGUAGE_HINT()}</span>
      </div>
      <Select
        disallowEmptySelection
        aria-label={LL.SETTINGS.LABELS.APP_LANGUAGE()}
        className="max-w-[140px]"
        classNames={selectClassNames}
        isLoading={isLocaleLoading}
        renderValue={selectRenderValue}
        selectedKeys={selectSelectedKeys}
        size="sm"
        variant="flat"
        onSelectionChange={handleSelectionChange}
      >
        <SelectItem key="auto" textValue={`${LL.SETTINGS.LABELS.AUTO()} ✨`}>
          <div className="flex items-center gap-1">
            <span>{LL.SETTINGS.LABELS.AUTO()}</span>
            <span>✨</span>
          </div>
        </SelectItem>
        <SelectItem key="en" textValue="English 🇬🇧">
          <div className="flex items-center gap-1">
            <span>English</span>
            <span>🇬🇧</span>
          </div>
        </SelectItem>
        <SelectItem key="ru" textValue="Русский">
          <div className="flex items-center gap-1">
            <span>Русский</span>
            {tab_title_ru}
          </div>
        </SelectItem>
        <SelectItem key="uk" textValue="Українська 🇺🇦">
          <div className="flex items-center gap-1">
            <span>Українська</span>
            <span>🇺🇦</span>
          </div>
        </SelectItem>
      </Select>
    </div>
  )
})

LanguageSelector.displayName = 'LanguageSelector'
