import { memo } from 'react'
import { Button } from '@heroui/button'
import { TooltipMobileFriendly } from '../../../TooltipMobileFriendly'
import type { NativeTtsState } from '../../../../hooks/useNativeTts'
import { NativeSpeakerIcon } from '../../../Icons/NativeSpeakerIcon'
import { useI18nContext } from '../../../../i18n/i18n-react-custom'

export const NativeSpeechActionPresentation = memo((state: NativeTtsState & { isDisabled: boolean }) => {
  const { LL } = useI18nContext()
  const handlePress = !state.isSpeaking ? state.speak : undefined

  return (
    <TooltipMobileFriendly closeDelay={0} content={LL.SPEECH.NATIVE()}>
      <Button isIconOnly isDisabled={state.isDisabled} radius="full" variant="light" onPress={handlePress}>
        <NativeSpeakerIcon className="h-5 w-5" isSpeaking={state.isSpeaking} />
      </Button>
    </TooltipMobileFriendly>
  )
})

NativeSpeechActionPresentation.displayName = 'NativeSpeechActionPresentation'
