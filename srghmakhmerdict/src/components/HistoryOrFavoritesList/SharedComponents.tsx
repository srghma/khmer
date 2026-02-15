import React from 'react'
import { FaRegTrashAlt } from 'react-icons/fa'
import { useI18nContext } from '../../i18n/i18n-react-custom'

export const TrashIcon = React.memo(() => (
  <div className="absolute inset-0 bg-danger flex items-center justify-end px-6">
    <FaRegTrashAlt className="w-6 h-6 text-white" />
  </div>
))
TrashIcon.displayName = 'TrashIcon'

export const ChevronIcon = React.memo(() => (
  <div className="text-default-300 ml-2 shrink-0">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    </svg>
  </div>
))
ChevronIcon.displayName = 'ChevronIcon'

export const LoadingState = React.memo(() => {
  const { LL } = useI18nContext()

  return (
    <div className="flex-1 flex items-center justify-center p-4 h-40">
      <span className="text-sm uppercase tracking-wider text-default-400 animate-pulse">{LL.COMMON.LOADING()}</span>
    </div>
  )
})
LoadingState.displayName = 'LoadingState'

export const EmptyState = React.memo(({ type }: { type: 'history' | 'favorites' }) => {
  const { LL } = useI18nContext()

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-default-300 gap-2 min-h-[200px]">
      <span className="text-4xl opacity-50">{type === 'history' ? '🕒' : '⭐'}</span>
      <p>{LL.COMMON.NO_ITEMS_FOUND()}</p>
    </div>
  )
})
EmptyState.displayName = 'EmptyState'
