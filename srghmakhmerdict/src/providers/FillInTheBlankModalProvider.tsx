import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { KhmerDiff } from '../components/Anki/KhmerDiff'
import {
  String_toNonEmptyString_orUndefined_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

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

const inputClassNames = {
  input: 'text-center text-xl',
}

export const FillInTheBlankModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeWord, setActiveWord] = useState<NonEmptyStringTrimmed | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isRevealed, setIsRevealed] = useState(false)

  // Validation: Check if the user has actually typed anything meaningful
  const userProvider = useMemo(() => String_toNonEmptyString_orUndefined_afterTrim(userAnswer), [userAnswer])
  const isInputEmpty = !userProvider

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

  const handleReveal = useCallback(() => {
    if (!isInputEmpty) {
      setIsRevealed(true)
    }
  }, [isInputEmpty])

  const inputOnKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleReveal()
      }
    },
    [handleReveal],
  )

  return (
    <FillInTheBlankModalContext.Provider value={contextValue}>
      {children}
      <Modal backdrop="blur" isOpen={activeWord !== null} size="lg" onClose={hideModal}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 items-center pt-6">
            <span className="text-xl font-khmer text-primary">Fill in the blank</span>
          </ModalHeader>
          <ModalBody className="pb-8">
            <div className="flex flex-col items-center justify-center">
              {!isRevealed ? (
                <div className="w-full flex flex-col items-center gap-6">
                  <Input
                    autoFocus
                    className="max-w-xs"
                    classNames={inputClassNames}
                    placeholder="Type the Khmer word..."
                    value={userAnswer}
                    variant="underlined"
                    onChange={e => setUserAnswer(e.target.value)}
                    onKeyDown={inputOnKeyDown}
                  />
                  <Button
                    color="primary"
                    isDisabled={isInputEmpty} // Prevent empty reveal
                    size="lg"
                    onPress={handleReveal}
                  >
                    Check Answer
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full items-center animate-in fade-in zoom-in duration-300">
                  <span className="text-tiny font-bold uppercase text-default-400 tracking-widest">Comparison</span>

                  {/* Anki-style Diff Box */}
                  <div className="border border-divider rounded-xl p-6 bg-content2/50 w-full shadow-inner">
                    {activeWord && userProvider && (
                      <KhmerDiff inDictExpected={activeWord} userProvider={userProvider} />
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-1 mt-4">
                    <span className="text-tiny font-bold uppercase text-default-400 tracking-widest">
                      Correct Spelling
                    </span>
                    <div className="text-3xl font-khmer text-success font-bold">{activeWord}</div>
                  </div>

                  <Button className="mt-6" color="primary" variant="flat" onPress={hideModal}>
                    Continue
                  </Button>
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </FillInTheBlankModalContext.Provider>
  )
}
