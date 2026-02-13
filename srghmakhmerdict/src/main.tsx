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
import { KhmerAnalyzerProvider } from './providers/KhmerAnalyzerProvider'

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
                  <KhmerAnalyzerProvider>
                    <App />
                  </KhmerAnalyzerProvider>
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
