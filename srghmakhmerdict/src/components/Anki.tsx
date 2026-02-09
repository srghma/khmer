import { Modal, ModalContent } from '@heroui/modal'
import { AnkiModalContent, type ReviewDirection } from './Anki/AnkiModalContent'
import type { DictionaryLanguage } from '../types'
import type { KhmerWordsMap } from '../db/dict'
import type { AnkiFlowMode } from './Anki/types'

// --- Main Modal Component ---

const modalClassNames = {
  body: 'p-0',
  base: 'max-w-[95vw] h-[90vh] max-h-[900px]',
}

interface KhmerAnkiModalProps {
  isOpen: boolean
  onClose: () => void
  km_map: KhmerWordsMap
  reviewDirection: ReviewDirection
}

export const KhmerAnkiModal = ({ isOpen, onClose, km_map, reviewDirection }: KhmerAnkiModalProps) => {
  // Map the ReviewDirection to the internal state configuration
  let initialLanguage: DictionaryLanguage = 'km'
  let initialMode: AnkiFlowMode = 'WORD_TO_DESC'

  switch (reviewDirection) {
    case 'EN_TO_KM':
      initialLanguage = 'en'
      initialMode = 'WORD_TO_DESC'
      break
    case 'RU_TO_KM':
      initialLanguage = 'ru'
      initialMode = 'WORD_TO_DESC'
      break
    case 'KM_TO_ALL':
    default:
      initialLanguage = 'km'
      initialMode = 'WORD_TO_DESC'
      break
  }

  return (
    <Modal backdrop="blur" classNames={modalClassNames} isOpen={isOpen} scrollBehavior="inside" onClose={onClose}>
      <ModalContent>
        <AnkiModalContent initialLanguage={initialLanguage} initialMode={initialMode} km_map={km_map} />
      </ModalContent>
    </Modal>
  )
}
