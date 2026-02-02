import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toast } from '@heroui/react';
import { NavigationProvider } from './providers/NavigationProvider'
import { SettingsProvider } from './providers/SettingsProvider'

import App from './App'
import { initializeDictionaryData } from './initDictionary'
import { DictionaryProvider } from './providers/DictionaryProvider'

// Start the 2-stage initialization immediately
const initPromise = initializeDictionaryData()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Toast.Container />
    {/* Pass the promise that resolves when DB is ready */}
    <DictionaryProvider initPromise={initPromise}>
      <NavigationProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </NavigationProvider>
    </DictionaryProvider>
  </React.StrictMode>,
)
