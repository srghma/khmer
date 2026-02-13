import React, { createContext, useContext, useCallback, useState, useEffect, memo } from 'react'
import { getProducts, purchase, onPurchaseUpdated, type Product } from '@choochmeque/tauri-plugin-iap-api'
import { requestReview } from '@gbyte/tauri-plugin-in-app-review'
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
  handlePurchase: (productId: DonationProductId) => Promise<void>
}

const IapContext = createContext<IapContextType | undefined>(undefined)

export function useIap() {
  const context = useContext(IapContext)

  if (!context) {
    throw new Error('useIap must be used within an IapProvider')
  }

  return context
}

export const IapProvider = memo(({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const toast = useAppToast()

  // 1. Initialize logic
  useEffect(() => {
    const init = async () => {
      try {
        // Fetch product details
        const fetchedProducts = await getProducts([...DONATION_PRODUCT_IDS], 'inapp')

        // GetProductsResponse likely contains products array
        setProducts((fetchedProducts as any).products ?? fetchedProducts)
      } catch (error) {
        console.error('[IAP] Failed to fetch products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    init()

    // 2. Setup listener for purchase updates
    let listener: { unregister: () => Promise<void> } | undefined

    onPurchaseUpdated(p => {
      console.log('[IAP] Purchase updated:', p)
    }).then(l => {
      listener = l
    })

    return () => {
      if (listener) {
        listener.unregister()
      }
    }
  }, [])

  // 3. Purchase handler
  const handlePurchase = useCallback(
    async (productId: DonationProductId) => {
      setIsPurchasing(true)
      try {
        const result = await purchase(productId, 'inapp')

        console.log('[IAP] Purchase successful:', result)

        toast.success('Thank you!' as any, 'Your donation has been received. You are awesome!' as any)

        // Trigger review after successful donation
        setTimeout(() => {
          requestReview()
        }, 1000)
      } catch (error) {
        console.error('[IAP] Purchase failed:', error)
        toast.warn('Purchase Canceled' as any, 'The donation process was not completed.' as any)
      } finally {
        setIsPurchasing(false)
      }
    },
    [toast],
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
