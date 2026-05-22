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
  setDisabledPosDue: (disabledPos: string[]) => void
  setDisabledPosNew: (disabledPos: string[]) => void
  setDisabledPosWait: (disabledPos: string[]) => void
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
      toggleFront: () =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideFront: !prev?.hideFront })),
      toggleBack: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideBack: !prev?.hideBack })),
      toggleInfo: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideInfo: !prev?.hideInfo })),
      setSortMode: (sortMode: AnkiTableSortMode) =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), sortMode })),
      toggleShowDue: () =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), showDue: !prev?.showDue })),
      toggleShowNew: () =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), showNew: !prev?.showNew })),
      toggleShowNotDue: () =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), showNotDue: !prev?.showNotDue })),
      setDisabledPosDue: (disabledPosDue: string[]) =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), disabledPosDue })),
      setDisabledPosNew: (disabledPosNew: string[]) =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), disabledPosNew })),
      setDisabledPosWait: (disabledPosWait: string[]) =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), disabledPosWait })),
      showAllFront: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideFront: false })),
      hideAllFront: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideFront: true })),
      showAllBack: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideBack: false })),
      hideAllBack: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideBack: true })),
      showAllInfo: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideInfo: false })),
      hideAllInfo: () => setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), hideInfo: true })),
      toggleAudioModeOpus: () =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), audioModeOpus: !prev?.audioModeOpus })),
      toggleAudioModeGoogle: () =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), audioModeGoogle: !prev?.audioModeGoogle })),
      toggleAudioModeNative: () =>
        setState(prev => ({ ...DEFAULT_ANKI_TABLE_STATE, ...(prev || {}), audioModeNative: !prev?.audioModeNative })),
      toggleShowShortDefinitionOnSelect: () =>
        setState(prev => ({
          ...DEFAULT_ANKI_TABLE_STATE,
          ...(prev || {}),
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
