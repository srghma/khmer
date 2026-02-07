import { memo } from 'react'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'
import { GoogleSpeakerIcon } from '../../GoogleSpeakerIcon'
import { type GoogleTtsState } from '../../../hooks/useGoogleTts'

export const GoogleSpeechActionPresentation = memo((state: GoogleTtsState & { isDisabled: boolean }) => {
  const isSpeaking = state.t === 'online_and_speaking'
  const isOffline = state.t === 'offline'
  const handlePress = state.t === 'online' ? state.speak : undefined

  return (
    <Tooltip closeDelay={0} content={isOffline ? 'Offline' : 'Google Speech'}>
      <Button
        isIconOnly
        isDisabled={isOffline || state.isDisabled}
        isLoading={isSpeaking}
        radius="full"
        variant="light"
        onPress={handlePress}
      >
        <GoogleSpeakerIcon {...state} className="h-6 w-6 text-[#4285F4]" />
      </Button>
    </Tooltip>
  )
})

GoogleSpeechActionPresentation.displayName = 'GoogleSpeechActionPresentation'
