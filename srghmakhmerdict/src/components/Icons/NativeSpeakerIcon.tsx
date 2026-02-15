import React from 'react'
import { clsx } from 'clsx'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'
import { details_header__text_className } from '../header_classNames'

interface NativeSpeakerIconProps {
  isSpeaking: boolean
  className?: string
}

export const NativeSpeakerIcon = React.memo(({ isSpeaking, className }: NativeSpeakerIconProps) => {
  return (
    <div
      className={clsx(
        'relative transition-all duration-300 flex items-center justify-center',
        details_header__text_className,
        isSpeaking ? 'text-primary scale-110' : 'text-current',
        className,
      )}
    >
      <HiOutlineSpeakerWave className={details_header__text_className} />
    </div>
  )
})

NativeSpeakerIcon.displayName = 'NativeSpeakerIcon'
