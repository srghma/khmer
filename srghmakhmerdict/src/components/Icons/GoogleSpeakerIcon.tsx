import React from 'react'
import { SiGoogletranslate } from 'react-icons/si'
import { type GoogleTtsState } from '../../hooks/useGoogleTts'
import { clsx } from 'clsx'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'
import { details_header__text_className } from '../header_classNames'

const OfflineOverlay = (
  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none text-danger">
    <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <line x1="6" x2="18" y1="18" y2="6" />
    </svg>
  </div>
)

const CompositeIcon = (
  <>
    <SiGoogletranslate className="absolute -top-1 -left-1 w-full h-full scale-70 origin-top-left" />
    <HiOutlineSpeakerWave className="absolute -bottom-1 -right-1 w-full h-full scale-75 origin-bottom-right z-1" />
  </>
)

export const GoogleSpeakerIcon = React.memo(function GoogleSpeakerIcon(props: GoogleTtsState & { className?: string }) {
  const isOffline = props.t === 'offline'
  const isSpeaking = props.t === 'online_and_speaking'

  return (
    <div
      className={clsx(
        'relative transition-colors duration-200',
        details_header__text_className,
        isSpeaking ? 'text-primary' : 'text-current',
        props.className,
      )}
    >
      <div
        className={clsx(
          'relative w-full h-full transition-all duration-300',
          isOffline && 'opacity-30 grayscale',
          isSpeaking && 'scale-110',
        )}
      >
        {CompositeIcon}
      </div>

      {isOffline && OfflineOverlay}
    </div>
  )
})

GoogleSpeakerIcon.displayName = 'GoogleSpeakerIcon'
