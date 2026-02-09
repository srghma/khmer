import React from 'react'
import { clsx } from 'clsx'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'

interface NativeSpeakerIconProps {
  isSpeaking: boolean
  className?: string
}

export const NativeSpeakerIcon = React.memo(({ isSpeaking, className }: NativeSpeakerIconProps) => {
  return (
    <div
      className={clsx(
        'relative transition-all duration-300 flex items-center justify-center',
        isSpeaking ? 'text-primary scale-110' : 'text-current',
        className,
      )}
    >
      <HiOutlineSpeakerWave className="w-full h-full" />
    </div>
  )
})

NativeSpeakerIcon.displayName = 'NativeSpeakerIcon'
