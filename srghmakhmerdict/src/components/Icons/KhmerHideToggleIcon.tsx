import React from 'react'
import { RiEyeFill, RiEyeOffFill } from 'react-icons/ri'

interface KhmerHideToggleIconProps {
  className?: string
  isEnabled: boolean // true = Words are hidden (Skeleton mode)
}

export const KhmerHideToggleIcon = React.memo(({ className, isEnabled }: KhmerHideToggleIconProps) => {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      {/* Base Layer: The Khmer Letter 'Ka' (ក) */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isEnabled ? 'opacity-20 blur-[0.5px]' : 'opacity-100'
        }`}
      >
        <span className="font-bold text-[1.1rem] select-none leading-none pb-[2px]">ក</span>
      </div>

      {/* Overlay Layer: The Visibility Status */}
      <div className="absolute -bottom-1 -right-1 bg-content1 rounded-full p-[1px] shadow-sm ring-1 ring-divider z-10">
        {isEnabled ? (
          <RiEyeOffFill className="w-3 h-3 text-default-500" />
        ) : (
          <RiEyeFill className="w-3 h-3 text-primary" />
        )}
      </div>

      {/* Skeleton Block Overlay (Simulates the hidden state) */}
      {isEnabled && (
        <div className="absolute top-[20%] left-[15%] w-[70%] h-[60%] bg-current opacity-25 rounded-[3px]" />
      )}
    </div>
  )
})

KhmerHideToggleIcon.displayName = 'KhmerHideToggleIcon'
