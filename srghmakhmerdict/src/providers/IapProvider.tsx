import React, { createContext, useContext, useCallback, useState, useEffect, memo } from 'react'
import type { Product } from '@choochmeque/tauri-plugin-iap-api'
import { useAppToast } from './ToastProvider'

// Define the donation tiers
export const DONATION_PRODUCT_IDS = [
  'donation_small', // e.g., $1
  'donation_medium', // e.g., $5
  'donation_large', // e.g., $10
] as const

export type DonationProductId = (typeof DONATION_PRODUCT_IDS)[number]

interface IapContextType {
  products: Product[]
  isLoading: boolean
  isPurchasing: boolean
  handlePurchase: (productId: DonationProductId) => Promise<boolean>
}

const IapContext = createContext<IapContextType | undefined>(undefined)

export function useIap() {
  const context = useContext(IapContext)

  if (!context) {
    throw new Error('useIap must be used within an IapProvider')
  }

  return context
}

export const IapProvider = memo(function IapProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const toast = useAppToast()

  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

  // 1. Initialize logic
  useEffect(() => {
    if (!isTauri) {
      setIsLoading(false)

      return
    }

    let listener: { unregister: () => Promise<void> } | undefined

    const init = async () => {
      try {
        const { getProducts, onPurchaseUpdated } = await import('@choochmeque/tauri-plugin-iap-api')

        // Fetch product details
        const fetchedProducts = await getProducts([...DONATION_PRODUCT_IDS], 'inapp')

        // GetProductsResponse likely contains products array
        setProducts(fetchedProducts.products)

        // 2. Setup listener for purchase updates
        onPurchaseUpdated(p => {
          // eslint-disable-next-line no-console
          console.log('[IAP] Purchase updated:', p)
        }).then(l => {
          listener = l
        })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[IAP] Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    return () => {
      if (listener) {
        listener.unregister()
      }
    }
  }, [isTauri])

  // 3. Purchase handler
  const handlePurchase = useCallback(
    async (productId: DonationProductId): Promise<boolean> => {
      if (!isTauri) {
        toast.warn('Not Supported' as any, 'In-app purchases are only available in the desktop application.' as any)

        return false
      }

      setIsPurchasing(true)
      try {
        const { purchase } = await import('@choochmeque/tauri-plugin-iap-api')
        const { requestReview } = await import('@gbyte/tauri-plugin-in-app-review')

        const result = await purchase(productId, 'inapp')

        // eslint-disable-next-line no-console
        console.log('[IAP] Purchase successful:', result)

        toast.success('Thank you!' as any, 'Your donation has been received. You are awesome!' as any)

        // Trigger review after successful donation
        setTimeout(() => {
          requestReview()
        }, 1000)

        return true
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[IAP] Purchase failed:', error)

        toast.warn('Purchase Canceled' as any, 'The donation process was not completed.' as any)

        return false
      } finally {
        setIsPurchasing(false)
      }
    },
    [isTauri, toast],
  )

  return (
    <IapContext.Provider
      value={{
        products,
        isLoading,
        isPurchasing,
        handlePurchase,
      }}
    >
      {children}
    </IapContext.Provider>
  )
})

IapProvider.displayName = 'IapProvider'
