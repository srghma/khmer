import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { Modal, ModalContent, ModalBody } from '@heroui/modal'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type DictionaryLanguage } from '../types'
import { DetailView } from '../components/DetailView'

interface StackItem {
  word: NonEmptyStringTrimmed
  mode: DictionaryLanguage
}

interface DetailsModalContextType {
  openDetails: (word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => void
  closeDetails: () => void
  stack: StackItem[]
  popDetails: () => void
}

const DetailsModalContext = createContext<DetailsModalContextType | undefined>(undefined)

export const useDetailsModal = () => {
  const context = useContext(DetailsModalContext)

  if (!context) {
    throw new Error('useDetailsModal must be used within a DetailsModalProvider')
  }

  return context
}

export const DetailsModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<StackItem[]>([])

  const openDetails = useCallback((word: NonEmptyStringTrimmed, mode: DictionaryLanguage) => {
    setStack(prev => [...prev, { word, mode }])
  }, [])

  const closeDetails = useCallback(() => {
    setStack([])
  }, [])

  const popDetails = useCallback(() => {
    setStack(prev => prev.slice(0, -1))
  }, [])

  const contextValue = useMemo(
    () => ({
      openDetails,
      closeDetails,
      stack,
      popDetails,
    }),
    [openDetails, closeDetails, stack, popDetails],
  )

  return <DetailsModalContext.Provider value={contextValue}>{children}</DetailsModalContext.Provider>
}

export const DetailsModal: React.FC = () => {
  const { stack, closeDetails, popDetails, openDetails } = useDetailsModal()

  const activeItem = stack[stack.length - 1]
  const isOpen = stack.length > 0

  const backButton_goBack = stack.length > 1 ? popDetails : undefined

  if (!activeItem) return null

  return (
    <Modal backdrop="blur" isOpen={isOpen} size="2xl" onClose={closeDetails}>
      <ModalContent className="h-[80vh] max-h-[90dvh] p-0">
        <ModalBody className="p-0 flex flex-col overflow-hidden">
          <DetailView
            backButton_goBack={backButton_goBack}
            highlightMatch={undefined}
            isModal={true}
            mode={activeItem.mode}
            word={activeItem.word}
            onNavigate={openDetails}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
