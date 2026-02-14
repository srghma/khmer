import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from '@heroui/react'
import React, { useCallback, type ReactNode } from 'react'
import { memo } from 'react'
import { useI18nContext } from '../i18n/i18n-react-custom'

interface ConfirmModalContentProps {
  title: string
  children: React.ReactNode
  confirmLabel: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

const ConfirmModalContent = memo(function ConfirmModalContent({
  title,
  children,
  confirmLabel,
  onClose,
  onConfirm,
}: ConfirmModalContentProps) {
  const { LL } = useI18nContext()

  return (
    <>
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          {LL.COMMON.CANCEL()}
        </Button>
        <Button color="danger" onPress={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </>
  )
})

interface Props {
  // trigger is now a function that returns a ReactNode
  trigger: (onOpen: () => void) => ReactNode
  title: string
  children: ReactNode
  confirmLabel?: string
  onConfirm: () => void | Promise<void> // TODO: correct? add loading button? how to handle errors?
}

export function ConfirmAction({ trigger, title, children, confirmLabel = 'Confirm', onConfirm }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure()

  const handleAction = useCallback(async () => {
    await onConfirm()
    onClose()
  }, [onConfirm, onClose])

  return (
    <>
      {trigger(onOpen)}

      <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {onClose => (
            <ConfirmModalContent confirmLabel={confirmLabel} title={title} onClose={onClose} onConfirm={handleAction}>
              {children}
            </ConfirmModalContent>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
