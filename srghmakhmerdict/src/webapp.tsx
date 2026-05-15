import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider } from '@heroui/system'
import { GlobalToastProvider } from './providers/ToastProvider'
import { SettingsProvider } from './providers/SettingsProvider'
import { GlobalErrorBoundary } from './components/ErrorBoundary'
import { AnkiTableView } from './components/AnkiTable/AnkiTableView'
import { initializeDictionaryData } from './initDictionary'
import { DictionaryProvider } from './providers/DictionaryProvider'
import { FavoritesProvider } from './providers/FavoritesProvider'
import { HistoryProvider } from './providers/HistoryProvider'
import { I18nAppProvider } from './providers/I18nAppProvider'
import { IapProvider } from './providers/IapProvider'
import { ShortDefinitionPopoverProvider } from './providers/ShortDefinitionPopoverProvider'
import { FillInTheBlankModalProvider } from './providers/FillInTheBlankModalProvider'
import { Router } from 'wouter'
import { useHashLocation } from 'wouter/use-hash-location'
import './App.css'

// Browser-compatible Google TTS using direct audio element via local proxy
async function playGoogleTts(text: string): Promise<void> {
  const params = new URLSearchParams({
    tl: 'km',
    q: text,
  })

  // Use the same proxy as the rest of the webapp
  const url = `http://localhost:3001/google_tts?${params.toString()}`

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url)

    audio.crossOrigin = 'anonymous'

    const onEnded = () => {
      cleanup()
      resolve()
    }

    const onError = (e: any) => {
      const mediaError = audio.error

      cleanup()

      // eslint-disable-next-line no-console
      console.error('[webapp.tsx] Google TTS onError', { event: e, mediaError, url })

      let msg = ''

      if (mediaError) {
        msg = `MediaError ${mediaError.code}: ${mediaError.message || 'unknown'}`
      } else if (e && e.message) {
        msg = e.message
      } else if (e && e.type === 'error') {
        msg = 'Audio element source failed to load (possibly 404 or CORS)'
      } else {
        msg = String(e) || 'Unknown error'
      }

      reject(new Error(`Google TTS Playback Error: ${msg}\nURL: ${url}`))
    }

    const cleanup = () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    audio.play().catch(err => {
      cleanup()
      if (err.name !== 'AbortError') {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

// Native TTS using local Rust backend (espeak-ng) serving audio data
async function playNativeTts(text: string): Promise<void> {
  const params = new URLSearchParams({
    q: text,
  })

  const url = `http://localhost:3001/native_tts?${params.toString()}`

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url)

    audio.crossOrigin = 'anonymous'

    const onEnded = () => {
      cleanup()
      resolve()
    }

    const onError = (e: any) => {
      const mediaError = audio.error

      cleanup()

      let msg = ''

      if (mediaError) {
        msg = `MediaError ${mediaError.code}: ${mediaError.message || 'unknown'}`
      } else if (e && e.message) {
        msg = e.message
      } else if (e && e.type === 'error') {
        msg = 'Audio element source failed to load (possibly 404 or espeak-ng not installed)'
      } else {
        msg = String(e) || 'Unknown error'
      }

      reject(new Error(`Native TTS Playback Error: ${msg}\nURL: ${url}`))
    }

    const cleanup = () => {
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    audio.play().catch(err => {
      cleanup()
      if (err.name !== 'AbortError') {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

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
                      <ShortDefinitionPopoverProvider>
                        <FillInTheBlankModalProvider>
                          <div className="h-screen w-screen dark bg-background text-foreground">
                            <AnkiTableView playGoogleTts={playGoogleTts} playNativeTts={playNativeTts} />
                          </div>
                        </FillInTheBlankModalProvider>
                      </ShortDefinitionPopoverProvider>
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
