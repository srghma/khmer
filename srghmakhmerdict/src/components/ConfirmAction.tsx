import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@heroui/react'
import { type ReactNode } from 'react'

interface Props {
  // trigger is now a function that returns a ReactNode
  trigger: (onOpen: () => void) => ReactNode
  title: string
  children: ReactNode
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
}

export function ConfirmAction({ trigger, title, children, confirmLabel = 'Confirm', onConfirm }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()

  const handleAction = async () => {
    await onConfirm()
    onClose()
  }

  return (
    <>
      {/* Call the function and pass the opener */}
      {trigger(onOpen)}

      <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader>{title}</ModalHeader>
              <ModalBody>{children}</ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="danger" onPress={handleAction}>
                  {confirmLabel}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
