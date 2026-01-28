import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { openDriveIframe, visibleDriveIframe } from './aistudio'
import { strOrNumberToNonNegativeIntOrThrow_strict } from '../utils/toNumber'
import { startNum_LocalStorageApi, pageCount_LocalStorageApi, useLocalStorageState } from '../storage'
import { useDraggable } from './useDraggable'
import { downloadAsTextFile } from '../utils/downloadAsTextFile'
import styles from 'inline:./aistudio-index.css'
import { assertNever } from '../utils/asserts'
import { useAIStudioScraper } from './useAIStudioScraper'
import { calculateGenerationStatus } from './calculateGenerationStatus'
import { mkLogger } from '../utils/log'
import { dom_runButton, dom_runButtonState, dom_runButtonToState } from './runButton'
import { DriveToAistudio_SelectionResultSchema } from '../messages'

const log = mkLogger('aistudio-index' as const)

// --- SELECTION RESULT TYPE ---
type FromDriveToAiStudio_SelectionResult = {
  status: 'success' | 'partial_success' | 'no_files_found'
  selectedPages: number[]
  nextStartPage: number
}

/**
 * DOM INTERACTORS
 */
function dom_runButton_ifReadyToRun_click(): boolean {
  const btn = dom_runButton()
  if (!btn) return false

  const state = dom_runButtonToState(btn)
  switch (state) {
    case 'stop_button__disabled_bc_maybe_running':
    case 'stop_button__ready':
    case 'run_button__disabled_bc_maybe_running_or_nothing_to_submit':
    case 'unknown':
      // Button not ready to click
      return false
    case 'run_button__ready':
      log('Action: Clicking Run...')
      btn.click()
      return true
    default:
      return assertNever(state)
  }
}

function dom_selectFilesInDrive(startPage: number, pageCount: number): boolean {
  const iframe = visibleDriveIframe()
  if (!iframe) return false
  if (iframe.contentWindow) {
    log(`Action: Requesting selection of ${pageCount} files starting from page ${startPage}`)
    iframe.contentWindow.postMessage({ type: 'SELECT_FILES', startPage, pageCount }, 'https://docs.google.com')
    return true
  }
  return false
}

function dom_checkRateLimit(): boolean {
  const container = document.querySelector('ms-autoscroll-container')
  if (!container) return false

  const turns = Array.from(container.querySelectorAll('ms-chat-turn'))
  const lastTenTurns = turns.slice(-10)

  for (const turn of lastTenTurns) {
    const text = turn.textContent?.toLowerCase() || ''
    if (text.includes('rate limit') || text.includes('try again later') || text.includes("you've reached your")) {
      return true
    }
  }

  return false
}

function dom_scrollToBottom_ifExists(): void {
  const el = document.querySelector('ms-autoscroll-container')
  if (!el) return
  el.scrollTop = el.scrollHeight
}

function dom_getLastModelMessageText(): string | undefined {
  const turns = Array.from(document.querySelectorAll('ms-chat-turn'))
  const modelTurns = turns.filter(turn => turn.querySelector('[data-turn-role="Model"]'))

  const lastTurn = modelTurns[modelTurns.length - 1]
  if (!lastTurn) return undefined

  const contentEl = lastTurn.querySelector('.turn-content')
  return contentEl?.textContent?.trim()
}

/**
 * AUTOMATION STATE MACHINE
 */
type AutomationState =
  | { type: 'IDLE' }
  | { type: 'PHASE_1_OPEN_DRIVE' }
  | { type: 'PHASE_2_WAIT_DRIVE_OPEN' }
  | { type: 'PHASE_3_SELECT_FILES' }
  | {
      type: 'PHASE_4_WAIT_FILES_UPLOADED'
      attempts: number
      lastAttemptTime: number
      expectedFileCount: number
    }
  | { type: 'PHASE_5_SUBMIT_RUN' }
  | { type: 'PHASE_6_WAIT_GENERATION_START' }
  | {
      type: 'PHASE_7_WAIT_GENERATION_END'
      lastText: string
      stabilityTicks: number
    }
  | {
      type: 'PHASE_8_EXPORT_AND_CLEANUP'
      selectionResult: FromDriveToAiStudio_SelectionResult
    }
  | { type: 'PHASE_9_COOLDOWN_NEXT_LOOP'; cooldownStart: number }
  | { type: 'ERROR_RATE_LIMITED' }
  | { type: 'COMPLETED_ALL_FILES'; message: string }

/**
 * React Component
 */
