import type { ReactNode, FC, Context } from 'react'
import { useContext, useMemo, useState, useCallback, createContext } from 'react'
import { i18nObject } from 'typesafe-i18n'
import type { BaseTranslation } from 'typesafe-i18n'
import type { Formatters, Locales, TranslationFunctions as TF, Translations } from './i18n-types.js'
import { loadedFormatters, loadedLocales } from './i18n-util.js'

// --------------------------------------------------------------------------------------------------------------------
// types --------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------

export type I18nContextType<L extends string = string, TF_Internal = any> = {
  locale: L
  LL: TF_Internal
  setLocale: (locale: L) => void
  isLocaleLoading: boolean
}

export type TypesafeI18nProps<L extends string> = {
  locale: L
  isLocaleLoading?: boolean
  children: ReactNode
}

export type ReactInit<L extends string = string, TF_Internal = any> = {
  component: FC<TypesafeI18nProps<L>>
  context: Context<I18nContextType<L, TF_Internal>>
}

// --------------------------------------------------------------------------------------------------------------------
// implementation -----------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------

const getFallbackProxy = (): any =>
  new Proxy(
    Object.assign(() => '', {}),
    {
      get: (_target, key): any => (key === 'length' ? 0 : getFallbackProxy()),
    },
  )

export const initI18nReactCustom = <
  L extends string = string,
  T extends BaseTranslation = BaseTranslation,
  TF_Internal = any,
  F = any,
>(
  translations: Record<L, T>,
  formatters: Record<L, F> = {} as Record<L, F>,
): ReactInit<L, TF_Internal> => {
  const I18nContextInternal = createContext({} as I18nContextType<L, TF_Internal>)

  const TypesafeI18nComponent: FC<TypesafeI18nProps<L>> = props => {
    const { locale: propsLocale, isLocaleLoading: propsIsLocaleLoading, children } = props
    const [locale, _setLocale] = useState<L>(propsLocale)
    const [LL, setLL] = useState<TF_Internal>(() =>
      !propsLocale
        ? (getFallbackProxy() as unknown as TF_Internal)
        : (i18nObject(
            propsLocale,
            translations[propsLocale] as any,
            formatters[propsLocale] as any,
          ) as unknown as TF_Internal),
    )

    const setLocale = useCallback(
      (newLocale: L) => {
        _setLocale(newLocale)
        setLL(
          () =>
            i18nObject(
              newLocale,
              translations[newLocale] as any,
              formatters[newLocale] as any,
            ) as unknown as TF_Internal,
        )
      },
      [translations, formatters],
    )

    // Sync props to state if they change from outside
    const [prevPropsLocale, setPrevPropsLocale] = useState(propsLocale)

    if (propsLocale !== prevPropsLocale) {
      setPrevPropsLocale(propsLocale)
      setLocale(propsLocale)
    }

    const ctx = useMemo<I18nContextType<L, TF_Internal>>(
      () => ({
        setLocale,
        locale,
        LL,
        isLocaleLoading: propsIsLocaleLoading ?? false,
      }),
      [setLocale, locale, LL, propsIsLocaleLoading],
    )

    return <I18nContextInternal.Provider value={ctx}>{children}</I18nContextInternal.Provider>
  }

  return { component: TypesafeI18nComponent, context: I18nContextInternal }
}

const { component: TypesafeI18n, context: I18nContext } = initI18nReactCustom<Locales, Translations, TF, Formatters>(
  loadedLocales,
  loadedFormatters,
)

export const useI18nContext = (): I18nContextType<Locales, TF> => useContext(I18nContext)

export { I18nContext, TypesafeI18n }

export default TypesafeI18n
