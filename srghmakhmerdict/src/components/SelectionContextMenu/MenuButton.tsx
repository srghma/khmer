import React from 'react'

// Adjust import path as needed
import clsx from 'clsx'
import { Spinner } from '@heroui/react'

const spinner = <Spinner color="current" size="sm" />

// --- REUSABLE BUTTON COMPONENT (Mimics ListboxItem, but ListboxItem doesnt react on mouse click) ---
export const MenuButton = React.memo(
  ({
    icon,
    children,
    onClick,
    isDisabled,
    isLoading,
    className = '',
  }: {
    icon: React.ReactNode
    children: React.ReactNode
    onClick: (() => void | Promise<void>) | undefined
    isDisabled?: boolean
    isLoading?: boolean
    className?: string
  }) => {
    return (
      <button
        className={clsx(
          `group w-full flex items-center gap-3 px-3 py-2
          rounded-medium transition-all duration-150
          outline-none select-none text-start`,
          isDisabled || isLoading
            ? 'opacity-50 cursor-not-allowed bg-transparent'
            : 'hover:bg-default-100 active:bg-default-200 cursor-pointer',
          className,
        )}
        disabled={isDisabled || isLoading}
        type="button"
        onClick={onClick}
      >
        <span className="text-default-500 text-lg flex-shrink-0 group-hover:text-default-900 transition-colors">
          {isLoading ? spinner : icon}
        </span>
        <div className="flex-1 text-small text-default-700 truncate font-medium">{children}</div>
      </button>
    )
  },
)

MenuButton.displayName = 'MenuButton'
