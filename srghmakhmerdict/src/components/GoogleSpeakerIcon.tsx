import React from 'react'
import { SiGoogletranslate } from 'react-icons/si'
import { useOnline } from '../hooks/useOnline'
import { NativeSpeakerIcon } from './NativeSpeakerIcon'

export const GoogleSpeakerIcon = React.memo(({ className }: { className?: string }) => {
  const isOnline = useOnline()

  return (
    <div className={`relative ${className}`}>
      {/* Main Icon Group - Dimmed if offline */}
      <div className={`relative w-full h-full ${!isOnline ? 'opacity-30 grayscale' : ''}`}>
        <SiGoogletranslate className="absolute top-0 left-0 w-full h-full scale-50 origin-top-left" />
        <NativeSpeakerIcon className="absolute bottom-0 right-0 w-full h-full scale-65 origin-bottom-right" />
      </div>

      {/* Offline Overlay (∅ style) */}
      {!isOnline && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none text-danger">
          {/* Simple SVG for the 'empty set' / 'no' symbol */}
          <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" />
            <line x1="6" x2="18" y1="18" y2="6" />
          </svg>
        </div>
      )}
    </div>
  )
})

GoogleSpeakerIcon.displayName = 'GoogleSpeakerIcon'
