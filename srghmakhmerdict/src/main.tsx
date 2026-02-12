import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider } from '@heroui/system'
import { GlobalToastProvider } from './providers/ToastProvider'
import { NavigationProvider } from './providers/NavigationProvider'
import { SettingsProvider } from './providers/SettingsProvider'

import App from './App'
import { initializeDictionaryData } from './initDictionary'
import { DictionaryProvider } from './providers/DictionaryProvider'
import { GlobalErrorBoundary } from './components/ErrorBoundary'
import { FavoritesProvider } from './providers/FavoritesProvider'
import { HistoryProvider } from './providers/HistoryProvider'

// Start the 2-stage initialization immediately
const initPromise = initializeDictionaryData()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HeroUIProvider>
      <GlobalToastProvider />
      {/* Pass the promise that resolves when DB is ready */}
      <GlobalErrorBoundary>
        <DictionaryProvider initPromise={initPromise}>
          <FavoritesProvider>
            <HistoryProvider>
              <NavigationProvider>
                <SettingsProvider>
                  <App />
                </SettingsProvider>
              </NavigationProvider>
            </HistoryProvider>
          </FavoritesProvider>
        </DictionaryProvider>
      </GlobalErrorBoundary>
    </HeroUIProvider>
  </React.StrictMode>,
)
