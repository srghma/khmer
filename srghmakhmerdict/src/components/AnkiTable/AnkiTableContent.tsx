import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useAnkiTable } from './AnkiTableContext'
import { AnkiNoteCell } from './AnkiNoteCell'
import { AnkiRatingButtons } from './AnkiRatingButtons'
import { cn } from '@heroui/theme'
import { Button } from '@heroui/button'
import { ReactSelectionPopup } from '../react-selection-popup/ReactSelectionPopup'
import { SelectionMenuBody } from '../SelectionContextMenu/SelectionMenuBody'
import { useLocation } from 'wouter'
import { makeKhmerAnalyzerUrl, getUrlSearchParam } from '../../utils/url-navigation'
import { sanitizeTextForAnalyzer } from '../../utils/sanitizeTextForAnalyzer'
import { useDictionary } from '../../providers/DictionaryProvider'
import { DictData_isWordInEitherOf3Dictionaries_caseInsensitive } from '../../initDictionary'
import { type NoteWithMetadata, type AnkiTableManager, type AnkiTableAudioPlayer } from './types'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { isTauri, updatePos } from '../../db/invoke'

interface Props {
  notes: NoteWithMetadata[]
  currentTime: number
  hideFront: boolean
  hideBack: boolean
  hideInfo: boolean
}

const PAGE_SIZE = 10

const DueInfoDisplay = React.memo<{
  word: string
  currentTime: number
  anki: AnkiTableManager
}>(({ word, currentTime, anki }) => {
  const dueInfo = anki.getDueInfo(word, currentTime)

  return (
    <span className={cn('text-[9px] font-black tracking-tighter uppercase', dueInfo.color)}>
      {dueInfo.isDue ? '-' : ''}
      {dueInfo.label}
    </span>
  )
})

DueInfoDisplay.displayName = 'DueInfoDisplay'

const ALL_POS = ['adj', 'adv', 'classifier', 'conj', 'intj', 'name', 'noun', 'num', 'prep', 'verb']

const PosSelector = React.memo<{
  word: string
  currentPos?: string
}>(({ word, currentPos }) => {
  const [val, setVal] = useState(currentPos || '')

  if (isTauri) {
    return val ? (
      <div className="w-fit rounded bg-primary/10 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold text-primary uppercase">
        {val}
      </div>
    ) : null
  }

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPos = e.target.value

    setVal(newPos)
    try {
      await updatePos(word, newPos)
    } catch (err) {
      console.error('Failed to update POS', err)
    }
  }

  return (
    <div className="relative w-fit group">
      <select
        className={cn(
          'w-fit rounded px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase border-none focus:ring-0 cursor-pointer appearance-none outline-none transition-colors',
          val ? 'bg-primary/10 text-primary' : 'bg-default-100 text-default-400 opacity-50 group-hover:opacity-100',
        )}
        value={val}
        onChange={handleChange}
      >
        <option value="">POS</option>
        {ALL_POS.map(pos => (
          <option key={pos} className="bg-background text-foreground" value={pos}>
            {pos}
          </option>
        ))}
      </select>
    </div>
  )
})

PosSelector.displayName = 'PosSelector'

