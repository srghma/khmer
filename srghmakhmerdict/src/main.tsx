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
import { NotesProvider } from './providers/NotesProvider'
import { I18nAppProvider } from './providers/I18nAppProvider'
import { IapProvider } from './providers/IapProvider'
import { ShortDefinitionPopoverProvider } from './providers/ShortDefinitionPopoverProvider'
import { FillInTheBlankModalProvider } from './providers/FillInTheBlankModalProvider'
import { DetailsModalProvider } from './providers/DetailsModalProvider'
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
                <NotesProvider>
                  <SettingsProvider>
                    <IapProvider>
                      <I18nAppProvider>
                        <FillInTheBlankModalProvider>
                          <DetailsModalProvider>
                            <ShortDefinitionPopoverProvider>
                              <App />
                            </ShortDefinitionPopoverProvider>
                          </DetailsModalProvider>
                        </FillInTheBlankModalProvider>
                      </I18nAppProvider>
                    </IapProvider>
                  </SettingsProvider>
                </NotesProvider>
              </HistoryProvider>
            </FavoritesProvider>
          </DictionaryProvider>
        </GlobalErrorBoundary>
        <GlobalToastProvider />
      </HeroUIProvider>
    </Router>
  </React.StrictMode>,
)
