import { addToast, ToastProvider as HeroToastProvider } from '@heroui/toast'
import { useCallback } from 'react'

/**
 * 1. The Global Provider Component
 * Wraps the HeroUI provider with Android-specific positioning settings.
 */
export const GlobalToastProvider = () => {
  return <HeroToastProvider maxVisibleToasts={3} placement="bottom-center" toastOffset={80} />
}

/**
 * 2. The Custom Hook
 * Abstraction to enforce "Android Style" (solid variant, radius)
 * so you don't repeat props in every component.
 */
export const useToast = () => {
  const success = useCallback((title: string, description?: string) => {
    addToast({
      title,
      description,
      color: 'success',
      variant: 'solid', // Android style high visibility
      radius: 'lg', // Pill shape
    })
  }, [])

  const warn = useCallback((title: string, description?: string) => {
    addToast({
      title,
      description,
      color: 'warning',
      variant: 'solid', // Android style high visibility
      radius: 'lg', // Pill shape
    })
  }, [])

  const error = useCallback((title: string, description?: string) => {
    addToast({
      title,
      description,
      color: 'danger',
      variant: 'solid',
      radius: 'lg',
    })
  }, [])

  const info = useCallback((title: string, description?: string) => {
    addToast({
      title,
      description,
      color: 'primary',
      variant: 'solid',
      radius: 'lg',
    })
  }, [])

  return { success, error, info, warn }
}
