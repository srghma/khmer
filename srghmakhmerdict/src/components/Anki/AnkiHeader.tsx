import { memo } from 'react'
import { Tabs, Tab } from '@heroui/tabs'
import { Switch } from '@heroui/switch'
import { cn } from '@heroui/theme'
import type { DictionaryLanguage } from '../../types'
import { type AnkiDirection } from './types'

// Reusing icons/titles from SidebarHeader
import { tab_title_en, tab_title_km, tab_title_ru } from '../SidebarHeader'

interface AnkiHeaderProps {
  activeDict: DictionaryLanguage
  onDictChange: (lang: DictionaryLanguage) => void
  direction: AnkiDirection
  onDirectionChange: (mode: AnkiDirection) => void
  count: number
}

export const AnkiHeader = memo<AnkiHeaderProps>(({ activeDict, onDictChange, direction, onDirectionChange, count }) => {
  const isGuessingKhmer = direction === 'GUESSING_KHMER'

  return (
    <div className="flex flex-col bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-divider pb-2">
      <div className="px-2 pt-2">
        <Tabs
          fullWidth
          aria-label="Anki Dictionary Tabs"
          color="secondary"
          radius="none"
          selectedKey={activeDict}
          variant="underlined"
          onSelectionChange={k => onDictChange(k as DictionaryLanguage)}
        >
          <Tab key="en" title={tab_title_en} />
          <Tab key="km" title={tab_title_km} />
          <Tab key="ru" title={tab_title_ru} />
        </Tabs>
      </div>

      <div className="px-4 mt-2 flex items-center justify-between">
        <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">Due: {count}</span>
        <Switch
          classNames={{
            base: cn(
              'inline-flex flex-row-reverse w-full max-w-md bg-content1 hover:bg-content2 items-center',
              'justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent',
              'data-[selected=true]:border-secondary',
            ),
          }}
          color="secondary"
          isSelected={isGuessingKhmer}
          size="sm"
          onValueChange={isSelected => onDirectionChange(isSelected ? 'GUESSING_KHMER' : 'GUESSING_NON_KHMER')}
        >
          <div className="flex flex-col gap-1">
            <p className="text-tiny text-default-500 uppercase font-bold">
              {isGuessingKhmer ? 'Guessing Khmer' : 'Guessing Meaning/Word'}
            </p>
          </div>
        </Switch>
      </div>
    </div>
  )
})

AnkiHeader.displayName = 'AnkiHeader'
