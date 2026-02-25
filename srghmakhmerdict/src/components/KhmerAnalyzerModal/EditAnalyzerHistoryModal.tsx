import { memo, useState, useCallback } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Textarea } from '@heroui/react'
import { HiCheck } from 'react-icons/hi2'
import type { AnalyzerHistoryItem } from '../../hooks/useAnalyzerHistory'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

interface EditAnalyzerHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  item: AnalyzerHistoryItem
  onUpdate: (savedAt: number, text: NonEmptyStringTrimmed) => void
}

export const EditAnalyzerHistoryModal = memo(function EditAnalyzerHistoryModal({
  isOpen,
  onClose,
  item,
  onUpdate,
}: EditAnalyzerHistoryModalProps) {
  return (
    <Modal isOpen={isOpen} size="xl" onOpenChange={onClose}>
      <ModalContent key={item.savedAt}>
        {onClose => <EditAnalyzerHistoryModalInner item={item} onClose={onClose} onUpdate={onUpdate} />}
      </ModalContent>
    </Modal>
  )
})

const EditAnalyzerHistoryModalInner = memo(function EditAnalyzerHistoryModalInner({
  item,
  onClose,
  onUpdate,
}: {
  item: AnalyzerHistoryItem
  onClose: () => void
  onUpdate: (savedAt: number, text: NonEmptyStringTrimmed) => void
}) {
  const [text, setText] = useState<string>(item.text)

  const handleSave = useCallback(() => {
    const trimmed = String_toNonEmptyString_orUndefined_afterTrim(text)

    if (trimmed) {
      onUpdate(item.savedAt, trimmed)
      onClose()
    }
  }, [item.savedAt, onClose, onUpdate, text])

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">Edit History Item</ModalHeader>
      <ModalBody>
        <Textarea
          className="font-khmer"
          label="Analyzer Text"
          labelPlacement="outside"
          maxRows={10}
          minRows={3}
          value={text}
          onValueChange={setText}
        />
      </ModalBody>
      <ModalFooter>
        <Button color="danger" variant="light" onPress={onClose}>
          Cancel
        </Button>
        <Button color="primary" startContent={<HiCheck className="text-xl" />} onPress={handleSave}>
          Save Changes
        </Button>
      </ModalFooter>
    </>
  )
})

EditAnalyzerHistoryModal.displayName = 'EditAnalyzerHistoryModal'
