import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import type { DictionaryLanguage } from '../types'
import { getNotes as getNotesDb, saveNote as saveNoteDb, deleteNote as deleteNoteDb } from '../db/notes'
import { useAppToast } from './ToastProvider'

type NotesMap = Map<string, string>

interface NotesContextType {
  notesMap: NotesMap
  getNote: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => string | undefined
  saveNote: (word: NonEmptyStringTrimmed, language: DictionaryLanguage, note: string) => Promise<void>
  deleteNote: (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => Promise<void>
  isLoading: boolean
}

const NotesContext = createContext<NotesContextType | null>(null)

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notesMap, setNotesMap] = useState<NotesMap>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const toast = useAppToast()

  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      const notes = await getNotesDb()
      const newMap = new Map<string, string>()

      notes.forEach(item => {
        newMap.set(`${item.language}_${item.word}`, item.note)
      })
      setNotesMap(newMap)
    } catch (e) {
      toast.error(
        'Failed to load notes' as NonEmptyStringTrimmed,
        (e instanceof Error ? e.message : String(e)) as NonEmptyStringTrimmed,
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  const saveNote = useCallback(async (word: NonEmptyStringTrimmed, language: DictionaryLanguage, note: string) => {
    const trimmed = note.trim()
    await saveNoteDb(word, language, trimmed)
    setNotesMap(prev => {
      const next = new Map(prev)

      next.set(`${language}_${word}`, trimmed)

      return next
    })
  }, [])

  const deleteNote = useCallback(async (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
    await deleteNoteDb(word, language)
    setNotesMap(prev => {
      const next = new Map(prev)

      next.delete(`${language}_${word}`)

      return next
    })
  }, [])

  const getNote = useCallback(
    (word: NonEmptyStringTrimmed, language: DictionaryLanguage) => {
      return notesMap.get(`${language}_${word}`)
    },
    [notesMap],
  )

  const contextValue = useMemo(
    () => ({
      notesMap,
      getNote,
      saveNote,
      deleteNote,
      isLoading,
    }),
    [notesMap, getNote, saveNote, deleteNote, isLoading],
  )

  return <NotesContext.Provider value={contextValue}>{children}</NotesContext.Provider>
}

export const useNotes = () => {
  const ctx = useContext(NotesContext)

  if (!ctx) throw new Error('useNotes must be used within NotesProvider')

  return ctx
}
