import { memo } from 'react'
import { Tabs, Tab } from '@heroui/tabs'
import { Switch } from '@heroui/switch'
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
  count: number
  isEnTabDisabled: boolean
  isRuTabDisabled: boolean
  isKhTabDisabled: boolean
}

const switchClassNames = {
  base: cn(
    'inline-flex flex-row-reverse w-full max-w-md bg-content1 hover:bg-content2 items-center',
    'justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent',
    'data-[selected=true]:border-secondary',
  ),
}

export const AnkiHeader = memo<AnkiHeaderProps>(
  ({
    activeDict,
    onDictChange,
    direction,
    onDirectionChange,
    count,
    isEnTabDisabled,
    isRuTabDisabled,
    isKhTabDisabled,
  }) => {
    const isGuessingKhmer = direction === 'GUESSING_KHMER'

    const tabs_onSelectionChange = (k: React.Key) =>
      onDictChange(stringToDictionaryLanguageOrThrow(unknown_shouldBeStringOrThrow(k)))

    const switch_onValueChange = (isSelected: boolean) =>
      onDirectionChange(isSelected ? 'GUESSING_KHMER' : 'GUESSING_NON_KHMER')

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
            onSelectionChange={tabs_onSelectionChange}
          >
            <Tab key="en" title={tab_title_en} disabled={isEnTabDisabled} />
            <Tab key="km" title={tab_title_km} disabled={isKhTabDisabled} />
            <Tab key="ru" title={tab_title_ru} disabled={isRuTabDisabled} />
          </Tabs>
        </div>

        <div className="px-4 mt-2 flex items-center justify-between">
          <span className="text-tiny font-bold uppercase text-default-500 tracking-wider">Due: {count}</span>
          <Switch
            classNames={switchClassNames}
            color="secondary"
            isSelected={isGuessingKhmer}
            size="sm"
            onValueChange={switch_onValueChange}
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
  },
)

AnkiHeader.displayName = 'AnkiHeader'