const AnkiTableRow = React.memo<{
  note: NoteWithMetadata
  anki: AnkiTableManager
  audio: AnkiTableAudioPlayer
  currentTime: number
  hideFront: boolean
  hideBack: boolean
  hideInfo: boolean
  isRowRevealed: boolean
  onReveal: (word: string, reveal: boolean) => void
}>(({ note, anki, audio, currentTime, hideFront, hideBack, hideInfo, isRowRevealed, onReveal }) => {
  const dueInfo = anki.getDueInfo(note.word, currentTime)

  const isInfoRevealed = isRowRevealed || (!note.ety && !note.pronunciation && !note.senses && !note.derivedTerms)

  const getRowClass = () => {
    if (dueInfo.isNew) return 'bg-blue-500/5 border-l-4 border-l-blue-500/50'
    if (dueInfo.isDue) return 'bg-red-500/5 border-l-4 border-l-red-500'
    if (dueInfo.diff !== undefined && dueInfo.diff <= 2 * 60000) {
      return 'bg-orange-500/5 border-l-4 border-l-orange-500/50'
    }
    if (dueInfo.diff !== undefined && dueInfo.diff <= 5 * 60000) {
      return 'bg-purple-500/5 border-l-4 border-l-purple-500/50'
    }
    if (dueInfo.diff !== undefined && dueInfo.diff <= 60 * 60000) {
      return 'bg-green-500/5 border-l-4 border-l-green-500/50'
    }

    return 'bg-yellow-500/5 text-card-foreground border-l-4 border-l-yellow-500/30'
  }

  return (
    <div className="w-full py-1">
      <div
        className={cn(
          'flex flex-col md:flex-row w-full rounded-xl border p-2 shadow-sm transition-all duration-200 gap-2 md:gap-0',
          getRowClass(),
        )}
      >
        {/* 1. Number and Anki Buttons */}
        <div className="flex w-full md:w-fit md:min-w-[100px] flex-shrink-0 flex-row md:flex-col items-center justify-between md:justify-start gap-2 border-b md:border-b-0 md:border-r pb-2 md:pb-0 md:pr-2">
          <div className="flex md:w-full items-center justify-between px-1 gap-2">
            <span className="font-mono text-[10px] font-bold tabular-nums opacity-30">
              {(note.id + 1).toString().padStart(3, '0')}
            </span>
            <DueInfoDisplay anki={anki} currentTime={currentTime} word={note.word} />
          </div>
          <AnkiRatingButtons
            anki={anki}
            audio={audio}
            isRevealed={isRowRevealed}
            sent={note.sent}
            sent_audio={note.sent_audio}
            word={note.word}
            word_audio={note.word_audio}
            onReveal={rev => onReveal(note.word, rev)}
          />
        </div>

        {/* Word and Sentence Group (Mobile Optimization) */}
        <div className="flex flex-col md:flex-row flex-grow min-w-0">
          {/* 2. Word (Front) - Khmer Text */}
          <div className="w-full md:w-[12%] flex-shrink-0 overflow-hidden p-2 border-b md:border-b-0 md:border-r border-default-100">
            <AnkiNoteCell
              audio={audio}
              audioUrl={note.word_audio}
              isGlobalHidden={hideFront}
              isRowRevealed={isRowRevealed}
              title={note.word}
              type="front"
              word={note.word}
            >
              <div className="flex flex-col gap-1">
                <div className={cn(isRowRevealed && 'khmer-selection-enabled')}>
                  <div className="text-xl md:text-2xl leading-tight font-bold text-primary">{note.word}</div>
                </div>
                {note.wordrom && (
                  <div className="text-xs md:text-sm font-medium text-default-500 italic">{note.wordrom}</div>
                )}
              </div>
            </AnkiNoteCell>
          </div>

          {/* 3. Sentence (Front) - Khmer Text */}
          <div className="w-full md:w-[25%] flex-shrink-0 overflow-hidden p-2 border-b md:border-b-0 md:border-r border-default-100">
            <AnkiNoteCell
              audio={audio}
              audioUrl={note.sent_audio}
              isGlobalHidden={hideFront}
              isRowRevealed={isRowRevealed}
              title={note.sent}
              type="front"
              word={undefined}
            >
              <div className="flex flex-col gap-2">
                <div className={cn(isRowRevealed && 'khmer-selection-enabled')}>
                  <div className="text-base md:text-lg leading-relaxed font-medium">{note.sent}</div>
                </div>
                {note.sentrom && <div className="text-xs md:text-sm text-default-500 italic">{note.sentrom}</div>}
              </div>
            </AnkiNoteCell>
          </div>

          {/* Translation Group */}
          <div className="flex flex-col md:flex-row md:w-[40%] flex-shrink-0 min-w-0">
            {/* 4. En Word (Back) */}
            <div className="w-full md:w-[40%] flex-shrink-0 overflow-hidden p-2 border-b md:border-b-0 md:border-r border-default-100">
              <AnkiNoteCell
                audio={audio}
                audioUrl={undefined}
                isGlobalHidden={hideBack}
                isRowRevealed={isRowRevealed}
                title={undefined}
                type="back"
                word={undefined}
              >
                <div className="flex flex-col gap-1">
                  <div className="text-base md:text-lg font-bold">{note.worden}</div>
                  <PosSelector currentPos={note.pos} word={note.word} />
                </div>
              </AnkiNoteCell>
            </div>

            {/* 5. En Sentence (Back) */}
            <div className="w-full md:w-[60%] flex-shrink-0 overflow-hidden p-2 border-b md:border-b-0 md:border-r border-default-100">
              <AnkiNoteCell
                audio={audio}
                audioUrl={undefined}
                isGlobalHidden={hideBack}
                isRowRevealed={isRowRevealed}
                title={undefined}
                type="back"
                word={undefined}
              >
                <div className="text-sm md:text-base leading-relaxed">{note.senten}</div>
              </AnkiNoteCell>
            </div>
          </div>

          {/* 6. Info */}
          <div className="w-full md:flex-1 overflow-hidden p-2">
            <AnkiNoteCell
              audio={audio}
              audioUrl={undefined}
              isGlobalHidden={hideInfo}
              isRowRevealed={isInfoRevealed}
              title={undefined}
              type="info"
              word={note.word}
            >
              <div className="flex flex-col gap-3 text-xs md:text-sm">
                {note.ety && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-default-400 uppercase">
                      Etymology
                    </span>
                    <p>{note.ety}</p>
                  </div>
                )}
                {note.pronunciation && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-default-400 uppercase">
                      Pronunciation
                    </span>
                    <p>{note.pronunciation}</p>
                  </div>
                )}
                {note.senses && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-default-400 uppercase">
                      Senses
                    </span>
                    <p>{note.senses}</p>
                  </div>
                )}
                {note.derivedTerms && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] md:text-[10px] font-bold tracking-wider text-default-400 uppercase">
                      Derived Terms
                    </span>
                    <p>{note.derivedTerms}</p>
                  </div>
                )}
              </div>
            </AnkiNoteCell>
          </div>
        </div>
      </div>
    </div>
  )
})

