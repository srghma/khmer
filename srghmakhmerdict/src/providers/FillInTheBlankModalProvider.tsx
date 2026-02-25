import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { Modal } from '@heroui/modal'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { FillInTheBlankModalContent } from './FillInTheBlankModalProvider/FillInTheBlankModalContent'

interface FillInTheBlankModalContextType {
  showModal: (word: NonEmptyStringTrimmed) => void
  hideModal: () => void
}

const FillInTheBlankModalContext = createContext<FillInTheBlankModalContextType | undefined>(undefined)

export const useFillInTheBlankModal = () => {
  const context = useContext(FillInTheBlankModalContext)

  if (!context) {
    throw new Error('useFillInTheBlankModal must be used within a FillInTheBlankModalProvider')
  }

  return context
}

export const FillInTheBlankModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWord, setActiveWord] = useState<NonEmptyStringTrimmed | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isRevealed, setIsRevealed] = useState(false)

  // Validation: Check if the user has actually typed anything meaningful
  const userProvided = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(userAnswer), [userAnswer])

  const showModal = useCallback((word: NonEmptyStringTrimmed) => {
    setActiveWord(word)
    setUserAnswer('')
    setIsRevealed(false)
  }, [])

  const hideModal = useCallback(() => {
    setActiveWord(null)
    // Clean up when hiding so it's ready for next time
    setUserAnswer('')
    setIsRevealed(false)
  }, [])

  const contextValue = useMemo(() => ({ showModal, hideModal }), [showModal, hideModal])

  return (
    <FillInTheBlankModalContext.Provider value={contextValue}>
      {children}
      <Modal backdrop="blur" isOpen={activeWord !== null} size="lg" onClose={hideModal}>
        {activeWord && <FillInTheBlankModalContent
          activeWord={activeWord}
          hideModal={hideModal}
          isRevealed={isRevealed}
          setIsRevealed={setIsRevealed}
          setUserAnswer={setUserAnswer}
          userAnswer={userAnswer}
          userProvided={userProvided}
        />}
      </Modal>
    </FillInTheBlankModalContext.Provider>
  )
}
