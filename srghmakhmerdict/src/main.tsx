import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider } from '@heroui/system'
import { GlobalToastProvider } from './providers/ToastProvider'
import { SettingsProvider } from './providers/SettingsProvider'

import App from './App'
import { initializeDictionaryData } from './initDictionary'
import { DictionaryProvider } from './providers/DictionaryProvider'
import { GlobalErrorBoundary } from './components/ErrorBoundary'
import { FavoritesProvider } from './providers/FavoritesProvider'
import { HistoryProvider } from './providers/HistoryProvider'
import { I18nAppProvider } from './providers/I18nAppProvider'
import { IapProvider } from './providers/IapProvider'
import { useHashLocation } from 'wouter/use-hash-location'

import { Router } from 'wouter'

const initPromise = initializeDictionaryData()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router hook={useHashLocation}>
      <HeroUIProvider>
        <GlobalErrorBoundary>
          <DictionaryProvider initPromise={initPromise}>
            <FavoritesProvider>
              <HistoryProvider>
                <SettingsProvider>
                  <IapProvider>
                    <I18nAppProvider>
                      <App />
                    </I18nAppProvider>
                  </IapProvider>
                </SettingsProvider>
              </HistoryProvider>
            </FavoritesProvider>
          </DictionaryProvider>
        </GlobalErrorBoundary>
        <GlobalToastProvider />
      </HeroUIProvider>
    </Router>
  </React.StrictMode>,
)
