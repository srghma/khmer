import React, { useCallback } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'
import { useAnkiTable } from './AnkiTableContext'
import { cn } from '@heroui/theme'
import { IoFilterOutline } from 'react-icons/io5'

interface Props {
  isOpen: boolean
  onClose: () => void
  allPos: string[]
  posCounts: Record<string, number>
}

interface PosButtonProps {
  pos: string
  count: number
  isSelected: boolean
  onToggle: (pos: string) => void
}

const PosButton: React.FC<PosButtonProps> = React.memo(({ pos, count, isSelected, onToggle }) => {
  const onClick = useCallback(() => onToggle(pos), [onToggle, pos])

  return (
    <Button
      className={cn(
        'h-7 px-2.5 text-[10px] font-bold uppercase rounded-full',
        !isSelected && 'opacity-50 line-through',
      )}
      color={isSelected ? 'primary' : 'default'}
      size="sm"
      variant={isSelected ? 'flat' : 'bordered'}
      onClick={onClick}
    >
      <span className="flex items-center gap-1.5">
        <span>{pos}</span>
        <span className="rounded-md bg-default-200/50 px-1 py-0.5 text-[8px] leading-none opacity-80">{count}</span>
      </span>
    </Button>
  )
})

PosButton.displayName = 'PosButton'

const PosGroup = React.memo(
  ({
    title,
    allPos,
    posCounts,
    disabledPos,
    setDisabledPos,
  }: {
    title: string
    allPos: string[]
    posCounts: Record<string, number>
    disabledPos: string[]
    setDisabledPos: (d: string[]) => void
  }) => {
    const isAllSelected = disabledPos.length === 0

    const handleToggleAll = useCallback(() => {
      if (isAllSelected) setDisabledPos(allPos)
      else setDisabledPos([])
    }, [isAllSelected, setDisabledPos, allPos])

    const handleTogglePos = useCallback(
      (pos: string) => {
        if (disabledPos.includes(pos)) {
          setDisabledPos(disabledPos.filter(p => p !== pos))
        } else {
          setDisabledPos([...disabledPos, pos])
        }
      },
      [disabledPos, setDisabledPos],
    )

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-sm font-bold uppercase tracking-wider">{title}</h4>
          <Button
            className="h-6 min-h-0 px-2 text-[10px]"
            color={isAllSelected ? 'primary' : 'default'}
            size="sm"
            variant="light"
            onClick={handleToggleAll}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 py-1">
          {allPos.map(pos => (
            <PosButton
              key={pos}
              count={posCounts[pos] || 0}
              isSelected={!disabledPos.includes(pos)}
              pos={pos}
              onToggle={handleTogglePos}
            />
          ))}
        </div>
      </div>
    )
  },
)

PosGroup.displayName = 'PosGroup'

export const PosConfigModal: React.FC<Props> = ({ isOpen, onClose, allPos, posCounts }) => {
  const { state, setDisabledPosDue, setDisabledPosNew, setDisabledPosWait } = useAnkiTable()

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: 'm-0 sm:m-4 h-[100dvh] max-h-none sm:h-auto sm:max-h-[90vh] w-screen max-w-none sm:w-auto sm:max-w-2xl rounded-none sm:rounded-large',
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 border-b bg-default-50/50 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <IoFilterOutline size={18} />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Part of Speech Configuration</h3>
        </ModalHeader>
        <ModalBody className="py-6 flex flex-col gap-6">
          <PosGroup
            allPos={allPos}
            disabledPos={state.disabledPosDue}
            posCounts={posCounts}
            setDisabledPos={setDisabledPosDue}
            title="Due Cards"
          />
          <PosGroup
            allPos={allPos}
            disabledPos={state.disabledPosNew}
            posCounts={posCounts}
            setDisabledPos={setDisabledPosNew}
            title="New Cards"
          />
          <PosGroup
            allPos={allPos}
            disabledPos={state.disabledPosWait}
            posCounts={posCounts}
            setDisabledPos={setDisabledPosWait}
            title="Wait Cards"
          />
        </ModalBody>
        <ModalFooter className="border-t bg-default-50/50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <Button color="primary" variant="flat" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
