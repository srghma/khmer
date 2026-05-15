import { type AnkiTableState, type AnkiTableAudioPlayer } from './types'
import { useAnkiTableAudioPlayerBase } from './useAnkiTableAudioPlayer_base'

export function useAnkiTableAudioPlayerWebapp(
  state: AnkiTableState,
  playGoogleTts: (text: string) => Promise<void>,
  playNativeTts: (text: string) => Promise<void>,
): AnkiTableAudioPlayer {
  return useAnkiTableAudioPlayerBase(state, playGoogleTts, playNativeTts)
}
