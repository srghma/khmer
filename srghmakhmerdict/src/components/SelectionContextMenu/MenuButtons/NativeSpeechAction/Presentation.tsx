import { memo, useMemo } from 'react'
import { type NativeTtsState } from '../../../../hooks/useNativeTts'
import { MenuButton } from '../../MenuButton'
import { NativeSpeakerIcon } from '../../../Icons/NativeSpeakerIcon'

export const NativeSpeechActionPresentation = memo((state: NativeTtsState & { isDisabled: boolean }) => {
  const handlePress = !state.isSpeaking ? state.speak : undefined

  const icon = useMemo(
    () => <NativeSpeakerIcon className="h-5 w-5" isSpeaking={state.isSpeaking} />,
    [state.isSpeaking],
  )

  return (
    <MenuButton icon={icon} isDisabled={state.isDisabled} onClick={handlePress}>
      Speak Native
    </MenuButton>
  )
})

NativeSpeechActionPresentation.displayName = 'NativeSpeechActionPresentation'
