import { type AnkiTableState, type AnkiTableAudioPlayer } from './types'
import { useAnkiTableAudioPlayerTauri } from './useAnkiTableAudioPlayer_tauri'
import { useAnkiTableAudioPlayerWebapp } from './useAnkiTableAudioPlayer_webapp'

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

// Fallback native TTS for webapp if not provided as prop
const defaultWebappNativeTts = async (text: string) => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)

    u.lang = 'km-KH'

    return new Promise<void>(resolve => {
      u.onend = () => resolve()
      u.onerror = () => resolve()
      window.speechSynthesis.speak(u)
    })
  }
}

// Fallback google TTS for webapp if not provided as prop (uses proxy)
const defaultWebappGoogleTts = async (text: string) => {
  const params = new URLSearchParams({ tl: 'km', q: text })
  const url = `http://localhost:3001/google_tts?${params.toString()}`

  return new Promise<void>((resolve, reject) => {
    const audio = new Audio(url)

    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('Google TTS Failed'))
    audio.play().catch(reject)
  })
}

export function useAnkiTableAudioPlayer(
  state: AnkiTableState,
  playGoogleTts?: (text: string) => Promise<void>,
  playNativeTts?: (text: string) => Promise<void>,
): AnkiTableAudioPlayer {
  if (isTauri) {
    return useAnkiTableAudioPlayerTauri(state)
  } else {
    return useAnkiTableAudioPlayerWebapp(
      state,
      playGoogleTts || defaultWebappGoogleTts,
      playNativeTts || defaultWebappNativeTts,
    )
  }
}
