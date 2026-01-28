import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Button } from '@heroui/button'
import { KhmerCharInfo } from './KhmerCharInfo'
import { getDefinitionFromL1, getDefinitionFromL2, type KhmerCharDefinition } from '../utils/khmer-lookup'
import type { ProcessDataOutputKhmerCursor_OnlyFirstLevel } from '../utils/toGroupKhmer_cursor_onlyFirstLevel'
import type { ProcessDataOutputKhmerCursor_FirstAndSecondLevel } from '../utils/toGroupKhmer_cursor_full'

interface KhmerInfoModalProps {
  isOpen: boolean
  onClose: () => void
  cursor: ProcessDataOutputKhmerCursor_OnlyFirstLevel | ProcessDataOutputKhmerCursor_FirstAndSecondLevel | null
}

export const KhmerInfoModal: React.FC<KhmerInfoModalProps> = ({ isOpen, onClose, cursor }) => {
  if (!cursor) return null

  let definition: KhmerCharDefinition
  let label: string

  // Distinguish between L1 and L2 cursors to get correct definition
  if ('secondChar' in cursor) {
    // It's FirstAndSecondLevel
    definition = getDefinitionFromL2(cursor)
    // Extract label from the lowest level
    const sub = cursor.secondChar

    label = sub.t === 'noSecondChar' ? '∅' : sub.v
  } else {
    // It's OnlyFirstLevel
    definition = getDefinitionFromL1(cursor)
    if ('firstChar' in cursor) {
      label = cursor.firstChar
    } else {
      // Handle special groups (numbers, punctuation etc which are just discriminated unions)
      label = cursor.t.toUpperCase()
    }
  }

  return (
    <Modal backdrop="blur" isOpen={isOpen} size="sm" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 items-center pt-6">
          <span className="text-6xl font-khmer text-primary mb-2">{label}</span>
          <span className="text-xs text-default-400 uppercase tracking-widest">Character Info</span>
        </ModalHeader>
        <ModalBody>
          <KhmerCharInfo data={definition} />
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
