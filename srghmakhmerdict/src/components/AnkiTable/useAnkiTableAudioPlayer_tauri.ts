import { useMemo } from 'react'
import { type AnkiTableState, type AnkiTableAudioPlayer } from './types'
import { executeGoogleTts, googleTtsResultToError } from '../../utils/tts/google'
import { executeNativeTts, nativeTtsResultToError } from '../../utils/tts/native'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAppToast } from '../../providers/ToastProvider'
import { useAnkiTableAudioPlayerBase } from './useAnkiTableAudioPlayer_base'

export function useAnkiTableAudioPlayerTauri(state: AnkiTableState): AnkiTableAudioPlayer {
  const toast = useAppToast()

  const playGoogleTts = useMemo(
    () => async (text: string) => {
      const result = await executeGoogleTts(text as NonEmptyStringTrimmed, 'km')

      if (result.t !== 'success') {
        const err = googleTtsResultToError(result)

        if (err) toast.error(err.title, err.description)
      }
    },
    [toast],
  )

  const playNativeTts = useMemo(
    () => async (text: string) => {
      const result = await executeNativeTts(text as NonEmptyStringTrimmed, 'km-KH')
      const err = nativeTtsResultToError(result)

      if (err) toast.error(err.title, err.description)
    },
    [toast],
  )

  return useAnkiTableAudioPlayerBase(state, playGoogleTts, playNativeTts)
}
