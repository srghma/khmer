import { memo, useMemo } from 'react'
import { GoogleSpeakerIcon } from '../../GoogleSpeakerIcon'
import { type GoogleTtsState } from '../../../hooks/useGoogleTts'
import { MenuButton } from '../MenuButton' // Assuming you extract MenuButton

export const GoogleSpeechActionPresentation = memo((state: GoogleTtsState & { isDisabled: boolean }) => {
  const isOffline = state.t === 'offline'
  const handlePress = state.t === 'online' ? state.speak : undefined

  const icon = useMemo(() => <GoogleSpeakerIcon {...state} className="w-5 h-5" />, [state])

  return (
    <MenuButton icon={icon} isDisabled={isOffline || state.isDisabled} onClick={handlePress}>
      Speak Google
    </MenuButton>
  )
})

GoogleSpeechActionPresentation.displayName = 'GoogleSpeechActionPresentation'
