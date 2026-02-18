import { memo, useMemo } from 'react'
import { Card, CardBody, Listbox, ListboxItem } from '@heroui/react'
import { HiArrowDownTray, HiArrowUpTray } from 'react-icons/hi2'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { useAnkiNavigation } from './useAnkiNavigation'
import { useAnkiRoute } from './useAnkiRoute'

export const AnkiSettingsMenu = memo(() => {
  const { LL } = useI18nContext()
  const { navigateToImport, navigateToExport } = useAnkiNavigation()
  const route = useAnkiRoute()

  // If we are at root /anki/settings, no key is selected visually, or we can treat 'general' as default on Desktop logic
  const activeKey = route.t === 'settings' ? route.subPage : undefined
  const selectedKeys = useMemo(() => (activeKey ? new Set([activeKey]) : new Set([])), [activeKey])

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto scrollbar-hide">
      <h2 className="text-xl font-black uppercase tracking-tight text-foreground px-2">{LL.ANKI.SETTINGS.TITLE()}</h2>

      <Card className="border-none shadow-none bg-transparent" shadow="sm">
        <CardBody className="p-0">
          <Listbox
            disallowEmptySelection
            aria-label="Settings Menu"
            className="p-0 gap-2 bg-transparent"
            itemClasses={{
              base: 'px-4 py-3 data-[hover=true]:bg-default-100/50',
              title: 'text-base font-medium',
            }}
            selectedKeys={selectedKeys}
            selectionMode="single"
            variant="flat"
          >
            <ListboxItem
              key="import"
              startContent={<HiArrowDownTray className="text-xl text-default-500" />}
              onPress={navigateToImport}
            >
              {LL.ANKI.IMPORT.TITLE()}
            </ListboxItem>

            <ListboxItem
              key="export"
              startContent={<HiArrowUpTray className="text-xl text-default-500" />}
              onPress={navigateToExport}
            >
              {LL.ANKI.EXPORT.TITLE()}
            </ListboxItem>
          </Listbox>
        </CardBody>
      </Card>
    </div>
  )
})

AnkiSettingsMenu.displayName = 'AnkiSettingsMenu'
