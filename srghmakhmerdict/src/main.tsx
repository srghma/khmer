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
import { useHashLocation } from 'wouter/use-hash-location'

import { Router } from 'wouter'

// Start the 2-stage initialization immediately
const initPromise = initializeDictionaryData()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router hook={useHashLocation}>
      <HeroUIProvider>
        <GlobalToastProvider />
        {/* Pass the promise that resolves when DB is ready */}
        <GlobalErrorBoundary>
          <DictionaryProvider initPromise={initPromise}>
            <FavoritesProvider>
              <HistoryProvider>
                <SettingsProvider>
                  <App />
                </SettingsProvider>
              </HistoryProvider>
            </FavoritesProvider>
          </DictionaryProvider>
        </GlobalErrorBoundary>
      </HeroUIProvider>
    </Router>
  </React.StrictMode>,
)
