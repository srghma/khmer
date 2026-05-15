import { type AudioTrack, type AnkiTableState } from './types'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { useAppToast } from '../../providers/ToastProvider'

export class AudioQueue {
  private queue: AudioTrack[] = []
  private currentIndex: number = -1
  private isPlaying: boolean = false
  private isRepeatQueue: boolean = true
  private stateListener:
    | ((state: { queue: AudioTrack[]; currentIndex: number; isPlaying: boolean; isRepeatQueue: boolean }) => void)
    | null = null

  private mainAudio: HTMLAudioElement | null = null
  private oneOffAudio: HTMLAudioElement | null = null
  private isExecuting: boolean = false
  private stopRequested: boolean = false
  private playSourceResolve: (() => void) | null = null
  private playSourceReject: ((err: any) => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.mainAudio = new Audio()
      this.oneOffAudio = new Audio()
    }
  }

  private resolvePendingPlaySource() {
    if (this.playSourceResolve) {
      this.playSourceResolve()
      this.playSourceResolve = null
      this.playSourceReject = null
    }
  }

  public setStateListener(listener: (state: any) => void) {
    this.stateListener = listener
    this.notify()
  }

  private notify() {
    this.stateListener?.({
      queue: [...this.queue],
      currentIndex: this.currentIndex,
      isPlaying: this.isPlaying,
      isRepeatQueue: this.isRepeatQueue,
    })
  }

  public setQueue(queue: AudioTrack[]) {
    this.queue = queue
    this.currentIndex = queue.length > 0 ? 0 : -1
    this.notify()
  }

  public addToQueue(track: AudioTrack) {
    this.queue.push(track)
    if (this.currentIndex === -1) this.currentIndex = 0
    this.notify()
  }

  public removeFromQueue(track: AudioTrack) {
    const index = this.queue.findIndex(t => t.url === track.url && t.text === track.text)

    if (index === -1) return

    this.queue.splice(index, 1)

    if (this.currentIndex === index) {
      this.stop()
      if (this.queue.length > 0) {
        this.currentIndex = index % this.queue.length
      } else {
        this.currentIndex = -1
      }
    } else if (this.currentIndex > index) {
      this.currentIndex--
    }

    this.notify()
  }

  public clearQueue() {
    this.stop()
    this.queue = []
    this.currentIndex = -1
    this.notify()
  }

  public setIsRepeatQueue(repeat: boolean) {
    this.isRepeatQueue = repeat
    this.notify()
  }

  public setCurrentIndex(index: number) {
    if (index >= -1 && index < this.queue.length) {
      this.currentIndex = index
      this.notify()
    }
  }

  public play() {
    if (this.currentIndex === -1 && this.queue.length > 0) {
      this.currentIndex = 0
    }
    if (this.currentIndex !== -1) {
      this.isPlaying = true
      this.stopRequested = false
      this.notify()
    }
  }

  public pause() {
    this.isPlaying = false
    this.stopRequested = true
    if (this.mainAudio) this.mainAudio.pause()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    this.resolvePendingPlaySource()
    this.notify()
  }

  public stop() {
    this.isPlaying = false
    this.stopRequested = true
    if (this.mainAudio) {
      this.mainAudio.pause()
      this.mainAudio.currentTime = 0
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    this.resolvePendingPlaySource()
    this.notify()
  }

  public next() {
    if (this.queue.length === 0) return
    this.currentIndex = (this.currentIndex + 1) % this.queue.length
    this.notify()
  }

  public prev() {
    if (this.queue.length === 0) return
    this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length
    this.notify()
  }

  private async playSource(src: string): Promise<void> {
    if (!this.mainAudio || this.stopRequested) return

    return new Promise((resolve, reject) => {
      this.playSourceResolve = resolve
      this.playSourceReject = reject

      const cleanup = () => {
        this.mainAudio?.removeEventListener('ended', onEnded)
        this.mainAudio?.removeEventListener('error', onError)
        if (this.playSourceResolve === resolve || this.playSourceReject === reject) {
          this.playSourceResolve = null
          this.playSourceReject = null
        }
      }

      const onEnded = () => {
        cleanup()
        resolve()
      }

      const onError = (e: any) => {
        const mediaError = this.mainAudio?.error

        cleanup()

        // eslint-disable-next-line no-console
        console.error('[AudioQueue] Playback failed', { event: e, mediaError, src: this.mainAudio?.src })

        let msg = ''

        if (mediaError) {
          msg = `MediaError ${mediaError.code}: ${mediaError.message || 'unknown'}`
        } else if (e && e.message) {
          msg = e.message
        } else if (e && e.type === 'error') {
          msg = 'Audio element source failed to load (possibly 404 or CORS)'
        } else {
          msg = String(e) || 'Playback failed'
        }
        reject(new Error(msg))
      }

      this.mainAudio!.addEventListener('ended', onEnded)
      this.mainAudio!.addEventListener('error', onError)
      this.mainAudio!.src = src
      this.mainAudio!.play().catch(err => {
        cleanup()
        if (err.name !== 'AbortError') {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  public async runLoop(
    state: AnkiTableState,
    toast: ReturnType<typeof useAppToast>,
    playGoogleTts: (text: string) => Promise<void>,
    playNativeTts: (text: string) => Promise<void>,
  ) {
    if (this.isExecuting) return
    this.isExecuting = true

    while (this.isPlaying && this.currentIndex !== -1 && !this.stopRequested) {
      const track = this.queue[this.currentIndex]

      if (!track) break

      try {
        // 1. Opus
        if (state.audioModeOpus && !this.stopRequested) {
          const url = track.url.startsWith('http')
            ? track.url
            : window.location.origin + (track.url.startsWith('/') ? track.url : '/' + track.url)

          try {
            await this.playSource(url)
          } catch (e: any) {
            console.error('Opus failed', e)
          }
        }

        // 2. Google
        if (state.audioModeGoogle && !this.stopRequested) {
          try {
            await playGoogleTts(track.text)
          } catch (e: any) {
            console.error('[AnkiTableAudio] Google failed', e)
            toast.error(
              'Google failed' as NonEmptyStringTrimmed,
              (e.message || 'Unknown error') as NonEmptyStringTrimmed,
            )
          }
        }

        // 3. Native
        if (state.audioModeNative && !this.stopRequested) {
          try {
            await playNativeTts(track.text)
          } catch (e: any) {
            toast.error(
              'Native failed' as NonEmptyStringTrimmed,
              (e.message || 'Unknown error') as NonEmptyStringTrimmed,
            )
          }
        }
      } catch (e: any) {
        toast.error(
          'Track loop failed' as NonEmptyStringTrimmed,
          (e.message || 'Unknown error') as NonEmptyStringTrimmed,
        )
      }

      if (this.stopRequested) break

      // Advance
      if (this.currentIndex === this.queue.length - 1) {
        if (this.isRepeatQueue) {
          this.currentIndex = 0
          this.notify()
        } else {
          this.isPlaying = false
          this.notify()
          break
        }
      } else {
        this.currentIndex++
        this.notify()
      }
    }

    this.isExecuting = false
  }

  public async playOnce(url: string): Promise<void> {
    if (!this.oneOffAudio) return

    return new Promise(resolve => {
      const cleanup = () => {
        this.oneOffAudio?.removeEventListener('ended', handleEnded)
        this.oneOffAudio?.removeEventListener('error', handleError)
      }
      const handleEnded = () => {
        cleanup()
        resolve()
      }
      const handleError = () => {
        cleanup()
        resolve()
      }

      this.oneOffAudio!.addEventListener('ended', handleEnded)
      this.oneOffAudio!.addEventListener('error', handleError)

      const absoluteUrl = url.startsWith('http')
        ? url
        : window.location.origin + (url.startsWith('/') ? url : '/' + url)

      this.oneOffAudio!.src = absoluteUrl
      this.oneOffAudio!.play().catch(() => {
        cleanup()
        resolve()
      })
    })
  }
}
