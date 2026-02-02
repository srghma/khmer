import React, { useState, useEffect, useCallback, memo, useRef } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react'
import { Button } from '@heroui/react'
import { Spinner } from '@heroui/react'
import { Tooltip } from '@heroui/react'
import { HiSpeakerWave, HiArrowTopRightOnSquare } from 'react-icons/hi2'
import type { NonEmptyStringTrimmed } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { executeGoogleTts } from '../../utils/tts'
import { type KhmerWordsMap, yieldOnlyVerifiedKhmerWords } from '../../db/dict'

// TanStack Virtual
import { useVirtualizer } from '@tanstack/react-virtual'

// --- Data Definitions (Grids/Sets) ---
const consonantsGrid = [
  ['ក', 'ខ', 'គ', 'ឃ', 'ង'],
  ['ច', 'ឆ', 'ជ', 'ឈ', 'ញ'],
  ['ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ'],
  ['ត', 'ថ', 'ទ', 'ធ', 'ន'],
  ['ប', 'ផ', 'ព', 'ភ', 'ម'],
  ['យ', 'រ', 'ល', 'វ', ''],
  ['ស', 'ហ', 'ឡ', 'អ', ''],
] as const

const supplementaryConsonants = ['ហ្គ', 'ហ្គ៊', 'ហ្ន', 'ប៉', 'ហ្ម', 'ហ្ល', 'ហ្វ', 'ហ្វ៊', 'ហ្ស', 'ហ្ស៊'] as const
const independentVowels = ['ឥ', 'ឦ', 'ឧ', 'ឨ', 'ឩ', 'ឪ', 'ឫ', 'ឬ', 'ឭ', 'ឮ', 'ឯ', 'ឰ', 'ឱ', 'ឲ', 'ឳ'] as const

const aSeriesSet = new Set([
  'ក',
  'ខ',
  'ច',
  'ឆ',
  'ដ',
  'ឋ',
  'ណ',
  'ត',
  'ថ',
  'ប',
  'ផ',
  'ស',
  'ហ',
  'ឡ',
  'អ',
  'ហ្ន',
  'ប៉',
  'ហ្ម',
  'ហ្ល',
  'ហ្វ',
  'ហ្ស',
])

const vowelsGrid = [
  ['ា', 'ិ', 'ី', 'ឹ', 'ឺ'],
  ['ុ', 'ូ', 'ួ', 'ើ', 'ឿ'],
  ['ៀ', 'េ', 'ែ', 'ៃ', 'ោ'],
  ['ៅ', 'ុំ', 'ំ', 'ាំ', 'ះ'],
  ['ិះ', 'ុះ', 'េះ', 'ោះ', ''],
] as const

const cleanVowel = (v: string) => v.replace(/^អ/, '')

// --- Types ---
type GraphemeIndex = Map<string, NonEmptyStringTrimmed[]>

interface KhmerComplexTableModalProps {
  isOpen: boolean
  onClose: () => void
  wordsMap: KhmerWordsMap // Changed from wordList array to Map
}

interface DeckData {
  title: string
  words: string[]
}

// --- Memoized Components ---

const WordCard = memo(({ word, highlight }: { word: string; highlight: string }) => {
  // Logic remains same
  const parts = React.useMemo(() => word.split(highlight), [word, highlight])
  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      executeGoogleTts(word, 'km')
    },
    [word],
  )

  const handleTranslate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      window.open(`https://translate.google.com/?sl=km&text=${encodeURIComponent(word)}`, '_blank')
    },
    [word],
  )

  return (
    <div className="group bg-content1 border border-divider rounded-lg p-3 flex justify-between items-center hover:border-primary/50 hover:shadow-sm transition-all h-[64px]">
      <div className="text-lg font-khmer text-foreground/90 truncate mr-2">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="text-danger font-bold bg-danger/10 rounded px-0.5">{highlight}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Tooltip closeDelay={0} content="Speak">
          <button
            className="p-1.5 text-default-400 hover:text-primary hover:bg-primary/10 rounded-full"
            onClick={handleSpeak}
          >
            <HiSpeakerWave />
          </button>
        </Tooltip>
        <Tooltip closeDelay={0} content="Google Translate">
          <button
            className="p-1.5 text-default-400 hover:text-secondary hover:bg-secondary/10 rounded-full"
            onClick={handleTranslate}
          >
            <HiArrowTopRightOnSquare />
          </button>
        </Tooltip>
      </div>
    </div>
  )
})

