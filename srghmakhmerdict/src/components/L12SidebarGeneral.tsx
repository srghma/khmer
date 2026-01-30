import React, { useMemo } from 'react'
import type { ProcessDataOutput } from '../utils/toGroup'
import type { Char } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char'
import { NavButton, SidebarHeader, sidebarClass } from './SidebarCommon'
import type { CharUppercaseCyrillic } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-cyrillic'
import type { CharUppercaseLatin } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/char-uppercase-latin'

interface L12SidebarGeneralProps<UC extends Char> {
  data: ProcessDataOutput<UC>
  activeL1: UC | '*'
  scrollToLetter: (char: UC | '*') => void
  scrollToSubGroup: (char: UC) => void
}

function L12SidebarGeneralImpl<UC extends CharUppercaseLatin | CharUppercaseCyrillic>({
  data,
  activeL1,
  scrollToLetter,
  scrollToSubGroup,
}: L12SidebarGeneralProps<UC>) {
  const l1NavItems = useMemo(() => {
    const items: (UC | '*')[] = data.groups.map(g => g.letter)

    if (data.other.length > 0) items.push('*')

    return items
  }, [data])

  const l2NavItems = useMemo(() => {
    if (activeL1 === '*') return []
    const group = data.groups.find(g => g.letter === activeL1)

    return group ? group.subGroups.map(sg => sg.letter) : []
  }, [data, activeL1])

  return (
    <>
      <div className={`${sidebarClass} border-l pb-[calc(1rem+env(safe-area-inset-bottom))]`}>
        <SidebarHeader>1st</SidebarHeader>
        {l1NavItems.map(l => (
          <NavButton key={l} active={l === activeL1} label={l} onClick={() => scrollToLetter(l)} />
        ))}
      </div>

      <div className={`${sidebarClass} border-l pb-[calc(1rem+env(safe-area-inset-bottom))]`}>
        <SidebarHeader>2nd</SidebarHeader>
        {l2NavItems.map(l => (
          <NavButton key={l} active={false} label={l} onClick={() => scrollToSubGroup(l)} />
        ))}
      </div>
    </>
  )
}

// React.memo with generic type cast
export const L12SidebarGeneral = React.memo(L12SidebarGeneralImpl) as typeof L12SidebarGeneralImpl
