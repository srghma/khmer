import React, { useCallback } from 'react'
import {
  IoListOutline as ListOrdered,
  IoTimeOutline as Clock,
  IoChevronBack as ChevronLeft,
  IoEyeOutline as Eye,
  IoEyeOffOutline as EyeOff,
  IoPlay as Play,
  IoPause as Pause,
  IoPlayBack as SkipBack,
  IoPlayForward as SkipForward,
  IoClose as X,
  IoRepeat as Repeat,
  IoChatbubbleEllipsesOutline as Chat,
  IoSearchOutline as SearchIcon,
  IoFilterOutline as FilterIcon,
} from 'react-icons/io5'
import { Button } from '@heroui/button'
import { useAnkiTable } from './AnkiTableContext'
import { useOnline } from '../../hooks/useOnline'
import { cn } from '@heroui/theme'

interface Props {
  onBack: () => void
  onSearchClick: () => void
  onPosConfigClick: () => void
}

export const AnkiTableHeader: React.FC<Props> = React.memo(({ onBack, onSearchClick, onPosConfigClick }) => {
  const {
    state,
    toggleShowDue,
    toggleShowNew,
    toggleShowNotDue,
    setSortMode,
    toggleFront,
    toggleBack,
    toggleInfo,
    toggleAudioModeOpus,
    toggleAudioModeGoogle,
    toggleAudioModeNative,
    toggleShowShortDefinitionOnSelect,
    audio,
  } = useAnkiTable()
  const {
    queue,
    currentTrack,
    isPlaying,
    isRepeatQueue,
    setIsRepeatQueue,
    currentIndex,
    play,
    pause,
    next,
    prev,
    clearQueue,
  } = audio

  const isOnline = useOnline()
  const isOffline = !isOnline

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.deltaY !== 0) {
      const container = e.currentTarget as HTMLElement

      container.scrollLeft += e.deltaY
    }
  }, [])

  const handleToggleRepeat = useCallback(() => setIsRepeatQueue(!isRepeatQueue), [isRepeatQueue, setIsRepeatQueue])
  const handlePlayPause = useCallback(() => (isPlaying ? pause() : play()), [isPlaying, pause, play])

  const setSortModeIndex = useCallback(() => setSortMode('index'), [setSortMode])
  const setSortModeDue = useCallback(() => setSortMode('due'), [setSortMode])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-full items-center justify-between px-3 gap-2">
        {/* Left: Back Button */}
        <div className="flex items-center shrink-0">
          <Button isIconOnly className="h-8 w-8 min-w-0" size="sm" variant="light" onClick={onBack}>
            <ChevronLeft size={18} />
          </Button>
        </div>

        {/* Right: Audio & Table Controls */}
        <div
          className="flex min-w-0 flex-1 items-center justify-start md:justify-end gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-2"
          onWheel={handleWheel}
        >
          <div className="flex items-center gap-1.5 shrink-0 px-2">
            {queue.length > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-default-100/50 border border-default-200 min-w-0">
                <div className="flex items-center gap-0.5">
                  <Button isIconOnly className="h-7 w-7 min-w-0" size="sm" variant="light" onClick={prev}>
                    <SkipBack size={14} />
                  </Button>
                  <Button
                    isIconOnly
                    className="h-8 w-8 min-w-0 rounded-full"
                    color="primary"
                    size="sm"
                    variant="flat"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play className="ml-0.5" size={16} />}
                  </Button>
                  <Button isIconOnly className="h-7 w-7 min-w-0" size="sm" variant="light" onClick={next}>
                    <SkipForward size={14} />
                  </Button>
                </div>

                <div className="hidden lg:flex flex-col min-w-0 max-w-[150px] px-1">
                  <span className="truncate text-[10px] font-bold text-primary leading-tight">
                    {currentTrack?.text || 'Playing...'}
                  </span>
                  <span className="text-[8px] font-mono text-default-400 leading-tight">
                    {currentIndex + 1} / {queue.length}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 ml-0.5">
                  <Button
                    isIconOnly
                    className={cn('h-7 w-7 min-w-0', isRepeatQueue ? 'text-primary' : 'text-default-400')}
                    size="sm"
                    variant="light"
                    onClick={handleToggleRepeat}
                  >
                    <Repeat size={14} />
                  </Button>
                  <Button
                    isIconOnly
                    className="h-7 w-7 min-w-0 text-default-400 hover:text-danger"
                    size="sm"
                    variant="light"
                    onClick={clearQueue}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            )}
            {/* Filters: Due/New/Wait */}
            <div className="flex items-center gap-0.5 rounded-full border bg-default-100/50 p-0.5">
              <Button
                className={cn(
                  'h-9 md:h-7 min-w-0 px-3 md:px-2.5 text-[10px] md:text-[9px] font-bold uppercase transition-all',
                  state.showDue ? 'bg-danger text-danger-foreground' : 'text-default-400',
                )}
                size="sm"
                variant={state.showDue ? 'solid' : 'light'}
                onClick={toggleShowDue}
              >
                Due
              </Button>
              <Button
                className={cn(
                  'h-9 md:h-7 min-w-0 px-3 md:px-2.5 text-[10px] md:text-[9px] font-bold uppercase transition-all',
                  state.showNew ? 'bg-primary text-primary-foreground' : 'text-default-400',
                )}
                size="sm"
                variant={state.showNew ? 'solid' : 'light'}
                onClick={toggleShowNew}
              >
                New
              </Button>
              <Button
                className={cn(
                  'h-9 md:h-7 min-w-0 px-3 md:px-2.5 text-[10px] md:text-[9px] font-bold uppercase transition-all',
                  state.showNotDue ? 'bg-warning text-warning-foreground' : 'text-default-400',
                )}
                size="sm"
                variant={state.showNotDue ? 'solid' : 'light'}
                onClick={toggleShowNotDue}
              >
                Wait
              </Button>
            </div>

            <div className="h-5 w-[1px] bg-default-200" />

            {/* Audio Modes */}
            <div className="flex items-center gap-0.5 rounded-full border bg-default-100/50 p-0.5">
              <span className="px-1.5 text-[8px] font-black text-default-400 uppercase tracking-widest hidden sm:inline">
                Audio
              </span>
              <Button
                className={cn(
                  'h-9 md:h-7 min-w-0 px-3 md:px-2 text-[10px] md:text-[9px] font-bold uppercase transition-all',
                  state.audioModeOpus ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-default-400',
                )}
                size="sm"
                variant={state.audioModeOpus ? 'solid' : 'light'}
                onClick={toggleAudioModeOpus}
              >
                Opus
              </Button>
              <Button
                className={cn(
                  'h-9 md:h-7 min-w-0 px-3 md:px-2 text-[10px] md:text-[9px] font-bold uppercase transition-all',
                  state.audioModeGoogle ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-default-400',
                )}
                isDisabled={isOffline}
                size="sm"
                variant={state.audioModeGoogle ? 'solid' : 'light'}
                onClick={toggleAudioModeGoogle}
              >
                Google
              </Button>
              <Button
                className={cn(
                  'h-9 md:h-7 min-w-0 px-3 md:px-2 text-[10px] md:text-[9px] font-bold uppercase transition-all',
                  state.audioModeNative ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-default-400',
                )}
                size="sm"
                variant={state.audioModeNative ? 'solid' : 'light'}
                onClick={toggleAudioModeNative}
              >
                Native
              </Button>
            </div>

            <div className="h-5 w-[1px] bg-default-200" />

            {/* Visibility Controls */}
            <div className="flex items-center gap-0.5 rounded-full border bg-default-100/50 p-0.5">
              {[
                { label: 'F', isHidden: state.hideFront, toggle: toggleFront },
                { label: 'B', isHidden: state.hideBack, toggle: toggleBack },
                { label: 'I', isHidden: state.hideInfo, toggle: toggleInfo },
              ].map(ctrl => (
                <Button
                  key={ctrl.label}
                  isIconOnly
                  className={cn(
                    'h-9 w-9 md:h-7 md:w-7 min-w-0 rounded-full transition-all',
                    !ctrl.isHidden ? 'bg-background text-primary shadow-sm' : 'text-default-400',
                  )}
                  size="sm"
                  variant="light"
                  onClick={ctrl.toggle}
                >
                  {ctrl.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              ))}
            </div>

            <div className="h-5 w-[1px] bg-default-200" />

            {/* Popup Toggle */}
            <div className="flex items-center gap-0.5 rounded-full border bg-default-100/50 p-0.5">
              <Button
                isIconOnly
                className={cn(
                  'h-9 w-9 md:h-7 md:w-7 min-w-0 rounded-full transition-all',
                  state.showShortDefinitionOnSelect ? 'bg-background text-primary shadow-sm' : 'text-default-400',
                )}
                size="sm"
                variant="light"
                onClick={toggleShowShortDefinitionOnSelect}
              >
                <Chat size={16} />
              </Button>
            </div>

            <div className="h-5 w-[1px] bg-default-200" />

            {/* Sorting */}
            <div className="flex items-center gap-0.5 rounded-full border bg-default-100/50 p-0.5">
              <Button
                isIconOnly
                className={cn(
                  'h-9 w-9 md:h-7 md:w-7 min-w-0 rounded-full transition-all',
                  state.sortMode === 'index' ? 'bg-background text-primary shadow-sm' : 'text-default-400',
                )}
                size="sm"
                variant="light"
                onClick={setSortModeIndex}
              >
                <ListOrdered size={16} />
              </Button>
              <Button
                isIconOnly
                className={cn(
                  'h-9 w-9 md:h-7 md:w-7 min-w-0 rounded-full transition-all',
                  state.sortMode === 'due' ? 'bg-background text-primary shadow-sm' : 'text-default-400',
                )}
                size="sm"
                variant="light"
                onClick={setSortModeDue}
              >
                <Clock size={16} />
              </Button>
            </div>

            <div className="h-5 w-[1px] bg-default-200" />

            {/* POS Config & Search Buttons */}
            <div className="flex items-center gap-0.5 rounded-full border bg-default-100/50 p-0.5 mr-4">
              <Button
                isIconOnly
                className="h-9 w-9 md:h-7 md:w-7 min-w-0 rounded-full transition-all text-default-400 hover:text-primary"
                size="sm"
                variant="light"
                onClick={onSearchClick}
              >
                <SearchIcon size={16} />
              </Button>
              <Button
                isIconOnly
                className="h-9 w-9 md:h-7 md:w-7 min-w-0 rounded-full transition-all text-default-400 hover:text-primary"
                size="sm"
                variant="light"
                onClick={onPosConfigClick}
              >
                <FilterIcon size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
})

AnkiTableHeader.displayName = 'AnkiTableHeader'
