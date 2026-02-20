import { memo, useCallback } from 'react'
import { Button } from '@heroui/button'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { TooltipMobileFriendly } from '../../../TooltipMobileFriendly'
import { useNativeTts } from '../../../../hooks/useNativeTts'
import { NativeSpeakerIcon } from '../../../Icons/NativeSpeakerIcon'
import { useI18nContext } from '../../../../i18n/i18n-react-custom'
import type { BCP47LanguageTagName } from '../../../../utils/my-bcp-47'

interface NativeSpeechActionProps {
  word: NonEmptyStringTrimmed | undefined
  mode: BCP47LanguageTagName
}

export const NativeSpeechAction = memo(function NativeSpeechAction({ word, mode }: NativeSpeechActionProps) {
  const { LL } = useI18nContext()
  const state = useNativeTts()

  const handlePress = useCallback(async () => {
    if (word && !state.isSpeaking) {
      await state.speak(word, mode)
    }
  }, [state, word, mode])

  return (
    <TooltipMobileFriendly closeDelay={0} content={LL.SPEECH.NATIVE()}>
      <Button isIconOnly isDisabled={!word || state.isSpeaking} radius="full" variant="light" onPress={handlePress}>
        <NativeSpeakerIcon isSpeaking={state.isSpeaking} />
      </Button>
    </TooltipMobileFriendly>
  )
})

NativeSpeechAction.displayName = 'NativeSpeechAction'