WordCard.displayName = 'WordCard'

const modalClassNames = {
  base: 'h-[85vh] flex flex-col',
  body: 'p-0 overflow-hidden flex-1',
}

const modalBodyDivStyle = { contain: 'strict' }

const WordDeckModal = memo(({ onClose, data }: { onClose: () => void; data: DeckData }) => {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate rows for a 2-column layout
  const rowCount = Math.ceil(data.words.length / 2)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76, // Height of card (64px) + Gap (12px)
    overscan: 5,
  })

  return (
    <Modal backdrop="blur" classNames={modalClassNames} isOpen={true} size="2xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-divider shrink-0">
          <div className="flex items-baseline gap-3">
            <span className="font-bold font-khmer text-3xl text-primary">{data.title}</span>
            <span className="text-sm text-default-500">Found in {data.words.length} words</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div ref={parentRef} className="w-full h-full overflow-y-auto px-4 py-4" style={modalBodyDivStyle}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const idx1 = virtualRow.index * 2
                const idx2 = idx1 + 1

                return (
                  <div
                    key={virtualRow.key}
                    className="flex gap-3 pb-3"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      {data.words[idx1] && <WordCard highlight={data.title} word={data.words[idx1]} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {data.words[idx2] && <WordCard highlight={data.title} word={data.words[idx2]} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-divider shrink-0">
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
})

WordDeckModal.displayName = 'WordDeckModal'

const MatrixCell = memo(
  ({
    consonant,
    vowelRaw,
    count,
    onClick,
  }: {
    consonant: string
    vowelRaw: string
    count: number
    onClick: (combo: string) => void
  }) => {
    // Logic remains same
    if (!vowelRaw) return <td className="border border-divider/50 bg-content2/50" />
    const combo = consonant + cleanVowel(vowelRaw)

    return (
      <td className="border border-divider/50 p-0 h-[40px] align-middle">
        <button
          className={`w-full h-full flex flex-col items-center justify-center transition-colors
            ${count === 0 ? 'opacity-30 cursor-default' : 'cursor-pointer hover:bg-primary/20 hover:text-primary active:scale-95'}
          `}
          disabled={count === 0}
          onClick={() => count > 0 && onClick(combo)}
        >
          <span className="font-khmer text-sm leading-none">{combo}</span>
          {count > 0 && <span className="text-[9px] text-default-400 font-mono leading-none mt-0.5">{count}</span>}
        </button>
      </td>
    )
  },
)

MatrixCell.displayName = 'MatrixCell'

const ConsonantBlock = memo(
  ({
    consonant,
    index,
    onClick,
  }: {
    consonant: string
    index: GraphemeIndex | null
    onClick: (combo: string) => void
  }) => {
    if (!consonant) return null
    const isSeriesA = aSeriesSet.has(consonant)

    return (
      <div className="border-2 border-default-300 dark:border-default-100 bg-content1 mb-2 break-inside-avoid shadow-sm">
        <div
          className={`text-center text-2xl font-bold py-1 font-khmer ${isSeriesA ? 'text-danger-500' : 'text-primary-500'}`}
        >
          {consonant}
        </div>
        <table className="w-full table-fixed border-collapse">
          <tbody>
            {vowelsGrid.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map(v => {
                  const combo = consonant + cleanVowel(v)

                  return (
                    <MatrixCell
                      key={`c-${combo}`}
                      consonant={consonant}
                      count={index?.get(combo)?.length ?? 0}
                      vowelRaw={v}
                      onClick={onClick}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
)

ConsonantBlock.displayName = 'ConsonantBlock'

// --- Main Modal Component ---

export const KhmerComplexTableModal: React.FC<KhmerComplexTableModalProps> = ({ isOpen, onClose, wordsMap }) => {
  const [index, setIndex] = useState<GraphemeIndex | null>(null)
  const [selectedDeck, setSelectedDeck] = useState<DeckData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [indexedCount, setIndexedCount] = useState(0)

  // 1. Build Index (Async effect using generator)
  useEffect(() => {
    if (!isOpen || index) return

    setIsProcessing(true)
    // const t0 = performance.now()

    const timer = setTimeout(() => {
      const newIndex = new Map<string, NonEmptyStringTrimmed[]>()
      const segmenter = new Intl.Segmenter('km', { granularity: 'grapheme' })
      let count = 0

      // Use the generator to iterate only verified Khmer words
      for (const word of yieldOnlyVerifiedKhmerWords(wordsMap)) {
        count++
        const segments = segmenter.segment(word)
        const seenInWord = new Set<string>()

        for (const { segment } of segments) {
          if (seenInWord.has(segment)) continue
          seenInWord.add(segment)

          let list = newIndex.get(segment)

          if (!list) {
            list = []
            newIndex.set(segment, list)
          }
          list.push(word)
        }
      }

      for (const list of newIndex.values()) {
        list.sort((a, b) => a.length - b.length)
      }

      // console.log(`[KhmerComplexTable] Indexed ${count} verified words in ${(performance.now() - t0).toFixed(2)}ms`)
      setIndex(newIndex)
      setIndexedCount(count)
      setIsProcessing(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [isOpen, wordsMap, index])

  const handleCellClick = useCallback(
    (combo: string) => {
      if (!index) return
      const words = index.get(combo) || []

      setSelectedDeck({ title: combo, words })
    },
    [index],
  )

  const handleCloseDeck = useCallback(() => setSelectedDeck(null), [])

  return (
    <>
      <Modal
        classNames={{
          body: 'p-0 overflow-hidden',
          base: 'bg-background text-foreground',
          header: 'border-b border-divider',
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="full"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex gap-4 items-center justify-between pr-10">
            <div className="flex gap-4 items-center">
              <span className="text-xl">Khmer Consonant-Vowel Matrix</span>
              {!isProcessing && index && (
                <div className="text-sm font-normal text-default-500 flex gap-4 border-l border-divider pl-4">
                  <span>
                    <span className="text-danger-500 font-bold">■</span> Series A
                  </span>
                  <span>
                    <span className="text-primary-500 font-bold">■</span> Series O
                  </span>
                  <span className="text-default-400">({indexedCount} verified words)</span>
                </div>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="bg-default-50">
            <div className="h-full overflow-y-auto p-6">
              {isProcessing ? (
                <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
                  <Spinner size="lg" />
                  <p className="text-default-500">Indexing grapheme clusters (Verified Only)...</p>
                </div>
              ) : (
                <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
                  {/* Main Consonants */}
                  <section>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {consonantsGrid.flat().map((c, i) => (
                        <div key={i}>
                          <ConsonantBlock consonant={c} index={index} onClick={handleCellClick} />
                        </div>
                      ))}
                    </div>
                  </section>
                  {/* Supplementary */}
                  <section>
                    <h3 className="text-lg font-bold mb-4 border-b border-divider pb-2 text-default-600">
                      Supplementary Consonants
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {supplementaryConsonants.map((c, i) => (
                        <div key={i}>
                          <ConsonantBlock consonant={c} index={index} onClick={handleCellClick} />
                        </div>
                      ))}
                    </div>
                  </section>
                  {/* Independent */}
                  <section>
                    <h3 className="text-lg font-bold mb-4 border-b border-divider pb-2 text-default-600">
                      Independent Characters
                    </h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {independentVowels.map(char => {
                        const count = index?.get(char)?.length ?? 0

                        return (
                          <button
                            key={char}
                            className={`border border-default-300 bg-content1 rounded-lg p-4 flex flex-col items-center gap-1 transition-all shadow-sm ${count === 0 ? 'opacity-50 cursor-default' : 'cursor-pointer hover:border-primary hover:bg-primary/5 hover:scale-105'}`}
                            disabled={count === 0}
                            onClick={() => count > 0 && handleCellClick(char)}
                          >
                            <span className="text-3xl font-khmer">{char}</span>
                            <span className="text-xs text-default-400">({count})</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
      {selectedDeck && <WordDeckModal data={selectedDeck} onClose={handleCloseDeck} />}
    </>
  )
}
