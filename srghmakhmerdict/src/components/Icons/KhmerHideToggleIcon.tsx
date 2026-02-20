import { memo } from 'react'
import { RiEyeFill, RiEyeOffFill } from 'react-icons/ri'
import { cn } from 'tailwind-variants'
import {
  details_header__sub_text_className,
  details_header__sup_text_className,
  details_header__text_className,
} from '../header_classNames'

interface KhmerHideToggleIconProps {
  className?: string
  isEnabled: boolean // true = Words are hidden (Skeleton mode)
}

export const KhmerHideToggleIcon = memo(function KhmerHideToggleIcon({
  className,
  isEnabled,
}: KhmerHideToggleIconProps) {
  const Icon = isEnabled ? RiEyeOffFill : RiEyeFill

  return (
    <div
      className={cn(
        'relative flex items-center justify-center select-none',
        // Sets the "Em-box" size context for the component
        details_header__text_className,
        className,
      )}
    >
      {/* Base Layer: The Character 'ក' */}
      <div
        className={cn(
          'relative z-0 transition-all duration-300 origin-center',
          isEnabled ? 'opacity-20 blur-[0.5px]' : 'opacity-100',
        )}
      >
        <span className={cn('font-bold leading-none', details_header__sup_text_className)}>ក</span>
      </div>

      {/* Skeleton Overlay Layer (Simulates hidden block) */}
      {isEnabled && (
        <div className="absolute z-0 inset-0 m-auto w-[65%] h-[65%] bg-current opacity-20 rounded-[3px] pointer-events-none" />
      )}

      {/* Badge Layer: Status Icon (Bottom Right) */}
      <div className="absolute -bottom-[50%] -right-[30%] z-10">
        <div className="bg-content1 rounded-full p-[1px] shadow-sm ring-1 ring-divider">
          <Icon className={cn(details_header__sub_text_className, isEnabled ? 'text-default-500' : 'text-primary')} />
        </div>
      </div>
    </div>
  )
})

KhmerHideToggleIcon.displayName = 'KhmerHideToggleIcon'
