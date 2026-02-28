import { memo, useCallback, useMemo } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
  useDisclosure,
} from '@heroui/react'
import { HiClipboardDocumentList, HiArrowDownTray } from 'react-icons/hi2'
import { useI18nContext } from '../../i18n/i18n-react-custom'
import { useAppToast } from '../../providers/ToastProvider'
import { truncateString } from '../../utils/truncateString'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { HistoryItem } from '../../db/history'

const TextareaClassNames = {
  input: 'font-mono text-xs leading-relaxed opacity-70',
  label: 'font-bold text-default-700 mb-2',
}

interface ExportHistoryModalProps {
  items: HistoryItem[]
  isDisabled?: boolean
}

export const ExportHistoryModal = memo(function ExportHistoryModal({ items, isDisabled }: ExportHistoryModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { LL } = useI18nContext()
  const toast = useAppToast()

  const exportData = useMemo(() => {
    return items.map(item => item.word).join('\n')
  }, [items])

  const handleCopy = useCallback(() => {
    const output_ = String_toNonEmptyString_orUndefined_afterTrim(exportData)

    if (output_) {
      navigator.clipboard.writeText(exportData)
      toast.success('Copied to clipboard' as NonEmptyStringTrimmed, truncateString(output_, 50))
    }
  }, [exportData, toast])

  return (
    <>
      <Button
        className="min-h-8 h-auto font-medium text-base"
        color="primary"
        isDisabled={isDisabled}
        size="sm"
        startContent={<HiArrowDownTray className="text-base" />}
        variant="light"
        onPress={onOpen}
      >
        {LL.ANKI.EXPORT.BUTTON()}
      </Button>

      <Modal isOpen={isOpen} scrollBehavior="inside" size="2xl" onOpenChange={onOpenChange}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className="flex flex-col gap-1">{LL.ANKI.EXPORT.TITLE()}</ModalHeader>
              <ModalBody>
                <Textarea
                  readOnly
                  classNames={TextareaClassNames}
                  label="History Words"
                  labelPlacement="outside"
                  maxRows={20}
                  minRows={10}
                  value={exportData}
                  variant="flat"
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  {LL.COMMON.CANCEL()}
                </Button>
                <Button
                  color="primary"
                  startContent={<HiClipboardDocumentList className="text-xl" />}
                  onPress={handleCopy}
                >
                  Copy to Clipboard
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
})

ExportHistoryModal.displayName = 'ExportHistoryModal'
