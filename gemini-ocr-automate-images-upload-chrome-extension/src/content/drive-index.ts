import { AistudioToDriveIframe_SelectFilesSchema } from '../messages'
import { mkLogger } from '../utils/log'
import { selectManyFiles } from './drive'

const log = mkLogger('drive-index' as const)

// --- Destructor Pattern ---
function destructor() {
  document.removeEventListener(destructionEvent, destructor)
  window.removeEventListener('message', messageHandler)

  if (currentAbortController !== undefined) {
    currentAbortController.abort()
    currentAbortController = undefined
  }

  log('Previous Drive script unloaded')
}

const destructionEvent = `destructmyextension_${chrome.runtime.id}`
document.addEventListener(destructionEvent, destructor)

// --- State ---
let currentAbortController: AbortController | undefined

// --- Message Handler ---
function messageHandler(event: MessageEvent): void {
  console.log('drive message', event)
  // Only accept messages from AI Studio
  if (event.origin !== 'https://aistudio.google.com') return

  const msg_ = AistudioToDriveIframe_SelectFilesSchema.safeParse(event.data)
  if (!msg_.success) return
  const msg = msg_.data

  if (msg.type === 'SELECT_FILES') {
    // Abort any previous selection
    if (currentAbortController !== undefined) {
      log('Aborting previous selection')
      currentAbortController.abort()
    }

    // Start new selection
    currentAbortController = new AbortController()
    const { startPage, pageCount } = msg

    log(`Selecting up to ${pageCount} files starting from page ${startPage}...`)

    void selectManyFiles(startPage, pageCount, currentAbortController.signal)
      .then(result => {
        log('Selection completed:', result)

        // Send result back to AI Studio
        window.parent.postMessage(
          {
            type: 'SELECTION_RESULT',
            status: result.status,
            selectedPages: result.selectedPages,
            nextStartPage: result.nextStartPage,
          },
          'https://aistudio.google.com',
        )
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.message === 'ABORT') {
          log('Selection aborted')
        } else {
          log('Selection error:', error)
          // Send error result back
          window.parent.postMessage(
            {
              type: 'SELECTION_RESULT',
              status: 'no_files_found',
              selectedPages: [],
              nextStartPage: startPage,
            },
            'https://aistudio.google.com',
          )
        }
      })
      .finally(() => {
        currentAbortController = undefined
      })
  }
}

// --- Initialize ---
window.addEventListener('message', messageHandler)
log('Drive picker script initialized')
