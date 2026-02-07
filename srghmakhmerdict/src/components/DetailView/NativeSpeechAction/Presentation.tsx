import { memo } from 'react'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'
import type { NativeTtsState } from '../../../hooks/useNativeTts'

export const NativeSpeechActionPresentation = memo((state: NativeTtsState & { isDisabled: boolean }) => {
  const handlePress = !state.isSpeaking ? state.speak : undefined
  const isLoading = state.isSpeaking

  return (
    <Tooltip closeDelay={0} content="Native Speech">
      <Button
        isIconOnly
        isDisabled={state.isDisabled}
        isLoading={isLoading}
        radius="full"
        variant="light"
        onPress={handlePress}
      >
        <HiOutlineSpeakerWave className="h-6 w-6 text-default-900" />
      </Button>
    </Tooltip>
  )
})

NativeSpeechActionPresentation.displayName = 'NativeSpeechActionPresentation'
