import { delay } from '../utils/delay'
import { element_to_HTMLElement_orThrow, element_to_HTMLIFrameElement_orThrow } from '../utils/dom'
import { mkLogger } from '../utils/log'

const log = mkLogger('aistudio' as const)

function isVisible(node: HTMLElement) {
  // 1. Check if it takes up space in the DOM (width/height > 0)
  // 2. Check if it isn't strictly hidden via CSS
  const style = window.getComputedStyle(node)
  return node.offsetWidth > 0 && node.offsetHeight > 0 && style.display !== 'none' && style.visibility !== 'hidden'
}

export const visibleDriveIframe = (): HTMLIFrameElement | undefined => {
  const iframes: HTMLIFrameElement[] = Array.from(document.querySelectorAll('iframe[src*="docs.google.com/picker"]'))
    .map(x => element_to_HTMLIFrameElement_orThrow(x))
    .filter(isVisible)

  if (iframes.length !== 0 && iframes.length !== 1) {
    console.error(iframes)
    throw new Error(`visibleDriveIframe: can be only 0 or 1, but got ${iframes.length}`)
  }

  return iframes[0]
}

export const isDriveIframeOpen = (): boolean => {
  return !!visibleDriveIframe()
}

export const getAiStudioState = () => {
  const uploadedFiles = Array.from(document.querySelectorAll('mat-chip-row, .file-chip')).map(
    el => el.textContent?.trim() || 'file',
  )

  return {
    uploadedFiles,
    isDriveIframeOpened: isDriveIframeOpen(),
    isGenerating: document.querySelector('ms-run-button button')?.getAttribute('aria-disabled') === 'true',
  }
}

export const openDriveIframe = async () => {
  if (isDriveIframeOpen()) {
    log('Drive picker is already open.')
    return
  }

  log('Attempting to open Drive Picker...')

  // 1. Click "Add Media" (+) button
  const addBtn = document.querySelector('[data-test-id="add-media-button"]')
  if (!addBtn) {
    log('Error: Add Media button not found.')
    return
  }

  const addBtnEl = element_to_HTMLElement_orThrow(addBtn)
  addBtnEl.click()

  // 2. Wait for Menu Animation
  await delay(600)

  // 3. Find and Click "Drive" option
  // We use the class from your snippet: .drive-file-menu-item
  let driveItem = document.querySelector('.drive-file-menu-item')

  if (!driveItem) {
    // Fallback search by text
    const menuItems = Array.from(document.querySelectorAll('.mat-mdc-menu-item'))
    driveItem = menuItems.find(el => el.textContent?.toLowerCase().includes('drive')) || null
  }

  if (driveItem) {
    const driveItemEl = element_to_HTMLElement_orThrow(driveItem)
    driveItemEl.click()
    log('Clicked Drive menu item.')
  } else {
    log('Error: Drive menu item not found.')
  }
}
