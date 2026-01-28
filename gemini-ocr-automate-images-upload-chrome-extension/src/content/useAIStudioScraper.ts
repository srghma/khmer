import { useState, useEffect } from 'react'
import { isDriveIframeOpen } from './aistudio'
import { Set_eq, Set_mkOrThrowIfArrayIsNotUnique } from '../utils/sets'
import { dom_runButtonState, type RunButtonState } from './runButton'

export function dom_getUploadedFilenames(): Set<string> {
  const nameElements = document.querySelectorAll('ms-prompt-media .content-container .name')
  return Set_mkOrThrowIfArrayIsNotUnique(
    Array.from(nameElements)
      .map(el => el.getAttribute('title') || el.textContent?.trim() || '')
      .filter(Boolean),
  )
}

/**
 * HOOK: Monitor AI Studio UI State
 */
export const useAIStudioScraper = () => {
  const [isDriveOpen, setIsDriveOpen] = useState<boolean>(false)
  const [currentFiles, setCurrentFiles] = useState<Set<string>>(new Set())
  const [runButtonState, setRunButtonStatus] = useState<RunButtonState | undefined>()

  useEffect(() => {
    const tick = () => {
      // 1. Drive Status
      const newIsDriveOpen = isDriveIframeOpen()
      // React optimization: if value is identical to current state, no re-render occurs.
      setIsDriveOpen(newIsDriveOpen)

      // 2. Run Button Status
      setRunButtonStatus(dom_runButtonState())

      // 3. File Set (The Critical Optimization)
      const newFiles = dom_getUploadedFilenames()

      setCurrentFiles(prevFiles => {
        // Compare CONTENT. If content is same, return the OLD reference.
        // This prevents React from seeing a "change" and triggering a re-render.
        if (Set_eq(prevFiles, newFiles)) return prevFiles
        // Only return the new object if content is different
        return newFiles
      })
    }

    const interval = setInterval(tick, 500)
    tick()
    return () => clearInterval(interval)
  }, [])

  return {
    aistudio_isDriveOpen: isDriveOpen,
    aistudio_uploadedFilenames: currentFiles,
    aistudio_runButtonState: runButtonState,
  }
}
