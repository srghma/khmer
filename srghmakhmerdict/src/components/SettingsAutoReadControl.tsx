import { memo, useCallback, useState, useMemo } from 'react'
import { Button } from '@heroui/button'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Select, SelectItem, type SelectedItems } from '@heroui/select'
import { Checkbox } from '@heroui/checkbox'
import { MdRecordVoiceOver } from 'react-icons/md'
import type { SharedSelection } from '@heroui/system'
import { useSettings, stringToAutoReadModeOrThrow } from '../providers/SettingsProvider'
import { useI18nContext } from '../i18n/i18n-react-custom'
import { herouiSharedSelection_getFirst_string } from '../utils/herouiSharedSelection_getFirst_string'

export const SettingsAutoReadControl = memo(function SettingsAutoReadControl() {
  const { autoReadMode, setAutoReadMode, autoReadLangs, setAutoReadLangs } = useSettings()
  const { LL } = useI18nContext()
  const [isOpen, setIsOpen] = useState(false)

  const handleModeChange = useCallback(
    (keys: SharedSelection) => {
      const selectedKey = herouiSharedSelection_getFirst_string(keys)

      if (selectedKey) {
        setAutoReadMode(stringToAutoReadModeOrThrow(selectedKey))
      }
    },
    [setAutoReadMode],
  )

  const toggleLang = useCallback(
    (lang: 'en' | 'km' | 'ru') => {
      setAutoReadLangs(prev => {
        if (!prev) return { en: true, km: true, ru: true, [lang]: false }

        return { ...prev, [lang]: !prev[lang] }
      })
    },
    [setAutoReadLangs],
  )

  const renderValue = useCallback((items: SelectedItems<object>) => {
    return items.map(item => (
      <div key={item.key} className="flex items-center gap-1">
        {item.rendered}
      </div>
    ))
  }, [])

  const selectClassNames = useMemo(
    () => ({
      trigger: `min-h-unit-8 h-10 text-base`,
      value: `font-medium text-base`,
    }),
    [],
  )

  const select_selectedKeys = useMemo(() => new Set([autoReadMode]), [autoReadMode])

  return (
    <>
      <div className="flex flex-col gap-3 p-3 rounded-medium bg-default-100/50 border border-default-100">
        <span className="font-semibold text-default-500 uppercase tracking-wider text-xs">Automatic Read</span>
        <Button
          className="w-full justify-start font-medium"
          color="primary"
          startContent={<MdRecordVoiceOver className="text-xl" />}
          variant="flat"
          onPress={() => setIsOpen(true)}
        >
          <span className="text-base truncate">{LL.AUTOREAD.TITLE()}</span>
        </Button>
      </div>

      <Modal isOpen={isOpen} placement="center" onClose={() => setIsOpen(false)}>
        <ModalContent>
          {onCloseModal => (
            <>
              <ModalHeader className="flex flex-col gap-1">{LL.AUTOREAD.TITLE()}</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Select
                    disallowEmptySelection
                    aria-label={LL.AUTOREAD.TITLE()}
                    classNames={selectClassNames}
                    renderValue={renderValue}
                    selectedKeys={select_selectedKeys}
                    variant="flat"
                    onSelectionChange={handleModeChange}
                  >
                    <SelectItem key="disabled">{LL.AUTOREAD.DISABLED()}</SelectItem>
                    <SelectItem key="google_then_native">{LL.AUTOREAD.GOOGLE_THEN_NATIVE()}</SelectItem>
                    <SelectItem key="google_only">{LL.AUTOREAD.GOOGLE_ONLY()}</SelectItem>
                    <SelectItem key="native_only">{LL.AUTOREAD.NATIVE_ONLY()}</SelectItem>
                  </Select>

                  {autoReadMode !== 'disabled' && (
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="font-semibold text-sm">Read what:</span>
                      <Checkbox isSelected={autoReadLangs.en} onValueChange={() => toggleLang('en')}>
                        English
                      </Checkbox>
                      <Checkbox isSelected={autoReadLangs.km} onValueChange={() => toggleLang('km')}>
                        Khmer
                      </Checkbox>
                      <Checkbox isSelected={autoReadLangs.ru} onValueChange={() => toggleLang('ru')}>
                        Russian
                      </Checkbox>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onCloseModal}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
})
