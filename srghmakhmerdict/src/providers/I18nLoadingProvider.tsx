import { createContext, useContext, useState, type ReactNode } from 'react'

interface I18nLoadingContextType {
  isLocaleLoading: boolean
  setIsLocaleLoading: (isLoading: boolean) => void
}

const I18nLoadingContext = createContext<I18nLoadingContextType | undefined>(undefined)

export const I18nLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLocaleLoading, setIsLocaleLoading] = useState(false)

  return (
    <I18nLoadingContext.Provider value={{ isLocaleLoading, setIsLocaleLoading }}>
      {children}
    </I18nLoadingContext.Provider>
  )
}

export const useI18nLoading = () => {
  const context = useContext(I18nLoadingContext)

  if (context === undefined) {
    throw new Error('useI18nLoading must be used within an I18nLoadingProvider')
  }

  return context
}
