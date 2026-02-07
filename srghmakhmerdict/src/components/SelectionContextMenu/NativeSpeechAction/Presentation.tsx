import { memo } from 'react'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'
import { type NativeTtsState } from '../../../hooks/useNativeTts'
import { MenuButton } from '../MenuButton'

const icon = <HiOutlineSpeakerWave className="text-xl" />

export const NativeSpeechActionPresentation = memo((state: NativeTtsState & { isDisabled: boolean }) => {
  const handlePress = !state.isSpeaking ? state.speak : undefined

  return (
    <MenuButton icon={icon} isDisabled={state.isDisabled} isLoading={state.isSpeaking} onClick={handlePress}>
      Speak Native
    </MenuButton>
  )
})

NativeSpeechActionPresentation.displayName = 'NativeSpeechActionPresentation'
