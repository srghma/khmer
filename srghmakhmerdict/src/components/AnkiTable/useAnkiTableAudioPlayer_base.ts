import { useState, useMemo, useEffect } from 'react'
import { useAppToast } from '../../providers/ToastProvider'
import { type AudioTrack, type AnkiTableAudioPlayer, type AnkiTableState } from './types'
import { AudioQueue } from './AudioQueue'

const audioQueueInstance = new AudioQueue()

export function useAnkiTableAudioPlayerBase(
  state: AnkiTableState,
  playGoogleTts: (text: string) => Promise<void>,
  playNativeTts: (text: string) => Promise<void>,
): AnkiTableAudioPlayer {
  const [playerState, setPlayerState] = useState({
    queue: [] as AudioTrack[],
    currentIndex: -1,
    isPlaying: false,
    isRepeatQueue: true,
  })

  useEffect(() => {
    audioQueueInstance.setStateListener(setPlayerState)

    return () => {
      audioQueueInstance.setStateListener(() => {})
    }
  }, [])

  const toast = useAppToast()

  useEffect(() => {
    if (playerState.isPlaying) {
      audioQueueInstance.runLoop(state, toast, playGoogleTts, playNativeTts)
    }
  }, [playerState.isPlaying, playerState.currentIndex, state, toast, playGoogleTts, playNativeTts])

  const currentTrack = useMemo(() => {
    const { queue, currentIndex } = playerState

    return (currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null) ?? null
  }, [playerState])

  return useMemo(
    () => ({
      queue: playerState.queue,
      currentIndex: playerState.currentIndex,
      setCurrentIndex: (i: number) => audioQueueInstance.setCurrentIndex(i),
      playTrackAtIndex: (i: number) => {
        audioQueueInstance.setCurrentIndex(i)
        audioQueueInstance.play()
      },
      isPlaying: playerState.isPlaying,
      isRepeatQueue: playerState.isRepeatQueue,
      setIsRepeatQueue: (r: boolean) => audioQueueInstance.setIsRepeatQueue(r),
      currentTrack,
      addToQueue: (t: AudioTrack) => audioQueueInstance.addToQueue(t),
      removeFromQueue: (t: AudioTrack) => audioQueueInstance.removeFromQueue(t),
      isInQueue: (t: AudioTrack) => playerState.queue.some(q => q.url === t.url && q.text === t.text),
      play: () => audioQueueInstance.play(),
      pause: () => audioQueueInstance.pause(),
      stop: () => audioQueueInstance.stop(),
      next: () => audioQueueInstance.next(),
      prev: () => audioQueueInstance.prev(),
      clearQueue: () => audioQueueInstance.clearQueue(),
      playOnce: (url: string) => audioQueueInstance.playOnce(url),
      playText: (params: { text: string; audioUrl: string }) => {
        audioQueueInstance.clearQueue()
        audioQueueInstance.addToQueue({ url: params.audioUrl, text: params.text })
        audioQueueInstance.setIsRepeatQueue(false)
        audioQueueInstance.play()
      },
      playMultipleTexts: (items: { text: string; audioUrl: string }[]) => {
        audioQueueInstance.clearQueue()
        items.forEach(item => audioQueueInstance.addToQueue({ url: item.audioUrl, text: item.text }))
        audioQueueInstance.play()
      },
    }),
    [playerState, currentTrack, state],
  )
}
