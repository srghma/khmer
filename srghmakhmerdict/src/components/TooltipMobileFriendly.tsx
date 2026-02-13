import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Tooltip, type TooltipProps } from '@heroui/tooltip'

export interface TooltipMobileFriendlyProps extends TooltipProps {
  children: React.ReactElement
}

/**
 * A wrapper for HeroUI Tooltip that enables long-press support on mobile.
 * Uses pointer events to detect long-press and toggle the tooltip.
 */
export const TooltipMobileFriendly = React.memo((props: TooltipMobileFriendlyProps) => {
  const [isOpenManual, setIsOpenManual] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanupTimer
  }, [cleanupTimer])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only left click / touch
    if (e.button !== 0 && e.pointerType !== 'touch') return

    isLongPressRef.current = false
    startPosRef.current = { x: e.clientX, y: e.clientY }

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      setIsOpenManual(true)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50)
      }
      // Auto-hide after 3 seconds
      timerRef.current = setTimeout(() => {
        setIsOpenManual(false)
      }, 3000)
    }, 500)
  }, [])

  const handlePointerUp = useCallback(() => {
    cleanupTimer()
    startPosRef.current = null
    // We don't immediately close on pointer up if it was a long press
    // because the user wants to READ it.
  }, [cleanupTimer])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (startPosRef.current) {
        const dist = Math.abs(e.clientY - startPosRef.current.y) + Math.abs(e.clientX - startPosRef.current.x)

        if (dist > 10) {
          cleanupTimer()
          startPosRef.current = null
        }
      }
    },
    [cleanupTimer],
  )

  const handlePointerCancel = useCallback(() => {
    cleanupTimer()
    startPosRef.current = null
  }, [cleanupTimer])

  return (
    <Tooltip
      {...props}
      isOpen={isOpenManual || props.isOpen}
      onOpenChange={open => {
        if (!open) setIsOpenManual(false)
        props.onOpenChange?.(open)
      }}
    >
      {React.cloneElement(props.children, {
        onPointerDown: (e: React.PointerEvent) => {
          handlePointerDown(e)
          ;(props.children.props as any).onPointerDown?.(e)
        },
        onPointerUp: (e: React.PointerEvent) => {
          handlePointerUp()
          ;(props.children.props as any).onPointerUp?.(e)
        },
        onPointerMove: (e: React.PointerEvent) => {
          handlePointerMove(e)
          ;(props.children.props as any).onPointerMove?.(e)
        },
        onPointerCancel: (e: React.PointerEvent) => {
          handlePointerCancel()
          ;(props.children.props as any).onPointerCancel?.(e)
        },
        // Prevent context menu on long press on mobile which can interfere
        onContextMenu: (e: React.MouseEvent) => {
          if (isLongPressRef.current) e.preventDefault()
          ;(props.children.props as any).onContextMenu?.(e)
        },
      } as React.HTMLAttributes<HTMLElement>)}
    </Tooltip>
  )
})

TooltipMobileFriendly.displayName = 'TooltipMobileFriendly'
