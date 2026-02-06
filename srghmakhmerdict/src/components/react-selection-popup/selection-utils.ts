import { String_toNonEmptyString_orUndefined_afterTrim } from '@gemini-ocr-automate-images-upload-chrome-extension/utils/non-empty-string-trimmed'

export const isNodeInsideClass = (node: Node | null, className: string): boolean => {
  if (!node) return false
  const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)

  return !!element?.closest(`.${className}`)
}

export const isClickInside = (target: EventTarget | null, element: HTMLElement | null): boolean => {
  if (!target || !element || !(target instanceof Node)) return false

  return element.contains(target)
}

export const getValidSelection = (selectionClassName: string) => {
  if (typeof window === 'undefined') return undefined

  const selection = window.getSelection()

  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return undefined
  }

  const { anchorNode, focusNode } = selection

  if (
    !anchorNode ||
    !isNodeInsideClass(anchorNode, selectionClassName) ||
    !focusNode ||
    !isNodeInsideClass(focusNode, selectionClassName)
  ) {
    return undefined
  }

  const text = String_toNonEmptyString_orUndefined_afterTrim(selection.toString())

  if (!text) return undefined

  // We don't need rect for positioning per requirements (fixed initial),
  // but returning text is crucial.
  return { text }
}
