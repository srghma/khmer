import React, { useState } from 'react'
import { useLongPress } from '@react-aria/interactions'
import { mergeProps } from '@heroui/shared-utils'
import { Tooltip, type TooltipProps } from '@heroui/react'

export interface TooltipMobileFriendlyProps extends TooltipProps {
  children: React.ReactElement
}

/**
 * A wrapper for our custom Tooltip that enables controll over mobile behavior.
 * This replaces the previous implementation that caused crashes.
 */
export const TooltipMobileFriendly = React.memo((props: TooltipMobileFriendlyProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const { longPressProps } = useLongPress({
    accessibilityDescription: 'Long press to show tooltip',
    onLongPress: () => {
      setIsOpen(true)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }
      setTimeout(() => setIsOpen(false), 3000)
    },
  })

  return (
    <Tooltip
      {...props}
      isOpen={isOpen || props.isOpen}
      onOpenChange={open => {
        if (!open) setIsOpen(false)
        props.onOpenChange?.(open)
      }}
    >
      {React.cloneElement(
        props.children,
        mergeProps(longPressProps, (props.children as React.ReactElement<any>).props),
      )}
    </Tooltip>
  )
})

TooltipMobileFriendly.displayName = 'TooltipMobileFriendly'