AnkiTableRow.displayName = 'AnkiTableRow'

const AnkiTableRowMemoized = React.memo(AnkiTableRow, (prev, next) => {
  if (prev.note !== next.note) return false
  if (prev.isRowRevealed !== next.isRowRevealed) return false
  if (prev.hideFront !== next.hideFront) return false
  if (prev.hideBack !== next.hideBack) return false
  if (prev.hideInfo !== next.hideInfo) return false
  if (prev.currentTime !== next.currentTime) return false
  if (prev.onReveal !== next.onReveal) return false

  // Audio optimization
  if (prev.audio !== next.audio) {
    const hasAudio = !!(prev.note.word_audio || prev.note.sent_audio)

    if (!hasAudio) return true

    const isAffected = (a: typeof prev.audio) => {
      if (!a.currentTrack) return false
      const url = a.currentTrack.url

      return url === prev.note.word_audio || url === prev.note.sent_audio
    }

    if (isAffected(prev.audio) !== isAffected(next.audio)) return false
    if (prev.audio.isPlaying !== next.audio.isPlaying && isAffected(next.audio)) return false
    if (prev.audio.isInQueue !== next.audio.isInQueue) {
      const wordInQueuePrev = prev.note.word_audio
        ? prev.audio.isInQueue({ url: prev.note.word_audio, text: prev.note.word })
        : false
      const wordInQueueNext = next.note.word_audio
        ? next.audio.isInQueue({ url: next.note.word_audio, text: next.note.word })
        : false

      if (wordInQueuePrev !== wordInQueueNext) return false

      const sentInQueuePrev = prev.note.sent_audio
        ? prev.audio.isInQueue({ url: prev.note.sent_audio, text: prev.note.sent })
        : false
      const sentInQueueNext = next.note.sent_audio
        ? next.audio.isInQueue({ url: next.note.sent_audio, text: next.note.sent })
        : false

      if (sentInQueuePrev !== sentInQueueNext) return false
    }

    return true
  }

  return true
})

