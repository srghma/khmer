import { memo, useCallback } from 'react'
import { Tabs, Tab } from '@heroui/tabs'
import { GoHistory, GoStar, GoGear } from 'react-icons/go'
import { SearchBar } from './SearchBar'
import { stringToAppTabOrThrow, type AppTab } from '../types'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface SidebarHeaderProps {
  activeTab: AppTab
  onTabChange: (key: AppTab) => void
  onSearch: (q: NonEmptyStringTrimmed | undefined) => void
  searchInitialValue: NonEmptyStringTrimmed | undefined
  resultCount: number
  isRegex: boolean
  showSearchBar: boolean
}

export const tab_title_en = <span className="text-lg">🇬🇧</span>
export const tab_title_km = <span className="text-lg">🇰🇭</span>

export const tab_title_ru = <img alt="RU" className="w-5 h-5" src="/free_russia_flag_wavy.svg" />
const tab_title_history = <GoHistory className="text-lg" />
const tab_title_favorites = <GoStar className="text-lg" />
const tab_title_settings = <GoGear className="text-lg" />

export const SidebarHeader = memo<SidebarHeaderProps>(
  ({ activeTab, onTabChange, onSearch, resultCount, isRegex, showSearchBar, searchInitialValue }) => {
    const handleTabChange = useCallback(
      (key: React.Key) => {
        if (!key) throw new Error('expected string')
        if (typeof key !== 'string') throw new Error('expected string')
        onTabChange(stringToAppTabOrThrow(key))
      },
      [onTabChange],
    )

    return (
      <div className="flex flex-col bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-divider">
        <div className="px-2 pt-2">
          <Tabs
            fullWidth
            aria-label="Dictionary Tabs"
            color="warning"
            radius="none"
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={handleTabChange}
          >
            <Tab key="en" title={tab_title_en} />
            <Tab key="km" title={tab_title_km} />
            <Tab key="ru" title={tab_title_ru} />
            <Tab key="history" title={tab_title_history} />
            <Tab key="favorites" title={tab_title_favorites} />
            <Tab key="settings" title={tab_title_settings} />
          </Tabs>
        </div>
        {showSearchBar && (
          <SearchBar
            key={activeTab} // Force reset on tab change
            activeTab={activeTab}
            count={resultCount}
            initialValue={searchInitialValue}
            isRegex={isRegex}
            onSearch={onSearch}
          />
        )}
      </div>
    )
  },
)

SidebarHeader.displayName = 'SidebarHeader'
