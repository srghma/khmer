import { memo, useCallback } from 'react'
import { Tabs, Tab } from '@heroui/tabs'
import { RiHistoryLine, RiStarLine, RiStarFill, RiSettings3Line, RiSettings3Fill } from 'react-icons/ri'
import { GrHistory } from 'react-icons/gr'
import { SearchBar } from './SearchBar'
import { useI18nContext } from '../i18n/i18n-react-custom'
import { stringToAppTabOrThrow, type AppTab } from '../types'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useLocation } from 'wouter'
import type { SearchMode } from '../providers/SettingsProvider'
import { left_sidebar_tabs__text_className, left_sidebar_tabs__icon_className } from './header_classNames'

interface SidebarHeaderProps {
  activeTab: AppTab
  onSearch: (q: NonEmptyStringTrimmed | undefined) => void
  searchInitialValue: NonEmptyStringTrimmed | undefined
  resultCount: number
  searchMode: SearchMode
  showSearchBar: boolean
}

export const tab_title_en = <span className={left_sidebar_tabs__text_className}>🇬🇧</span>
export const tab_title_km = <span className={left_sidebar_tabs__text_className}>🇰🇭</span>

export const tab_title_ru = (
  <img alt="RU" className={left_sidebar_tabs__icon_className} src="/free_russia_flag_wavy.svg" />
)

const TabsClassNames = {
  tabList: 'gap-0 p-0',
  tab: 'px-0.5 min-w-0 flex-1 h-full cursor-pointer',
  tabContent: 'group-data-[selected=true]:text-warning flex items-center justify-center w-full',
  cursor: 'bg-warning',
}

const Tab_history_icon_active = <GrHistory className={left_sidebar_tabs__icon_className} />
const Tab_history_icon_inactive = <RiHistoryLine className={left_sidebar_tabs__icon_className} />

const Tab_favorites_icon_active = <RiStarFill className={left_sidebar_tabs__icon_className} />
const Tab_favorites_icon_inactive = <RiStarLine className={left_sidebar_tabs__icon_className} />

const Tab_settings_icon_active = <RiSettings3Fill className={left_sidebar_tabs__icon_className} />
const Tab_settings_icon_inactive = <RiSettings3Line className={left_sidebar_tabs__icon_className} />

export const SidebarHeader = memo<SidebarHeaderProps>(
  ({ activeTab, onSearch, resultCount, searchMode, showSearchBar, searchInitialValue }) => {
    const { LL } = useI18nContext()
    const [, setLocation] = useLocation()

    const handleTabChange = useCallback(
      (key: React.Key) => {
        if (!key) throw new Error('expected string')
        if (typeof key !== 'string') throw new Error('expected string')
        setLocation(`/${stringToAppTabOrThrow(key)}`)
      },
      [setLocation],
    )

    return (
      <div className="flex flex-col bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-divider">
        <div className="px-2 pt-2">
          <Tabs
            fullWidth
            aria-label={LL.SIDEBAR.ARIA.TABS()}
            className="text-base"
            classNames={TabsClassNames}
            color="warning"
            radius="none"
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={handleTabChange}
          >
            <Tab key="en" title={tab_title_en} />
            <Tab key="km" title={tab_title_km} />
            <Tab key="ru" title={tab_title_ru} />
            <Tab key="history" title={activeTab === 'history' ? Tab_history_icon_active : Tab_history_icon_inactive} />
            <Tab
              key="favorites"
              title={activeTab === 'favorites' ? Tab_favorites_icon_active : Tab_favorites_icon_inactive}
            />
            <Tab
              key="settings"
              title={activeTab === 'settings' ? Tab_settings_icon_active : Tab_settings_icon_inactive}
            />
          </Tabs>
        </div>
        {showSearchBar && (
          <SearchBar
            key={activeTab} // Force reset on tab change
            activeTab={activeTab}
            count={resultCount}
            initialValue={searchInitialValue}
            searchMode={searchMode}
            onSearch={onSearch}
          />
        )}
      </div>
    )
  },
)

SidebarHeader.displayName = 'SidebarHeader'
