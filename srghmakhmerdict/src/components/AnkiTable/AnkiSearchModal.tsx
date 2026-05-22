import React, { useState, useMemo } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@heroui/react'
import { useAnkiTable } from './AnkiTableContext'
import { type NoteWithMetadata } from './types'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ratingConfigs } from './AnkiRatingButtons'
import { cn } from '@heroui/theme'
import { IoSearchOutline } from 'react-icons/io5'

interface Props {
  isOpen: boolean
  onClose: () => void
  notes: NoteWithMetadata[]
}

const SearchRow = React.memo(({ note }: { note: NoteWithMetadata }) => {
  const { anki, audio } = useAnkiTable()
  const preview = anki.getPreview(note.word)

  const handleRate = React.useCallback(
    (rating: number) => {
      anki.rate(note.word, rating)
      if (note.word_audio) audio.removeFromQueue({ url: note.word_audio, text: note.word })
      if (note.sent_audio && note.sent) audio.removeFromQueue({ url: note.sent_audio, text: note.sent })
    },
    [anki, audio, note.word, note.word_audio, note.sent_audio, note.sent],
  )

  return (
    <div className="p-2">
      <div className="flex flex-col md:flex-row gap-4 p-3 border rounded-xl shadow-sm bg-default-50 hover:bg-default-100 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-primary text-lg">{note.word}</span>
            <span className="text-default-500 font-bold">{note.worden}</span>
          </div>
          <div className="text-sm mb-1">{note.sent}</div>
          <div className="text-sm text-default-500">{note.senten}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {ratingConfigs.map(config => (
            <button
              key={config.rating}
              className={cn(
                'flex flex-col items-center justify-center rounded border px-2 py-1 text-[10px] font-bold transition-all',
                'bg-background hover:scale-105 active:scale-95',
              )}
              onClick={() => handleRate(config.rating)}
            >
              <span className="uppercase opacity-70">{config.label}</span>
              <span className="font-medium text-muted-foreground">{preview[config.rating]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

SearchRow.displayName = 'SearchRow'

export const AnkiSearchModal: React.FC<Props> = ({ isOpen, onClose, notes }) => {
  const [word, setWord] = useState('')
  const [sentence, setSentence] = useState('')
  const [worden, setWorden] = useState('')
  const [sentenceen, setSentenceen] = useState('')

  const handleWordChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => setWord(e.target.value), [])
  const handleWordClear = React.useCallback(() => setWord(''), [])
  const handleSentenceChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSentence(e.target.value),
    [],
  )
  const handleSentenceClear = React.useCallback(() => setSentence(''), [])
  const handleWordenChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setWorden(e.target.value),
    [],
  )
  const handleWordenClear = React.useCallback(() => setWorden(''), [])
  const handleSentenceenChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSentenceen(e.target.value),
    [],
  )
  const handleSentenceenClear = React.useCallback(() => setSentenceen(''), [])

  const results = useMemo(() => {
    if (!word && !sentence && !worden && !sentenceen) return []

    const w = word.toLowerCase()
    const s = sentence.toLowerCase()
    const we = worden.toLowerCase()
    const se = sentenceen.toLowerCase()

    return notes.filter(n => {
      if (w && !n.word.toLowerCase().includes(w)) return false
      if (s && !n.sent.toLowerCase().includes(s)) return false
      if (we && !n.worden.toLowerCase().includes(we)) return false
      if (se && !n.senten.toLowerCase().includes(se)) return false

      return true
    })
  }, [notes, word, sentence, worden, sentenceen])

  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  })

  const virtualListStyle = React.useMemo(
    () => ({
      height: `${rowVirtualizer.getTotalSize()}px`,
      width: '100%',
      position: 'relative' as const,
    }),
    [rowVirtualizer.getTotalSize()],
  )

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: 'm-0 sm:m-4 h-[100dvh] max-h-none sm:h-auto sm:max-h-[90vh] w-screen max-w-none sm:w-auto sm:max-w-4xl rounded-none sm:rounded-large',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex-col gap-4 border-b bg-default-50/50 py-4 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IoSearchOutline size={18} />
            </div>
            <h3 className="text-lg font-bold tracking-tight">Search Cards</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
            <Input
              isClearable
              placeholder="Word (Khmer)"
              size="sm"
              value={word}
              onChange={handleWordChange}
              onClear={handleWordClear}
            />
            <Input
              isClearable
              placeholder="Sentence (Khmer)"
              size="sm"
              value={sentence}
              onChange={handleSentenceChange}
              onClear={handleSentenceClear}
            />
            <Input
              isClearable
              placeholder="Word (English)"
              size="sm"
              value={worden}
              onChange={handleWordenChange}
              onClear={handleWordenClear}
            />
            <Input
              isClearable
              placeholder="Sentence (English)"
              size="sm"
              value={sentenceen}
              onChange={handleSentenceenChange}
              onClear={handleSentenceenClear}
            />
          </div>
        </ModalHeader>
        <ModalBody className="p-0 overflow-hidden relative">
          {!word && !sentence && !worden && !sentenceen ? (
            <div className="flex items-center justify-center h-40 text-default-400">Enter at least one search term</div>
          ) : results.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-default-400">No results found</div>
          ) : (
            <div ref={parentRef} className="h-[60vh] w-full overflow-auto">
              <div style={virtualListStyle}>
                {rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const note = results[virtualRow.index]

                  if (!note) return null

                  return (
                    <div
                      key={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <SearchRow note={note} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t bg-default-50/50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex-1 text-sm text-default-500 font-bold">{results.length} results</div>
          <Button color="primary" variant="flat" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
