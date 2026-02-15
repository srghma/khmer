import React, { useState } from 'react'
import { useLongPress } from '@react-aria/interactions'
import { mergeProps } from '@heroui/shared-utils'
import { Tooltip, type TooltipProps } from '@heroui/react'

export interface TooltipMobileFriendlyProps extends TooltipProps {
  children: React.ReactElement
}

const TOOLTIP_PROPS = [
  'content',
  'delay',
  'closeDelay',
  'placement',
  'color',
  'size',
  'radius',
  'shadow',
  'offset',
  'showArrow',
  'isDisabled',
  'container',
  'motionProps',
  'trigger',
  'triggerRef',
  'portalContainer',
]

/**
 * A wrapper for our custom Tooltip that enables controll over mobile behavior.
 * This replaces the previous implementation that caused crashes.
 */
export const TooltipMobileFriendly = React.memo(
  React.forwardRef<any, TooltipMobileFriendlyProps>((props, ref) => {
    const { children, isOpen: propIsOpen, onOpenChange, ...otherProps } = props
    const [isOpenInternal, setIsOpenInternal] = useState(false)

    // Ensure we always pass a boolean to avoid "controlled to uncontrolled" warnings
    const mergedIsOpen = !!(propIsOpen ?? isOpenInternal)

    const { longPressProps } = useLongPress({
      accessibilityDescription: (otherProps as any)['aria-label'] || 'Long press to show tooltip',
      onLongPress: () => {
        setIsOpenInternal(true)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50)
        }
        setTimeout(() => setIsOpenInternal(false), 3000)
      },
    })

    const passthroughProps = Object.fromEntries(
      Object.entries(otherProps).filter(([key]) => !TOOLTIP_PROPS.includes(key)),
    )

    return (
      <Tooltip
        {...otherProps}
        isOpen={mergedIsOpen}
        onOpenChange={open => {
          setIsOpenInternal(open)
          onOpenChange?.(open)
        }}
      >
        {React.cloneElement(children, {
          ...mergeProps(children.props, longPressProps, passthroughProps as any),
          ref,
        } as any)}
      </Tooltip>
    )
  }),
)

TooltipMobileFriendly.displayName = 'TooltipMobileFriendly'
