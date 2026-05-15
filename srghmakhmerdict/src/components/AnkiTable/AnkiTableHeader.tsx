import React from 'react'
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
} from 'react-icons/io5'
import { Button } from '@heroui/button'
import { useAnkiTable } from './AnkiTableContext'
import { cn } from '@heroui/theme'
import { type SortMode } from './types'

interface Props {
  allPos: string[]
  onBack: () => void
}

export const AnkiTableHeader: React.FC<Props> = ({ allPos, onBack }) => {
  const {
    state,
    toggleShowDue,
    toggleShowNew,
    toggleShowNotDue,
    setSortMode,
    togglePos,
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

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY !== 0) {
      const container = e.currentTarget as HTMLElement

      container.scrollLeft += e.deltaY
    }
  }

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
                    onClick={isPlaying ? pause : play}
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
                    onClick={() => setIsRepeatQueue(!isRepeatQueue)}
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
              {(['index', 'due'] as SortMode[]).map(mode => (
                <Button
                  key={mode}
                  isIconOnly
                  className={cn(
                    'h-9 w-9 md:h-7 md:w-7 min-w-0 rounded-full transition-all',
                    state.sortMode === mode ? 'bg-background text-primary shadow-sm' : 'text-default-400',
                  )}
                  size="sm"
                  variant="light"
                  onClick={() => setSortMode(mode)}
                >
                  {mode === 'index' ? <ListOrdered size={16} /> : <Clock size={16} />}
                </Button>
              ))}
            </div>

            <div className="h-5 w-[1px] bg-default-200" />

            {/* POS Toggles */}
            <div className="flex items-center gap-1 py-1 pr-8">
              {allPos.map(pos => {
                const isDisabled = state.disabledPos.includes(pos)

                return (
                  <Button
                    key={pos}
                    className={cn(
                      'h-9 md:h-7 min-w-fit px-3 md:px-2.5 text-[10px] md:text-[9px] font-bold uppercase transition-all whitespace-nowrap rounded-full border',
                      !isDisabled
                        ? 'bg-primary/10 border-primary/20 text-primary shadow-sm'
                        : 'bg-transparent border-default-200 text-default-400 line-through opacity-50',
                    )}
                    size="sm"
                    variant="bordered"
                    onClick={() => togglePos(pos)}
                  >
                    {pos}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
