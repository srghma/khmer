import { memo } from 'react'
import { Button } from '@heroui/button'
import { Tooltip } from '@heroui/tooltip'
import type { NativeTtsState } from '../../../../hooks/useNativeTts'
import { NativeSpeakerIcon } from '../../../Icons/NativeSpeakerIcon'

export const NativeSpeechActionPresentation = memo((state: NativeTtsState & { isDisabled: boolean }) => {
  const handlePress = !state.isSpeaking ? state.speak : undefined

  return (
    <Tooltip closeDelay={0} content="Native Speech">
      <Button isIconOnly isDisabled={state.isDisabled} radius="full" variant="light" onPress={handlePress}>
        <NativeSpeakerIcon className="h-5 w-5" isSpeaking={state.isSpeaking} />
      </Button>
    </Tooltip>
  )
})

NativeSpeechActionPresentation.displayName = 'NativeSpeechActionPresentation'
