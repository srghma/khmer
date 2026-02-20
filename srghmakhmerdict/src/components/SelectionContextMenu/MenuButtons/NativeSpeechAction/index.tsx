import { memo, useMemo, useCallback } from 'react'
import { useNativeTts } from '../../../../hooks/useNativeTts'
import { MenuButton } from '../../MenuButton'
import { NativeSpeakerIcon } from '../../../Icons/NativeSpeakerIcon'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { BCP47LanguageTagName } from '../../../../utils/my-bcp-47'

export const NativeSpeechAction = memo(function NativeSpeechAction({
  word,
  mode,
}: {
  word: NonEmptyStringTrimmed | undefined
  mode: BCP47LanguageTagName
}) {
  const state = useNativeTts()

  const handlePress = useCallback(async () => {
    if (word && !state.isSpeaking) {
      await state.speak(word, mode)
    }
  }, [state, word, mode])

  const icon = useMemo(
    () => <NativeSpeakerIcon className="h-5 w-5" isSpeaking={state.isSpeaking} />,
    [state.isSpeaking],
  )

  return (
    <MenuButton icon={icon} isDisabled={!word || state.isSpeaking} onClick={handlePress}>
      Speak Native
    </MenuButton>
  )
})

NativeSpeechAction.displayName = 'NativeSpeechAction'
