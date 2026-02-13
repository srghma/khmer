import { useCallback, useMemo, memo } from 'react'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { Button } from '@heroui/button'
import { TooltipMobileFriendly } from '../../TooltipMobileFriendly'
import type { SharedSelection } from '@heroui/system'
import { MdRecordVoiceOver } from 'react-icons/md'

import { useSettings, type AutoReadMode } from '../../../providers/SettingsProvider'
import { herouiSharedSelection_getFirst_string } from '../../../utils/herouiSharedSelection_getFirst_string'

const isAutoReadMode = (key: string): key is AutoReadMode => {
  return ['disabled', 'google_then_native', 'google_only', 'native_only'].includes(key)
}

export const AutoReadAction = memo(() => {
  const { autoReadMode, setAutoReadMode } = useSettings()

  const selectedKeys = useMemo(() => [autoReadMode], [autoReadMode])

  const handleModeChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = herouiSharedSelection_getFirst_string(keys)

      if (selectedKey && isAutoReadMode(selectedKey)) {
        setAutoReadMode(selectedKey)
      }
    },
    [setAutoReadMode],
  )

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button isIconOnly radius="full" variant="light">
          <TooltipMobileFriendly closeDelay={0} content="Auto-Read Settings">
            <MdRecordVoiceOver
              className={`h-6 w-6 ${autoReadMode !== 'disabled' ? 'text-primary' : 'text-default-500'}`}
            />
          </TooltipMobileFriendly>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label="Auto-Read Settings"
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleModeChange}
      >
        <DropdownItem key="disabled">Disabled</DropdownItem>
        <DropdownItem key="google_then_native">Prefer Google & Fallback to Native</DropdownItem>
        <DropdownItem key="google_only">Google Only (won't work if offline)</DropdownItem>
        <DropdownItem key="native_only">Native Only</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
})

AutoReadAction.displayName = 'AutoReadAction'
