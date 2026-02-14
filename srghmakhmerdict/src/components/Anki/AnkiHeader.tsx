import { memo, useMemo } from 'react'
import { Tabs, Tab } from '@heroui/tabs'
import { cn } from '@heroui/theme'
import { stringToDictionaryLanguageOrThrow, type DictionaryLanguage } from '../../types'
import { IoClose } from 'react-icons/io5'
import { Button } from '@heroui/button'
import { type AnkiDirection } from './types'

// Reusing icons/titles from SidebarHeader
import { tab_title_en, tab_title_km, tab_title_ru } from '../SidebarHeader'
import { unknown_shouldBeStringOrThrow } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string'
import { useAnkiNavigation } from './useAnkiNavigation'

interface AnkiHeaderProps {
  activeDict: DictionaryLanguage
  direction: AnkiDirection
  onDirectionChange: (mode: AnkiDirection) => void
  en_dueCount_today: number
  ru_dueCount_today: number
  kh_dueCount_today: number
  en_dueCount_total: number
  ru_dueCount_total: number
  kh_dueCount_total: number
  onExit: () => void
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
      <div className={cn('transition-all scale-125 md:scale-100 origin-center', isDisabled && 'scale-90')}>{icon}</div>
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
  tab: 'md:h-12 h-16 px-2',
  cursor: 'bg-secondary',
}

import { useI18nContext } from '../../i18n/i18n-react-custom'

export const AnkiHeader = memo<AnkiHeaderProps>(
  ({
    activeDict,
    direction,
    onDirectionChange,
    en_dueCount_today,
    ru_dueCount_today,
    kh_dueCount_today,
    en_dueCount_total,
    ru_dueCount_total,
    kh_dueCount_total,
    onExit,
  }) => {
    const { navigateToLanguage } = useAnkiNavigation()
    const { LL } = useI18nContext()

    const isGuessingKhmer = direction === 'GUESSING_KHMER'

    const tabs_onSelectionChange = (k: React.Key) => {
      const keyStr = unknown_shouldBeStringOrThrow(k)

      if (keyStr === 'toggle') {
        onDirectionChange(isGuessingKhmer ? 'GUESSING_NON_KHMER' : 'GUESSING_KHMER')

        return
      }
      navigateToLanguage(stringToDictionaryLanguageOrThrow(keyStr))
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
          <span>{LL.ANKI.MODES.GUESSING()}</span>
          <span>
            {isGuessingKhmer
              ? LL.ANKI.LANGUAGES.KHMER()
              : {
                  en: LL.ANKI.LANGUAGES.ENGLISH(),
                  ru: LL.ANKI.LANGUAGES.RUSSIAN(),
                  km: LL.ANKI.LANGUAGES.EN_RU(),
                }[activeDict]}
          </span>
        </div>
      ),
      [isGuessingKhmer, activeDict, LL],
    )

    return (
      <div className="flex flex-col bg-background/95 backdrop-blur-md sticky top-0 z-20 border-b border-divider shrink-0">
        <div className="flex items-center px-1 pt-1 gap-1 md:flex-row-reverse">
          <div className="flex-1">
            <Tabs
              fullWidth
              aria-label={LL.ANKI.ARIA.TABS()}
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

          <Button
            isIconOnly
            className="hover:scale-150 active:scale-70 transition-transform"
            radius="full"
            size="lg"
            variant="light"
            onPress={onExit}
          >
            <IoClose className="text-2xl" />
          </Button>
        </div>
      </div>
    )
  },
)

AnkiHeader.displayName = 'AnkiHeader'
