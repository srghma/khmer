import React, { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal'
import { Button } from '@heroui/button'
import { Textarea } from '@heroui/input'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { useNotes } from '../providers/NotesProvider'

interface NoteModalProps {
  isOpen: boolean
  onClose: () => void
  word: NonEmptyStringTrimmed
  language: DictionaryLanguage
}

export const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, word, language }) => {
  const { getNote, saveNote, deleteNote } = useNotes()
  const [text, setText] = useState(() => getNote(word, language) || '')

  const handleSave = async () => {
    if (text.trim()) {
      await saveNote(word, language, text.trim())
    } else {
      await deleteNote(word, language)
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} placement="center" onClose={onClose}>
      <ModalContent>
        {onCloseModal => (
          <>
            <ModalHeader className="flex flex-col gap-1">Edit Note</ModalHeader>
            <ModalBody>
              <Textarea
                maxRows={10}
                minRows={3}
                placeholder="Write your note here..."
                value={text}
                onValueChange={setText}
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onCloseModal}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSave}>
                Save
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
