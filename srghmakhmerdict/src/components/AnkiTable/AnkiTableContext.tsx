import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useAnkiTableManager } from './useAnkiTableManager'
import { useAnkiTableAudioPlayer } from './useAnkiTableAudioPlayer'
import { type AnkiTableState, type AnkiTableManager, type AnkiTableAudioPlayer } from './types'
import { type AnkiTableSortMode, DEFAULT_ANKI_TABLE_STATE } from '../../providers/SettingsProvider'
import { useSettings } from '../../providers/SettingsProvider'

interface AnkiTableContextValue {
  anki: AnkiTableManager
  audio: AnkiTableAudioPlayer
  state: AnkiTableState
  currentTime: number
  toggleFront: () => void
  toggleBack: () => void
  toggleInfo: () => void
  setSortMode: (mode: AnkiTableSortMode) => void
  toggleShowDue: () => void
  toggleShowNew: () => void
  toggleShowNotDue: () => void
  togglePos: (pos: string) => void
  showAllFront: () => void
  hideAllFront: () => void
  showAllBack: () => void
  hideAllBack: () => void
  showAllInfo: () => void
  hideAllInfo: () => void
  toggleAudioModeOpus: () => void
  toggleAudioModeGoogle: () => void
  toggleAudioModeNative: () => void
  toggleShowShortDefinitionOnSelect: () => void
  onWiktionaryClick: (content: string) => void
}

const AnkiTableContext = createContext<AnkiTableContextValue | undefined>(undefined)

interface AnkiTableProviderProps {
  children: React.ReactNode
  onWiktionaryClick: (content: string) => void
  playGoogleTts?: (text: string) => Promise<void>
  playNativeTts?: (text: string) => Promise<void>
}

export const AnkiTableProvider: React.FC<AnkiTableProviderProps> = ({
  children,
  onWiktionaryClick,
  playGoogleTts,
  playNativeTts,
}) => {
  const { ankiTableState: state, setAnkiTableState: setState } = useSettings()
  const anki = useAnkiTableManager()
  const audio = useAnkiTableAudioPlayer(state, playGoogleTts, playNativeTts)

  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000)

    return () => clearInterval(interval)
  }, [])

  const ankiMemo = useMemo(() => anki, [anki])
  const audioMemo = useMemo(() => audio, [audio])

  const value = useMemo(
    () => ({
      anki: ankiMemo,
      audio: audioMemo,
      state,
      currentTime,
      toggleFront: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideFront: !prev?.hideFront })),
      toggleBack: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideBack: !prev?.hideBack })),
      toggleInfo: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideInfo: !prev?.hideInfo })),
      setSortMode: (sortMode: AnkiTableSortMode) =>
        setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), sortMode })),
      toggleShowDue: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), showDue: !prev?.showDue })),
      toggleShowNew: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), showNew: !prev?.showNew })),
      toggleShowNotDue: () =>
        setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), showNotDue: !prev?.showNotDue })),
      togglePos: (pos: string) =>
        setState(prev => {
          const p = prev || DEFAULT_ANKI_TABLE_STATE

          return {
            ...p,
            disabledPos: p.disabledPos.includes(pos) ? p.disabledPos.filter(x => x !== pos) : [...p.disabledPos, pos],
          }
        }),
      showAllFront: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideFront: false })),
      hideAllFront: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideFront: true })),
      showAllBack: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideBack: false })),
      hideAllBack: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideBack: true })),
      showAllInfo: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideInfo: false })),
      hideAllInfo: () => setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), hideInfo: true })),
      toggleAudioModeOpus: () =>
        setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), audioModeOpus: !prev?.audioModeOpus })),
      toggleAudioModeGoogle: () =>
        setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), audioModeGoogle: !prev?.audioModeGoogle })),
      toggleAudioModeNative: () =>
        setState(prev => ({ ...(prev || DEFAULT_ANKI_TABLE_STATE), audioModeNative: !prev?.audioModeNative })),
      toggleShowShortDefinitionOnSelect: () =>
        setState(prev => ({
          ...(prev || DEFAULT_ANKI_TABLE_STATE),
          showShortDefinitionOnSelect: !prev?.showShortDefinitionOnSelect,
        })),
      onWiktionaryClick,
    }),
    [ankiMemo, audioMemo, state, currentTime, setState, onWiktionaryClick],
  )

  return <AnkiTableContext.Provider value={value}>{children}</AnkiTableContext.Provider>
}

export const useAnkiTable = () => {
  const context = useContext(AnkiTableContext)

  if (!context) throw new Error('useAnkiTable must be used within AnkiTableProvider')

  return context
}
