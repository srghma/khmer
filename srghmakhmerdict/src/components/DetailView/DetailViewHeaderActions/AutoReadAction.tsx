import { useCallback, useMemo, memo } from 'react'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown'
import { Button } from '@heroui/button'
import { TooltipMobileFriendly } from '../../TooltipMobileFriendly'
import type { SharedSelection } from '@heroui/system'
import { MdRecordVoiceOver } from 'react-icons/md'

import { useSettings, type AutoReadMode } from '../../../providers/SettingsProvider'
import { herouiSharedSelection_getFirst_string } from '../../../utils/herouiSharedSelection_getFirst_string'
import { useI18nContext } from '../../../i18n/i18n-react-custom'

const isAutoReadMode = (key: string): key is AutoReadMode => {
  return ['disabled', 'google_then_native', 'google_only', 'native_only'].includes(key)
}

export const AutoReadAction = memo(() => {
  const { LL } = useI18nContext()
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
        <TooltipMobileFriendly closeDelay={0} content={LL.AUTOREAD.TITLE()}>
          <Button isIconOnly radius="full" variant="light">
            <MdRecordVoiceOver
              className={`h-6 w-6 ${autoReadMode !== 'disabled' ? 'text-primary' : 'text-default-500'}`}
            />
          </Button>
        </TooltipMobileFriendly>
      </DropdownTrigger>
      <DropdownMenu
        disallowEmptySelection
        aria-label={LL.AUTOREAD.TITLE()}
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={handleModeChange}
      >
        <DropdownItem key="disabled">{LL.AUTOREAD.DISABLED()}</DropdownItem>
        <DropdownItem key="google_then_native">{LL.AUTOREAD.GOOGLE_THEN_NATIVE()}</DropdownItem>
        <DropdownItem key="google_only">{LL.AUTOREAD.GOOGLE_ONLY()}</DropdownItem>
        <DropdownItem key="native_only">{LL.AUTOREAD.NATIVE_ONLY()}</DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
})

AutoReadAction.displayName = 'AutoReadAction'
