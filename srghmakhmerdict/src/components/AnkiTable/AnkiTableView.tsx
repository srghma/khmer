import React, { useMemo, useState, useCallback } from 'react'
import useSWRImmutable from 'swr/immutable'
import { useLocation } from 'wouter'
import { useAnkiTable, AnkiTableProvider } from './AnkiTableContext'
import { AnkiTableHeader } from './AnkiTableHeader'
import { WiktionaryModal } from './WiktionaryModal'
import { AnkiTableContent } from './AnkiTableContent'
import { type Note, type NoteWithMetadata, type NoteStatus } from './types'
import { safeBack } from '../../utils/safeBack'

const fetcher = (url: string) => fetch(url).then(res => res.json())

const AnkiTableInner: React.FC<{
  selectedWiktionary: string | null
  setSelectedWiktionary: (content: string | null) => void
}> = ({ selectedWiktionary, setSelectedWiktionary }) => {
  const { data: rawNotes, error } = useSWRImmutable<Note[]>('/data.json', fetcher)
  const { state, anki, currentTime } = useAnkiTable()
  const [, setLocation] = useLocation()

  const handleClose = useCallback(() => {
    safeBack(setLocation)
  }, [setLocation])

  const baseNotes = useMemo(() => {
    if (!rawNotes) return []

    return rawNotes.map((note, index) => ({
      ...note,
      id: index,
    })) as NoteWithMetadata[]
  }, [rawNotes])

  const allPos = useMemo(() => {
    return [...new Set(baseNotes.map(n => n.pos?.trim() || 'unknown'))].sort()
  }, [baseNotes])

  const sortedNotes = useMemo(() => {
    const now = currentTime
    let list = baseNotes

    // Apply filters
    list = list.filter(note => {
      const notePos = note.pos?.trim() || 'unknown'

      if (state.disabledPos.includes(notePos)) return false

      const status = anki.getStatus(note.word)

      if (!status) return state.showNew
      if (status.due <= now) return state.showDue

      return state.showNotDue
    })

    if (state.sortMode === 'due') {
      return [...list].sort((a, b) => {
        const statusA = anki.getStatus(a.word)
        const statusB = anki.getStatus(b.word)

        const getPriority = (status: NoteStatus | undefined) => {
          if (!status) return 1 // New
          if (status.due <= now) return 0 // Due

          return 2 // Not Due
        }

        const pA = getPriority(statusA)
        const pB = getPriority(statusB)

        if (pA !== pB) return pA - pB

        const dueA = statusA ? statusA.due : 0
        const dueB = statusB ? statusB.due : 0

        if (dueA !== dueB) return dueA - dueB

        return a.id - b.id
      })
    }

    return list
  }, [baseNotes, state.disabledPos, state.showDue, state.showNew, state.showNotDue, state.sortMode, anki, currentTime])

  if (error) return <div className="p-10 text-danger">Failed to load data.json</div>
  if (!rawNotes && !error) return <div className="p-10">Loading notes...</div>

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in slide-in-from-right duration-200">
      <AnkiTableHeader allPos={allPos} onBack={handleClose} />

      <main className="relative flex-1 w-full overflow-hidden">
        <div className="h-full w-full">
          <AnkiTableContent
            currentTime={currentTime}
            hideBack={state.hideBack}
            hideFront={state.hideFront}
            hideInfo={state.hideInfo}
            notes={sortedNotes}
          />
        </div>
      </main>

      <WiktionaryModal content={selectedWiktionary} onClose={() => setSelectedWiktionary(null)} />
    </div>
  )
}

export interface AnkiTableViewProps {
  playGoogleTts?: (text: string) => Promise<void>
  playNativeTts?: (text: string) => Promise<void>
}

export const AnkiTableView: React.FC<AnkiTableViewProps> = ({ playGoogleTts, playNativeTts }) => {
  const [selectedWiktionary, setSelectedWiktionary] = useState<string | null>(null)

  const onWiktionaryClick = useCallback((content: string) => {
    setSelectedWiktionary(content)
  }, [])

  return (
    <AnkiTableProvider
      playGoogleTts={playGoogleTts}
      playNativeTts={playNativeTts}
      onWiktionaryClick={onWiktionaryClick}
    >
      <AnkiTableInner selectedWiktionary={selectedWiktionary} setSelectedWiktionary={setSelectedWiktionary} />
    </AnkiTableProvider>
  )
}

AnkiTableView.displayName = 'AnkiTableView'
