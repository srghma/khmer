import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { Button } from '@heroui/button'
import { Input } from '@heroui/input'
import { ModalContent, ModalHeader, ModalBody } from '@heroui/react'
import { memo, useCallback } from 'react'
import { KhmerDiff } from '../../components/Anki/KhmerDiff'
import { useGoogleOrNativeTts, GoogleOrNativeTtsState_speakIfCan } from '../../hooks/useGoogleOrNativeTts'
import { useAppToast } from '../ToastProvider'

const inputClassNames = {
  input: 'text-center text-xl',
}

export const FillInTheBlankModalContent = memo(function FillInTheBlankModalContent({
  isRevealed,
  activeWord,
  userProvided,
  setIsRevealed,
  userAnswer,
  setUserAnswer,
  hideModal,
}: {
  isRevealed: boolean
  activeWord: NonEmptyStringTrimmed | null
  userProvided: NonEmptyStringTrimmed | undefined
  setIsRevealed: (value: boolean) => void
  userAnswer: string
  setUserAnswer: (value: string) => void
  hideModal: () => void
}) {
  const isInputEmpty = !userProvided

  const tts = useGoogleOrNativeTts()
  const toast = useAppToast()

  const speakActiveWord = useCallback(() => {
    if (activeWord) {
      GoogleOrNativeTtsState_speakIfCan(tts, activeWord, toast)
    }
  }, [activeWord, tts, toast])

  const handleReveal = useCallback(() => {
    if (!isInputEmpty && activeWord) {
      setIsRevealed(true)
      GoogleOrNativeTtsState_speakIfCan(tts, activeWord, toast)
    }
  }, [isInputEmpty, tts, toast, activeWord, setIsRevealed])

  const inputOnKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleReveal()
      }
    },
    [handleReveal],
  )

  const handleInputOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserAnswer(e.target.value)
    },
    [setUserAnswer],
  )

  const retryGame = useCallback(() => {
    setUserAnswer('')
    setIsRevealed(false)
  }, [setUserAnswer, setIsRevealed])

  return (
    <ModalContent>
      <ModalHeader className="flex flex-col gap-1 items-center pt-6">
        <span className="text-xl text-primary">Fill in the blank</span>
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
                onChange={handleInputOnChange}
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
                {activeWord && userProvided && <KhmerDiff inDictExpected={activeWord} userProvided={userProvided} />}
              </div>

              <div className="flex flex-col items-center gap-1 mt-4">
                <span className="text-tiny font-bold uppercase text-default-400 tracking-widest">Correct Spelling</span>
                <button className="text-3xl font-khmer text-success font-bold" onClick={speakActiveWord}>
                  {activeWord}
                </button>
              </div>

              <div className="flex flex-row items-center gap-1 mt-1">
                <Button color="primary" variant="flat" onPress={hideModal}>
                  Continue
                </Button>

                <Button color="danger" variant="flat" onPress={retryGame}>
                  Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
    </ModalContent>
  )
})
