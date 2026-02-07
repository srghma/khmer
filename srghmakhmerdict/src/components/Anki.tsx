import { Modal, ModalContent } from '@heroui/modal'

import { type KhmerWordsMap } from '../db/dict'
import type { TypedContainsKhmer } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/string-contains-khmer-char'
import type { NonEmptySet } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-set'
import { AnkiModalContent } from './Anki/AnkiModalContent'

// --- Main Modal Component ---

const modalClassNames = {
  body: 'p-0',
  base: 'max-w-[95vw] h-[90vh] max-h-[900px]',
}

export const KhmerAnkiModal = ({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean
  onClose: () => void
  items: NonEmptySet<TypedContainsKhmer>
  km_map: KhmerWordsMap
}) => {
  return (
    <Modal backdrop="blur" classNames={modalClassNames} isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        <AnkiModalContent items={items} />
      </ModalContent>
    </Modal>
  )
}
