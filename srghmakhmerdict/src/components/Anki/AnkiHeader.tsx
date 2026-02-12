import { memo, useMemo } from 'react'
import { Tabs, Tab } from '@heroui/tabs'
import { cn } from '@heroui/theme'
import { stringToDictionaryLanguageOrThrow, type DictionaryLanguage } from '../../types'
import { type AnkiDirection } from './types'

// Reusing icons/titles from SidebarHeader
import { tab_title_en, tab_title_km, tab_title_ru } from '../SidebarHeader'
import { unknown_shouldBeStringOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string'

interface AnkiHeaderProps {
  activeDict: DictionaryLanguage
  onDictChange: (lang: DictionaryLanguage) => void
  direction: AnkiDirection
  onDirectionChange: (mode: AnkiDirection) => void
  en_dueCount_today: number
  ru_dueCount_today: number
  kh_dueCount_today: number
  en_dueCount_total: number
  ru_dueCount_total: number
  kh_dueCount_total: number
}

/**
 * Wraps the icon and counts to apply a "disabled" visual effect
 */
const TabItemContent = memo(function TabItemContent({
  icon,
  today,
  total,
  isDisabled,
}: {
  icon: React.ReactNode
  today: number
  total: number
  isDisabled: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2 transition-all duration-200', isDisabled && 'grayscale opacity-30')}>
      <div className={cn('transition-all', isDisabled && 'scale-90')}>{icon}</div>
      {total > 0 && (
        <span className={cn('text-[10px] font-mono font-black tabular-nums px-1 rounded-sm')}>
          {today}/{total}
        </span>
      )}
    </div>
  )
})

const tabsClassNames = {
  tabList: 'gap-0 p-0',
  tab: 'h-12 px-2',
  cursor: 'bg-secondary',
}

export const AnkiHeader = memo<AnkiHeaderProps>(
  ({
    activeDict,
    onDictChange,
    direction,
    onDirectionChange,
    en_dueCount_today,
    ru_dueCount_today,
    kh_dueCount_today,
    en_dueCount_total,
    ru_dueCount_total,
    kh_dueCount_total,
  }) => {
    const isGuessingKhmer = direction === 'GUESSING_KHMER'

    const tabs_onSelectionChange = (k: React.Key) => {
      const keyStr = unknown_shouldBeStringOrThrow(k)

      if (keyStr === 'toggle') {
        onDirectionChange(isGuessingKhmer ? 'GUESSING_NON_KHMER' : 'GUESSING_KHMER')

        return
      }
      onDictChange(stringToDictionaryLanguageOrThrow(keyStr))
    }

    const title_en = useMemo(
      () => (
        <TabItemContent
          icon={tab_title_en}
          isDisabled={en_dueCount_total === 0}
          today={en_dueCount_today}
          total={en_dueCount_total}
        />
      ),
      [en_dueCount_today, en_dueCount_total],
    )
    const title_km = useMemo(
      () => (
        <TabItemContent
          icon={tab_title_km}
          isDisabled={kh_dueCount_total === 0}
          today={kh_dueCount_today}
          total={kh_dueCount_total}
        />
      ),
      [kh_dueCount_today, kh_dueCount_total],
    )
    const title_ru = useMemo(
      () => (
        <TabItemContent
          icon={tab_title_ru}
          isDisabled={ru_dueCount_total === 0}
          today={ru_dueCount_today}
          total={ru_dueCount_total}
        />
      ),
      [ru_dueCount_today, ru_dueCount_total],
    )

    const toggleTitle = useMemo(
      () => (
        <div className="flex flex-col items-center justify-center font-black uppercase text-secondary text-xs">
          <span>Guessing</span>
          <span>{isGuessingKhmer ? 'Khmer' : { en: 'English', ru: 'Russian', km: 'En/Ru' }[activeDict]}</span>
        </div>
      ),
      [isGuessingKhmer, activeDict],
    )

    return (
      <div className="flex flex-col bg-background/95 backdrop-blur-md sticky top-0 z-20 border-b border-divider shrink-0">
        <div className="px-1 pt-1">
          <Tabs
            fullWidth
            aria-label="Anki Dictionary Tabs"
            classNames={tabsClassNames}
            color="secondary"
            radius="sm"
            selectedKey={activeDict}
            variant="underlined"
            onSelectionChange={tabs_onSelectionChange}
          >
            <Tab key="en" disabled={en_dueCount_total === 0} title={title_en} />
            <Tab key="km" disabled={kh_dueCount_total === 0} title={title_km} />
            <Tab key="ru" disabled={ru_dueCount_total === 0} title={title_ru} />
            <Tab key="toggle" className="ml-auto" title={toggleTitle} />
          </Tabs>
        </div>
      </div>
    )
  },
)

AnkiHeader.displayName = 'AnkiHeader'