export const AnkiTableContent: React.FC<Props> = ({ notes, currentTime, hideFront, hideBack, hideInfo }) => {
  const { anki, audio, state } = useAnkiTable()
  const dictData = useDictionary()
  const [location, setLocation] = useLocation()
  const [page, setPage] = useState(() => {
    const p = getUrlSearchParam('page')

    if (p) return Math.max(0, parseInt(p, 10) - 1)

    const w = getUrlSearchParam('word')

    if (w) {
      const idx = notes.findIndex(n => n.word === w)

      if (idx !== -1) return Math.floor(idx / PAGE_SIZE)
    }

    return 0
  })
  const [revealedRows, setRevealedRows] = useState<Set<string>>(new Set())
  const parentRef = useRef<HTMLDivElement>(null)

  const totalPages = Math.ceil(notes.length / PAGE_SIZE)
  const currentPageNotes = useMemo(() => {
    return notes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }, [notes, page])

  // Reset page only when structural filters or sort mode change
  useEffect(() => {
    setPage(0)
  }, [state.sortMode, state.disabledPos, state.showDue, state.showNew, state.showNotDue])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    params.set('page', (page + 1).toString())
    // Keep word in URL if we have it and it's on this page
    const currentWord = getUrlSearchParam('word')

    if (currentWord) {
      const idx = notes.findIndex(n => n.word === currentWord)

      if (idx !== -1 && Math.floor(idx / PAGE_SIZE) === page) {
        params.set('word', currentWord)
      } else {
        params.delete('word')
      }
    }
    const newSearch = params.toString()

    if (newSearch !== window.location.search.replace(/^\?/, '')) {
      setLocation(`${location}?${newSearch}`, { replace: true })
    }
  }, [page, setLocation, notes])

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1)
    }
  }, [notes.length, page, totalPages])

  const handleRevealRow = useCallback((word: string, reveal: boolean) => {
    setRevealedRows(prev => {
      const next = new Set(prev)

      if (reveal) next.add(word)
      else next.delete(word)

      return next
    })
  }, [])

  const renderPopupContent = useCallback(
    (selectedText: NonEmptyStringTrimmed) => {
      return (
        <SelectionMenuBody
          currentMode="km"
          selectedText={selectedText}
          onClosePopupAndKhmerAnalyzerModal={undefined}
          onClosePopupAndOpenSearch={() => {
            window.getSelection()?.collapseToEnd()
            const wordInfo = DictData_isWordInEitherOf3Dictionaries_caseInsensitive(dictData, selectedText)

            if (wordInfo) {
              setLocation(`~/${wordInfo[1]}/${encodeURIComponent(wordInfo[0])}`)
            } else {
              setLocation(makeKhmerAnalyzerUrl(sanitizeTextForAnalyzer(selectedText)))
            }
          }}
        />
      )
    },
    [dictData, setLocation],
  )

  const handlePrevPage = () => setPage(p => Math.max(0, p - 1))
  const handleNextPage = () => setPage(p => Math.min(totalPages - 1, p + 1))
  const handleFirstPage = () => setPage(0)
  const handleLastPage = () => setPage(totalPages - 1)
  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)

    if (!isNaN(val)) {
      setPage(Math.min(Math.max(0, val - 1), totalPages - 1))
    }
  }

  const jumpTo = (index: number) => {
    if (index === -1) return
    const newPage = Math.floor(index / PAGE_SIZE)

    setPage(newPage)
    const word = notes[index]!.word
    const params = new URLSearchParams(window.location.search)

    params.set('page', (newPage + 1).toString())
    params.set('word', word)
    setLocation(`${location}?${params.toString()}`, { replace: true })
  }

  const firstDueIdx = useMemo(() => {
    return notes.findIndex(n => {
      const s = anki.getStatus(n.word)

      return s && s.due <= currentTime
    })
  }, [notes, anki, currentTime])

  const firstNewIdx = useMemo(() => {
    return notes.findIndex(n => !anki.getStatus(n.word))
  }, [notes, anki])

  const firstWaitIdx = useMemo(() => {
    return notes.findIndex(n => {
      const s = anki.getStatus(n.word)

      return s && s.due > currentTime
    })
  }, [notes, anki, currentTime])

  return (
    <div ref={parentRef} className="flex h-full w-full flex-col overflow-hidden">
      {/* Table Header */}
      <div className="sticky top-0 z-20 hidden md:flex w-full border-b bg-background/95 px-4 pb-2 text-[10px] font-bold tracking-tight text-default-400 uppercase backdrop-blur-md">
        <div className="w-fit min-w-[100px] flex-shrink-0 px-2"># & Anki</div>
        <div className="w-[12%] flex-shrink-0 px-2">Word</div>
        <div className="w-[25%] flex-shrink-0 px-2">Sentence</div>
        <div className="w-[15%] flex-shrink-0 px-2">En Word</div>
        <div className="w-[25%] flex-shrink-0 px-2">En Sentence</div>
        <div className="flex-grow px-2">Info</div>
      </div>

      <div className="flex-grow overflow-y-auto px-4 py-2 scrollbar-hide">
        <ReactSelectionPopup disabled={!state.showShortDefinitionOnSelect} popupContent={renderPopupContent}>
          <div className="flex flex-col gap-2">
            {currentPageNotes.map((note, idx) => (
              <AnkiTableRowMemoized
                key={`${note.word}-${idx}`}
                anki={anki}
                audio={audio}
                currentTime={currentTime}
                hideBack={hideBack}
                hideFront={hideFront}
                hideInfo={hideInfo}
                isRowRevealed={revealedRows.has(note.word)}
                note={note}
                onReveal={handleRevealRow}
              />
            ))}

            {notes.length === 0 && (
              <div className="flex h-40 items-center justify-center text-default-400 italic">No cards found.</div>
            )}
          </div>
        </ReactSelectionPopup>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col gap-2 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-default-400 uppercase tracking-tighter">Page</span>
              <input
                className="h-7 w-12 rounded border bg-zinc-900 px-1 text-center text-xs font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                max={totalPages}
                min={1}
                type="number"
                value={page + 1}
                onChange={handlePageInput}
              />
              <span className="text-[10px] font-bold text-default-400 uppercase tracking-tighter">
                of {totalPages || 1}
              </span>
            </div>
            <div className="hidden text-[10px] font-bold text-default-400 uppercase tracking-tighter md:block">
              ({notes.length} cards)
            </div>
          </div>

          <div className="flex items-center gap-1">
            {firstDueIdx !== -1 && (
              <Button
                className="h-7 px-2 text-[9px] font-bold uppercase"
                color="danger"
                size="sm"
                variant="flat"
                onClick={() => jumpTo(firstDueIdx)}
              >
                Due
              </Button>
            )}
            {firstNewIdx !== -1 && (
              <Button
                className="h-7 px-2 text-[9px] font-bold uppercase"
                color="primary"
                size="sm"
                variant="flat"
                onClick={() => jumpTo(firstNewIdx)}
              >
                New
              </Button>
            )}
            {firstWaitIdx !== -1 && (
              <Button
                className="h-7 px-2 text-[9px] font-bold uppercase"
                color="warning"
                size="sm"
                variant="flat"
                onClick={() => jumpTo(firstWaitIdx)}
              >
                Wait
              </Button>
            )}
          </div>

          <div className="flex gap-1.5">
            <Button
              isIconOnly
              className={cn('h-8 w-8 min-w-0 rounded-lg', page === 0 && 'opacity-20')}
              disabled={page === 0}
              size="sm"
              variant="flat"
              onClick={handleFirstPage}
            >
              <IoChevronBack className="-mr-1.5" size={14} />
              <IoChevronBack size={14} />
            </Button>
            <Button
              isIconOnly
              className={cn('h-8 w-8 min-w-0 rounded-lg', page === 0 && 'opacity-20')}
              disabled={page === 0}
              size="sm"
              variant="flat"
              onClick={handlePrevPage}
            >
              <IoChevronBack size={16} />
            </Button>
            <Button
              isIconOnly
              className={cn('h-8 w-8 min-w-0 rounded-lg', page >= totalPages - 1 && 'opacity-20')}
              disabled={page >= totalPages - 1}
              size="sm"
              variant="flat"
              onClick={handleNextPage}
            >
              <IoChevronForward size={16} />
            </Button>
            <Button
              isIconOnly
              className={cn('h-8 w-8 min-w-0 rounded-lg', page >= totalPages - 1 && 'opacity-20')}
              disabled={page >= totalPages - 1}
              size="sm"
              variant="flat"
              onClick={handleLastPage}
            >
              <IoChevronForward size={14} />
              <IoChevronForward className="-ml-1.5" size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
