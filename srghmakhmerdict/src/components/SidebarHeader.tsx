import React, { memo } from 'react'
import { Tabs, Tab } from '@heroui/react'
import { GoHistory, GoStar, GoGear } from 'react-icons/go'
import { SearchBar } from './SearchBar'
import type { AppTab } from '../types'

interface SidebarHeaderProps {
  activeTab: AppTab
  onTabChange: (key: React.Key) => void
  onSearch: (q: string) => void
  resultCount: number
  isRegex: boolean
  showSearchBar: boolean
}

export const SidebarHeader = memo<SidebarHeaderProps>(
  ({ activeTab, onTabChange, onSearch, resultCount, isRegex, showSearchBar }) => {
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
            onSelectionChange={onTabChange}
          >
            <Tab key="en" title={<span className="text-lg">🇬🇧</span>} />
            <Tab key="km" title={<span className="text-lg">🇰🇭</span>} />
            <Tab key="ru" title={<img alt="RU" className="w-5 h-5" src="/free_russia_flag_wavy.svg" />} />
            <Tab key="history" title={<GoHistory className="text-lg" />} />
            <Tab key="favorites" title={<GoStar className="text-lg" />} />
            <Tab key="settings" title={<GoGear className="text-lg" />} />
          </Tabs>
        </div>
        {showSearchBar && (
          <SearchBar
            key={activeTab} // Force reset on tab change
            activeTab={activeTab}
            count={resultCount}
            isRegex={isRegex}
            onSearch={onSearch}
          />
        )}
      </div>
    )
  },
)

SidebarHeader.displayName = 'SidebarHeader'
