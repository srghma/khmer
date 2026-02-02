import React, { useState, useCallback, memo, useMemo } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal'
import { Spinner } from '@heroui/spinner'
import {
  nonEmptyString_afterTrim,
  type NonEmptyStringTrimmed,
} from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'
import { type KhmerWordsMap } from '../../db/dict'
import { aSeriesSet, vowelsGrid, consonantsGrid, supplementaryConsonants, independentVowels } from './data'
import { WordDeckModal, type DeckData } from './WordDeckModal'
import { buildGraphemeIndex } from './buildGraphemeIndex'

// --- Memoized Components ---

const MatrixCell = memo(
  ({
    consonant,
    vowelRaw,
    count,
    onClick,
  }: {
    consonant: NonEmptyStringTrimmed
    vowelRaw: string
    count: number
    onClick: (combo: NonEmptyStringTrimmed) => void
  }) => {
    // Logic remains same
    if (!vowelRaw) return <td className="border border-divider/50 bg-content2/50" />
    const combo = nonEmptyString_afterTrim(consonant + cleanVowel(vowelRaw))

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

type GraphemeIndex = Map<string, NonEmptyStringTrimmed[]>

const cleanVowel = (v: string) => v.replace(/^អ/, '')

const ConsonantBlock = memo(
  ({
    consonant,
    index,
    onClick,
  }: {
    consonant: NonEmptyStringTrimmed
    index: GraphemeIndex | null
    onClick: (combo: NonEmptyStringTrimmed) => void
  }) => {
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

interface KhmerComplexTableModalProps {
  isOpen: boolean
  onClose: () => void
  wordsMap: KhmerWordsMap // Changed from wordList array to Map
}

const modalClassNames = {
  body: 'p-0 overflow-hidden',
  base: 'bg-background text-foreground',
  header: 'border-b border-divider',
}

export const KhmerComplexTableModal: React.FC<KhmerComplexTableModalProps> = ({ isOpen, onClose, wordsMap }) => {
  const [selectedDeck, setSelectedDeck] = useState<DeckData | null>(null)

  // 1. Build Index using useMemo
  const graphemeIndex: { index: GraphemeIndex; count: number } | undefined = useMemo(() => {
    if (!isOpen || !wordsMap) return

    return buildGraphemeIndex(wordsMap)
  }, [wordsMap, isOpen])

  const handleCellClick = useCallback(
    (combo: NonEmptyStringTrimmed) => {
      if (!graphemeIndex) return
      const words = graphemeIndex.index.get(combo) || []

      setSelectedDeck({ title: combo, words })
    },
    [graphemeIndex],
  )

  const handleCloseDeck = useCallback(() => setSelectedDeck(null), [])

  return (
    <>
      <Modal classNames={modalClassNames} isOpen={isOpen} scrollBehavior="inside" size="full" onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex gap-4 items-center justify-between pr-10">
            <div className="flex gap-4 items-center">
              <span className="text-xl">Khmer Consonant-Vowel Matrix</span>
              {graphemeIndex && (
                <div className="text-sm font-normal text-default-500 flex gap-4 border-l border-divider pl-4">
                  <span>
                    <span className="text-danger-500 font-bold">■</span> Series A
                  </span>
                  <span>
                    <span className="text-primary-500 font-bold">■</span> Series O
                  </span>
                  <span className="text-default-400">({graphemeIndex.count} verified words)</span>
                </div>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="bg-default-50">
            <div className="h-full overflow-y-auto p-6">
              {!graphemeIndex ? (
                <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
                  <Spinner size="lg" />
                  <p className="text-default-500">Indexing grapheme clusters...</p>
                </div>
              ) : (
                <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
                  {/* Main Consonants */}
                  <section>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {consonantsGrid.flat().map(
                        (c, i) =>
                          c && (
                            <div key={i}>
                              <ConsonantBlock consonant={c} index={graphemeIndex.index} onClick={handleCellClick} />
                            </div>
                          ),
                      )}
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
                          <ConsonantBlock consonant={c} index={graphemeIndex.index} onClick={handleCellClick} />
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
                        const count = graphemeIndex.index.get(char)?.length ?? 0

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
