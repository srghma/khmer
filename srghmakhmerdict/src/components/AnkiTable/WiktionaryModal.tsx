import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'
import { HiExternalLink as ExternalLink } from 'react-icons/hi'

interface Props {
  content: string | null
  onClose: () => void
}

export const WiktionaryModal: React.FC<Props> = React.memo(({ content, onClose }) => {
  return (
    <Modal backdrop="blur" isOpen={!!content} scrollBehavior="inside" size="4xl" onClose={onClose}>
      <ModalContent className="max-h-[90vh]">
        <ModalHeader className="flex items-center gap-2 border-b bg-default-50/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ExternalLink size={18} />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Wiktionary Details</h3>
        </ModalHeader>
        <ModalBody className="py-8">
          <div
            dangerouslySetInnerHTML={{ __html: content || '' }}
            className="prose prose-slate dark:prose-invert wiktionary-container max-w-none"
          />
        </ModalBody>
        <ModalFooter className="border-t bg-default-50/50">
          <Button variant="flat" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})

WiktionaryModal.displayName = 'WiktionaryModal'