const AutomatorUI = ({ hostElement }: { hostElement: HTMLElement }) => {
  // --- Configuration ---
  const [startNum, setStartNum] = useLocalStorageState(startNum_LocalStorageApi)
  const [pageCount, setPageCount] = useLocalStorageState(pageCount_LocalStorageApi)

  // --- Scraped Data ---
  const { aistudio_isDriveOpen, aistudio_uploadedFilenames, aistudio_runButtonState } = useAIStudioScraper()

  // --- Automation State ---
  const [state, setState] = useState<AutomationState>({ type: 'IDLE' })

  // --- Selection result tracking ---
  const [lastSelectionResult, setLastSelectionResult] = useState<FromDriveToAiStudio_SelectionResult | undefined>(
    undefined,
  )

  // --- Dragging ---
  const { onMouseDown } = useDraggable(hostElement)

  // --- Listen for selection results from Drive iframe ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== 'https://docs.google.com') return
      const parseResult = DriveToAistudio_SelectionResultSchema.safeParse(event.data)
      if (!parseResult.success) {
        // console.error(
        //   'unknown event from drive, maybe aistudio and drive iframe just talk',
        //   event.data,
        //   // parseResult.error
        // )
        return
      }

      const result = parseResult.data
      log('Received selection result:', result)
      setLastSelectionResult(result)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // --- Main Loop ---
  useEffect(() => {
    if (state.type === 'IDLE' || state.type === 'ERROR_RATE_LIMITED' || state.type === 'COMPLETED_ALL_FILES') return

    const tickMachine = () => {
      console.log('Tick State:', state.type)

      // Auto-scroll for certain states
      const scrollStates: AutomationState['type'][] = [
        'PHASE_5_SUBMIT_RUN',
        'PHASE_6_WAIT_GENERATION_START',
        'PHASE_7_WAIT_GENERATION_END',
        'PHASE_8_EXPORT_AND_CLEANUP',
      ]
      if (scrollStates.includes(state.type)) dom_scrollToBottom_ifExists()

      switch (state.type) {
        case 'PHASE_1_OPEN_DRIVE': {
          log('State: Opening Drive...')
          if (aistudio_isDriveOpen) {
            setState({ type: 'PHASE_3_SELECT_FILES' })
          } else {
            openDriveIframe()
            setState({ type: 'PHASE_2_WAIT_DRIVE_OPEN' })
          }
          break
        }

        case 'PHASE_2_WAIT_DRIVE_OPEN': {
          log('State: Waiting for Drive to open...')
          if (aistudio_isDriveOpen) {
            setState({ type: 'PHASE_3_SELECT_FILES' })
          }
          break
        }

        case 'PHASE_3_SELECT_FILES': {
          log('State: Selecting Files via postMessage...')
          const success = dom_selectFilesInDrive(startNum, pageCount)
          if (success) {
            setLastSelectionResult(undefined) // Clear previous result
            setState({
              type: 'PHASE_4_WAIT_FILES_UPLOADED',
              attempts: 1,
              lastAttemptTime: Date.now(),
              expectedFileCount: pageCount,
            })
          } else {
            setState({ type: 'PHASE_2_WAIT_DRIVE_OPEN' })
          }
          break
        }

        case 'PHASE_4_WAIT_FILES_UPLOADED': {
          // Wait for selection result from Drive iframe
          if (lastSelectionResult) {
            const { status, selectedPages } = lastSelectionResult

            if (pageCount !== selectedPages.length) {
              console.error('pageCount !== selectedPages.length', pageCount, selectedPages)
            }

            log(`Selection complete: ${status}, got ${selectedPages.length} files`)

            if (status === 'no_files_found') {
              setState({
                type: 'COMPLETED_ALL_FILES',
                message: `No more files found starting from page ${startNum}. All done!`,
              })
            } else {
              // Wait for files to appear in UI
              if (aistudio_uploadedFilenames.size === pageCount && aistudio_runButtonState === 'run_button__ready') {
                setState({ type: 'PHASE_5_SUBMIT_RUN' })
              } else {
                // Still waiting for files to upload
                const now = Date.now()
                if (now - state.lastAttemptTime > 5000) {
                  log(`Still waiting for files to upload (${aistudio_uploadedFilenames.size}/${pageCount})...`)
                  setState({
                    ...state,
                    lastAttemptTime: now,
                  })
                }
              }
            }
          }
          break
        }

        case 'PHASE_5_SUBMIT_RUN': {
          if (pageCount !== aistudio_uploadedFilenames.size) {
            console.error('pageCount !== aistudio_uploadedFilenames.size', pageCount, aistudio_uploadedFilenames)
            throw new Error('pageCount !== aistudio_uploadedFilenames.size')
          }
          // TODO: check here aistudio_uploadedFilenames.size = aistudio_uploadedFilenames.size
          const clicked = dom_runButton_ifReadyToRun_click()
          if (clicked) {
            setState({ type: 'PHASE_6_WAIT_GENERATION_START' })
          }
          break
        }

        case 'PHASE_6_WAIT_GENERATION_START': {
          const btnState = dom_runButtonState()
          switch (btnState) {
            case undefined:
            case 'stop_button__disabled_bc_maybe_running':
            case 'stop_button__ready':
            case 'unknown':
              // still waiting
              break
            case 'run_button__disabled_bc_maybe_running_or_nothing_to_submit':
            case 'run_button__ready':
              setState({
                type: 'PHASE_7_WAIT_GENERATION_END',
                lastText: '',
                stabilityTicks: 0,
              })
              break
            default:
              assertNever(btnState)
          }
          break
        }

        case 'PHASE_7_WAIT_GENERATION_END': {
          // Check for rate limit
          if (dom_checkRateLimit()) {
            log('ERROR: Rate limit detected! Stopping automation.')
            setState({ type: 'ERROR_RATE_LIMITED' })
            return
          }

          const currentText = dom_getLastModelMessageText() || ''
          const btnState = aistudio_runButtonState // Use from hook, not dom_runButtonState()

          const { isFinished, nextTicks } = calculateGenerationStatus(
            currentText,
            state.lastText,
            state.stabilityTicks,
            btnState,
          )

          if (isFinished) {
            log('Generation Finished: Text stable & Button is not Stop.')
            if (lastSelectionResult) {
              setState({
                type: 'PHASE_8_EXPORT_AND_CLEANUP',
                selectionResult: lastSelectionResult,
              })
            } else {
              log('Warning: No selection result available')
              setState({ type: 'IDLE' })
            }
          } else {
            setState({
              ...state,
              lastText: currentText,
              stabilityTicks: nextTicks,
            })
          }
          break
        }

        case 'PHASE_8_EXPORT_AND_CLEANUP': {
          log('State: Exporting...')
          const text = dom_getLastModelMessageText()
          if (!text) {
            log('Error: No text found to export. Pausing loop.')
            setState({ type: 'IDLE' })
            return
          }

          navigator.clipboard
            .writeText(text)
            .then(() => console.log('clipboard: successfully copied'))
            .catch(() => {
              // console.error("clipboard: something went wrong")
            })

          const { selectedPages, nextStartPage, status } = state.selectionResult
          const filename = `ai-studio-output-${Math.min(...selectedPages)}-${Math.max(...selectedPages)}.txt`
          downloadAsTextFile(text, filename)

          // Update state for next loop
          setStartNum(strOrNumberToNonNegativeIntOrThrow_strict(nextStartPage))

          // Check if we should continue or stop
          if (status === 'partial_success') {
            setState({
              type: 'COMPLETED_ALL_FILES',
              message: `Only found ${selectedPages.length} of ${pageCount} requested files. All available files processed!`,
            })
          } else {
            setState({
              type: 'PHASE_9_COOLDOWN_NEXT_LOOP',
              cooldownStart: Date.now(),
            })
          }
          break
        }

        case 'PHASE_9_COOLDOWN_NEXT_LOOP': {
          const elapsed = Date.now() - state.cooldownStart
          const COOLDOWN_MS = 3000
          log(`State: Cooldown... ${Math.floor(elapsed / 1000)}s`)

          if (elapsed > COOLDOWN_MS) {
            setState({ type: 'PHASE_1_OPEN_DRIVE' })
          }
          break
        }

        default:
          assertNever(state)
      }
    }

    const timer = setInterval(tickMachine, 1000)
    return () => clearInterval(timer)
  }, [
    state,
    aistudio_isDriveOpen,
    aistudio_uploadedFilenames,
    aistudio_runButtonState,
    startNum,
    pageCount,
    setStartNum,
    lastSelectionResult,
  ])

  // --- Handlers ---

  const toggleLoop = () => {
    if (state.type === 'ERROR_RATE_LIMITED' || state.type === 'COMPLETED_ALL_FILES') {
      setState({ type: 'IDLE' })
    } else {
      setState(state.type === 'IDLE' ? { type: 'PHASE_1_OPEN_DRIVE' } : { type: 'IDLE' })
    }
  }

  const getStatusColor = () => {
    switch (state.type) {
      case 'IDLE':
        return '#94a3b8'
      case 'ERROR_RATE_LIMITED':
        return '#ef4444'
      case 'COMPLETED_ALL_FILES':
        return '#10b981'
      case 'PHASE_7_WAIT_GENERATION_END':
        return '#facc15'
      case 'PHASE_9_COOLDOWN_NEXT_LOOP':
        return '#60a5fa'
      case 'PHASE_4_WAIT_FILES_UPLOADED':
        return aistudio_uploadedFilenames.size === 0 ? '#fb923c' : '#4ade80'
      default:
        return '#4ade80'
    }
  }

  return (
    <div className="container">
      <div className="header" onMouseDown={onMouseDown}>
        <span>AI Auto-Looper</span>
      </div>

      <div className="content">
        <div className="status-box">
          <div style={{ color: getStatusColor(), fontWeight: 'bold' }}>
            Status: {state.type.replace('PHASE_', '').replace(/_/g, ' ')}
          </div>
          {state.type === 'ERROR_RATE_LIMITED' && (
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
              ⚠️ Rate limit detected! Wait and click START to resume.
            </div>
          )}
          {state.type === 'COMPLETED_ALL_FILES' && (
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>✅ {state.message}</div>
          )}
          <div style={{ fontSize: '10px', marginTop: '4px' }}>
            Monitoring: Drive {aistudio_isDriveOpen ? 'OPEN' : 'CLOSED'} | Files {aistudio_uploadedFilenames.size}{' '}
            uploaded | Run Btn: {aistudio_runButtonState}
            {state.type === 'PHASE_4_WAIT_FILES_UPLOADED' &&
              state.attempts > 1 &&
              ` | Retry attempts ${state.attempts}`}
          </div>
          {lastSelectionResult && (
            <div style={{ fontSize: '10px', color: '#8b5cf6', marginTop: '2px' }}>
              Last selection: {lastSelectionResult.status} | Pages: {lastSelectionResult.selectedPages.join(', ')} |
              Next: {lastSelectionResult.nextStartPage}
            </div>
          )}
          {state.type === 'PHASE_7_WAIT_GENERATION_END' && (
            <div style={{ fontSize: '10px', color: '#facc15' }}>
              Stability: {state.stabilityTicks}/2s | Button State: {aistudio_runButtonState}
            </div>
          )}
        </div>

        <div className="row">
          <label style={{ fontSize: '12px' }}>Next Start Page</label>
          <input
            className="input"
            type="number"
            value={startNum}
            disabled={
              state.type !== 'IDLE' && state.type !== 'ERROR_RATE_LIMITED' && state.type !== 'COMPLETED_ALL_FILES'
            }
            onChange={e => setStartNum(strOrNumberToNonNegativeIntOrThrow_strict(e.target.value || '0'))}
          />
        </div>

        <div className="row">
          <label style={{ fontSize: '12px' }}>Batch Size</label>
          <input
            className="input"
            type="number"
            value={pageCount}
            disabled={
              state.type !== 'IDLE' && state.type !== 'ERROR_RATE_LIMITED' && state.type !== 'COMPLETED_ALL_FILES'
            }
            onChange={e => setPageCount(strOrNumberToNonNegativeIntOrThrow_strict(e.target.value || '1'))}
          />
        </div>

        <button
          className="btn"
          style={{
            marginTop: '10px',
            backgroundColor:
              state.type === 'IDLE' || state.type === 'ERROR_RATE_LIMITED' || state.type === 'COMPLETED_ALL_FILES'
                ? '#2563eb'
                : '#dc2626',
            width: '100%',
            justifyContent: 'center',
          }}
          onClick={toggleLoop}
        >
          {state.type === 'IDLE' || state.type === 'ERROR_RATE_LIMITED' || state.type === 'COMPLETED_ALL_FILES'
            ? '▶ START LOOP'
            : '🛑 STOP LOOP'}
        </button>
      </div>
    </div>
  )
}

// --- Initialization Logic ---
void (() => {
  if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest())) return
  const ID = 'ai-studio-automator-root'
  const destructionEvent = `destructmyextension_${chrome.runtime.id}`
  const cleanup = () => {
    const e = document.getElementById(ID)
    if (e) e.remove()
  }
  document.addEventListener(destructionEvent, cleanup)
  const init = () => {
    const body = document.body
    if (!(body instanceof HTMLBodyElement)) {
      setTimeout(init, 500)
      return
    }
    const shadowHost = document.createElement('div')
    shadowHost.id = ID
    shadowHost.ariaHidden = 'false' // removes warning
    const shadow = shadowHost.attachShadow({ mode: 'open' })
    const styleEl = document.createElement('style')
    styleEl.textContent = styles
    shadow.appendChild(styleEl)
    const reactContainer = document.createElement('div')
    shadow.appendChild(reactContainer)
    createRoot(reactContainer).render(<AutomatorUI hostElement={shadowHost} />)
    body.appendChild(shadowHost)
    log('Injected.')
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
