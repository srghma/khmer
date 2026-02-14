import React from 'react'
import { SiGoogletranslate } from 'react-icons/si'
import { type GoogleTtsState } from '../../hooks/useGoogleTts'
import { clsx } from 'clsx'
import { HiOutlineSpeakerWave } from 'react-icons/hi2'

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
    <SiGoogletranslate className="absolute top-0 left-0 w-full h-full scale-50 origin-top-left" />
    <HiOutlineSpeakerWave className="absolute bottom-0 right-0 w-full h-full scale-65 origin-bottom-right" />
  </>
)

export const GoogleSpeakerIcon = React.memo((props: GoogleTtsState & { className?: string }) => {
  const isOffline = props.t === 'offline'
  const isDisabled = props.t === 'disabled'
  const isSpeaking = props.t === 'online_and_speaking'

  return (
    <div
      className={clsx(
        'relative w-6 h-6 transition-colors duration-200',
        isSpeaking ? 'text-primary' : 'text-current',
        props.className,
      )}
    >
      <div
        className={clsx(
          'relative w-full h-full transition-all duration-300',
          (isOffline || isDisabled) && 'opacity-30 grayscale',
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
