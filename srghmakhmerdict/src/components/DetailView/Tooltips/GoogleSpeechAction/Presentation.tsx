import { memo } from 'react'
import { Button } from '@heroui/button'
import { TooltipMobileFriendly } from '../../../TooltipMobileFriendly'
import { GoogleSpeakerIcon } from '../../../Icons/GoogleSpeakerIcon'
import { type GoogleTtsState } from '../../../../hooks/useGoogleTts'
import { useI18nContext } from '../../../../i18n/i18n-react-custom'

export const GoogleSpeechActionPresentation = memo((state: GoogleTtsState & { isDisabled: boolean }) => {
  const { LL } = useI18nContext()
  const isOffline = state.t === 'offline'
  const isSpeaking = state.t === 'online_and_speaking'
  const handlePress = state.t === 'online' ? state.speak : undefined

  return (
    <TooltipMobileFriendly
      closeDelay={0}
      content={isOffline ? LL.SPEECH.OFFLINE() : LL.SPEECH.GOOGLE()}
      isDisabled={isSpeaking}
    >
      <Button
        isIconOnly
        isDisabled={isOffline || state.isDisabled || state.t === 'disabled'}
        radius="full"
        variant="light"
        onPress={handlePress}
      >
        <GoogleSpeakerIcon {...state} className="h-5 w-5" />
      </Button>
    </TooltipMobileFriendly>
  )
})

GoogleSpeechActionPresentation.displayName = 'GoogleSpeechActionPresentation'
