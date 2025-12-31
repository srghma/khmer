import { element_to_HTMLElement_orThrow, unlessUndefined_use } from '../utils/dom'

export type RunButtonState =
  | 'stop_button__disabled_bc_maybe_running'
  | 'stop_button__ready'
  | 'run_button__disabled_bc_maybe_running_or_nothing_to_submit'
  | 'run_button__ready'
  | 'unknown'

export const dom_runButton = (): HTMLElement | undefined =>
  unlessUndefined_use(document.querySelector('ms-run-button button'), element_to_HTMLElement_orThrow)

export function dom_runButtonToState(btn: HTMLElement): RunButtonState {
  const isDisabled = btn.getAttribute('aria-disabled') === 'true'
  const text = btn.textContent?.toLowerCase() ?? ''
  const isStop = text.includes('stop') || text.includes('cancel')
  const isRun = text.includes('run')
  if (isStop && isDisabled) return 'stop_button__disabled_bc_maybe_running'
  if (isStop && !isDisabled) return 'stop_button__ready'
  if (isRun && isDisabled) return 'run_button__disabled_bc_maybe_running_or_nothing_to_submit'
  if (isRun && !isDisabled) return 'run_button__ready'
  return 'unknown'
}

export const dom_runButtonState = (): RunButtonState | undefined =>
  unlessUndefined_use(dom_runButton(), dom_runButtonToState)

export const dom_runButtonWithState = (): { runBtn: HTMLElement; runBtnState: RunButtonState } | undefined => {
  const runBtn = dom_runButton()
  if (!runBtn) return
  return { runBtn, runBtnState: dom_runButtonToState(runBtn) }
}
