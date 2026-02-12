import { AnkiGame } from './components/Anki/AnkiGame'
import { AnkiPulseProvider } from './components/Anki/AnkiPulseContext'
import { AnkiSettingsProvider } from './components/Anki/useAnkiSettings'

export function AppAnki() {
  return (
    <AnkiPulseProvider>
      <AnkiSettingsProvider>
        <AnkiGame />
      </AnkiSettingsProvider>
    </AnkiPulseProvider>
  )
}
