import { useState, useEffect, useCallback } from 'react'
import { type NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import * as FavDb from '../db/favourite'
import * as HistoryDb from '../db/history'
import * as DictDb from '../db/dict'
import { type DictionaryLanguage } from '../types'
import { type WordDetailEnOrRuOrKm } from '../db/dict'
import { mapModeToNativeLang, executeNativeTts, executeGoogleTts } from '../utils/tts'
import { useToast } from '../providers/ToastProvider'

export function useWordData(word: NonEmptyStringTrimmed, mode: DictionaryLanguage) {
  const toast = useToast()
  const [data, setData] = useState<WordDetailEnOrRuOrKm | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const [fav, res] = await Promise.all([
          FavDb.isFavorite(word, mode),
          DictDb.getWordDetailByMode(mode, word, false),
          HistoryDb.addToHistory(word, mode),
        ])

        if (active) {
          setData(res)
          setIsFav(fav)
        }
      } catch (e: any) {
        toast.error('Error loading dictionary details:', e.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [word, mode])

  const toggleFav = useCallback(async () => {
    try {
      if (isFav) {
        await FavDb.removeFavorite(word, mode)
        setIsFav(false)
      } else {
        await FavDb.addFavorite(word, mode)
        setIsFav(true)
      }
    } catch (e: any) {
      toast.error(isFav ? 'Removing favorite failed' : 'Adding favorite failed', e.message)
    }
  }, [isFav, word, mode])

  return { data, loading, isFav, toggleFav }
}

export function useTtsHandlers(data: WordDetailEnOrRuOrKm | undefined, mode: DictionaryLanguage) {
  const [isGoogleSpeaking, setIsGoogleSpeaking] = useState(false)

  // 1. Extract the primitive string here.
  // This ensures the dependency array only deals with a string, not the full object.
  const word = data?.word

  const handleNativeSpeak = useCallback(() => {
    if (!word) return
    const lang = mapModeToNativeLang(mode)

    executeNativeTts(word, lang)
  }, [word, mode]) // Dependency is now a simple string

  const handleGoogleSpeak = useCallback(async () => {
    if (!word || isGoogleSpeaking) return

    setIsGoogleSpeaking(true)
    await executeGoogleTts(word, mode)
    setIsGoogleSpeaking(false)
  }, [word, mode, isGoogleSpeaking]) // Dependency is now a simple string

  return { isGoogleSpeaking, handleNativeSpeak, handleGoogleSpeak }
}
