import { memo, useMemo, useCallback } from 'react'
import { GoogleSpeakerIcon } from '../../../Icons/GoogleSpeakerIcon'
import { useGoogleTts } from '../../../../hooks/useGoogleTts'
import { MenuButton } from '../../MenuButton'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { ToTranslateLanguage } from '../../../../utils/googleTranslate/toTranslateLanguage'

export const GoogleSpeechAction = memo(function GoogleSpeechAction({
  word,
  mode,
}: {
  word: NonEmptyStringTrimmed | undefined
  mode: ToTranslateLanguage
}) {
  const state = useGoogleTts()
  const isOffline = state.t === 'offline'
  const isSpeaking = state.t === 'online_and_speaking'

  const handlePress = useCallback(async () => {
    if (word && state.t === 'online') {
      await state.speak(word, mode)
    }
  }, [state, word, mode])

  const icon = useMemo(() => <GoogleSpeakerIcon {...state} className="w-5 h-5" />, [state])

  return (
    <MenuButton icon={icon} isDisabled={!word || isOffline || isSpeaking} onClick={handlePress}>
      Speak Google
    </MenuButton>
  )
})

GoogleSpeechAction.displayName = 'GoogleSpeechAction'
