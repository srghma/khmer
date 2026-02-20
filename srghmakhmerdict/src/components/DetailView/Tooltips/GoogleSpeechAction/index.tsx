import { memo, useCallback } from 'react'
import { Button } from '@heroui/button'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { TooltipMobileFriendly } from '../../../TooltipMobileFriendly'
import { GoogleSpeakerIcon } from '../../../Icons/GoogleSpeakerIcon'
import { useGoogleTts } from '../../../../hooks/useGoogleTts'
import { useI18nContext } from '../../../../i18n/i18n-react-custom'
import type { ToTranslateLanguage } from '../../../../utils/googleTranslate/toTranslateLanguage'

interface GoogleSpeechActionProps {
  word: NonEmptyStringTrimmed | undefined
  mode: ToTranslateLanguage
}

export const GoogleSpeechAction = memo(function GoogleSpeechAction({
  word,
  mode,
}: GoogleSpeechActionProps) {
  const { LL } = useI18nContext()
  const state = useGoogleTts()

  const isOffline = state.t === 'offline'
  const isSpeaking = state.t === 'online_and_speaking'

  const handlePress = useCallback(async () => {
    if (word && state.t === 'online') {
      await state.speak(word, mode)
    }
  }, [state, word, mode])

  return (
    <TooltipMobileFriendly
      closeDelay={0}
      content={isOffline ? LL.SPEECH.OFFLINE() : LL.SPEECH.GOOGLE()}
      isDisabled={isSpeaking}
    >
      <Button
        isIconOnly
        isDisabled={!word || isOffline || isSpeaking}
        radius="full"
        variant="light"
        onPress={handlePress}
      >
        <GoogleSpeakerIcon {...state} className="h-5 w-5" />
      </Button>
    </TooltipMobileFriendly>
  )
})

GoogleSpeechAction.displayName = 'GoogleSpeechAction'
