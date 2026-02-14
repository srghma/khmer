import { useEffect, useState, useMemo, type ReactNode } from 'react'
import { detectLocale } from '../i18n/i18n-util'
import { loadLocaleAsync } from '../i18n/i18n-util.async'
import type { Locales } from '../i18n/i18n-types'
import { Spinner } from '@heroui/react'
import TypesafeI18n from '../i18n/i18n-react-custom'
import { useSettings } from './SettingsProvider'
import { navigatorDetector } from 'typesafe-i18n/detectors'

export const I18nAppProvider = ({ children }: { children: ReactNode }) => {
  const { location } = useSettings()

  const targetLocale: Locales = useMemo(() => {
    if (location === 'auto') {
      return detectLocale(navigatorDetector)
    }

    return location
  }, [location])

  const [loadedLocale, setLoadedLocale] = useState<Locales | undefined>(undefined)

  useEffect(() => {
    let active = true

    loadLocaleAsync(targetLocale).then(() => {
      if (active) {
        setLoadedLocale(targetLocale)
      }
    })

    return () => {
      active = false
    }
  }, [targetLocale])

  if (!loadedLocale) {
    return (
      <div className="flex items-center justify-center h-screen w-screen">
        <Spinner />
      </div>
    )
  }

  const isLocaleLoading = loadedLocale !== targetLocale

  return (
    <TypesafeI18n isLocaleLoading={isLocaleLoading} locale={loadedLocale}>
      {children}
    </TypesafeI18n>
  )
}
