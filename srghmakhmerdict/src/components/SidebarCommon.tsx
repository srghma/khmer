import React, { memo, useRef, useMemo, useEffect, useCallback } from 'react'

export const sidebarClass =
  'w-8 flex flex-col items-center py-2 overflow-y-auto overflow-x-hidden no-scrollbar bg-content2 border-divider select-none shrink-0 z-10'

interface NavButtonProps {
  label: string | React.ReactNode
  active: boolean
  onClick: () => void
  onLongPress?: () => void
  className?: string
}

export const NavButton = memo<NavButtonProps>(({ label, active, onClick, onLongPress, className }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  // 1. Latest Ref Pattern (Fixed)
  // We initialize with current props, but strictly update them inside useEffect
  const callbacksRef = useRef({ onClick, onLongPress })

  // Sync ref with props. This happens after render, so it is safe.
  useEffect(() => {
    callbacksRef.current.onClick = onClick
    callbacksRef.current.onLongPress = onLongPress
  }, [onClick, onLongPress])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const computedClass = useMemo(
    () =>
      `cursor-pointer py-0.5 w-full text-center text-[10px] font-medium transition-all hover:brightness-110 ${
        active ? 'font-bold scale-125' : ''
      } ${className || 'text-default-400'} ${active && !className ? 'text-primary' : ''}`,
    [active, className],
  )

  // 2. Stable Handlers
  // Use useCallback with [] because we read from mutable refs
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only left click (0)
    if (e.button !== 0) return

    isLongPressRef.current = false
    startPosRef.current = { x: e.clientX, y: e.clientY }

    const longPressFn = callbacksRef.current.onLongPress

    if (longPressFn) {
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        longPressFn()
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
      }, 500)
    }
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (!isLongPressRef.current) {
      callbacksRef.current.onClick()
    } else {
      e.preventDefault()
    }

    startPosRef.current = null
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (startPosRef.current) {
      const dist = Math.abs(e.clientY - startPosRef.current.y) + Math.abs(e.clientX - startPosRef.current.x)

      if (dist > 10) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        startPosRef.current = null
      }
    }
  }, [])

  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (callbacksRef.current.onLongPress) e.preventDefault()
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      callbacksRef.current.onClick()
    }
  }, [])

  return (
    <button
      className={computedClass}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      onPointerCancel={handleCancel}
      onPointerDown={handlePointerDown}
      onPointerLeave={handleCancel}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {label}
    </button>
  )
})

NavButton.displayName = 'NavButton'

export const SidebarHeader = memo(({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-[8px] font-bold text-default-300 uppercase tracking-widest text-center">{children}</div>
))
SidebarHeader.displayName = 'SidebarHeader'
