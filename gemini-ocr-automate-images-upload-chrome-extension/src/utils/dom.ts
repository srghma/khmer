export const assert_isConstructor_curried = // wont work
  <T>(constructor: new (...args: unknown[]) => T) =>
    (element: unknown): asserts element is T => {
      if (element instanceof constructor) return
      throw new Error(`Expected an ${constructor.name}, but got something else.`)
    }

export const isConstructor_curried = // wont work
  <T>(constructor: new (...args: unknown[]) => T) =>
    (el: unknown): el is T =>
      el instanceof constructor

export const toConstructor_orThrow_curried =
  <T>(constructor: new (...args: unknown[]) => T) =>
    (el: unknown): T => {
      if (el instanceof constructor) return el
      throw new Error(`Expected an ${constructor.name}, but got something else.`)
    }

export function assert_isConstructor<T>(
  constructor: new (...args: unknown[]) => T,
  element: unknown,
): asserts element is T {
  if (element instanceof constructor) return
  throw new Error(`Expected an ${constructor.name}, but got something else.`)
}

export function toConstructor_orThrow<T>(
  constructor: new (...args: unknown[]) => T,
  el: unknown,
): T {
  if (el instanceof constructor) return el
  throw new Error(`Expected an ${constructor.name}, but got something else.`)
}

// export const assert_isHTMLElement: (element: unknown) => asserts element is HTMLElement = assert_isConstructor_curried(HTMLElement)
// export const toHTMLElement_orThrow = toConstructor_orThrow_curried(HTMLElement)

// export const assert_isHTMLIFrameElement = assert_isConstructor_curried(HTMLIFrameElement)
// export const toHTMLIFrameElement_orThrow = toConstructor_orThrow_curried(HTMLIFrameElement)

// export const isHTMLInputElement = isConstructor_curried(HTMLInputElement)
// export const assert_isHTMLInputElement = assert_isConstructor_curried(HTMLInputElement)
// export const toHTMLInputElement_orThrow = toConstructor_orThrow_curried(HTMLInputElement)

// export const isHTMLTextAreaElement = isConstructor_curried(HTMLTextAreaElement)
// export const assert_isHTMLTextAreaElement = assert_isConstructor_curried(HTMLTextAreaElement)
// export const toHTMLTextAreaElement_orThrow = toConstructor_orThrow_curried(HTMLTextAreaElement)

export function elementOrNullabel_is_visible(el: Element | null | undefined): boolean {
  if (!el) return false
  if (!(el instanceof HTMLElement)) return false
  return htmlElement_is_visible(el)
}

export function htmlElement_is_visible(el: HTMLElement): boolean {
  if (el.tagName.toLowerCase() === 'input' && (el as HTMLInputElement).type === 'hidden') return false

  const style = window.getComputedStyle(el)
  if (style.display === 'none') return false
  if (style.visibility === 'hidden') return false
  if (style.opacity === '0') return false

  // If the element takes up no space, it's effectively invisible
  const rect = el.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false

  return true
}

export const unlessUndefined_use = <X, Y>(x: X | null | undefined, to: (x: X) => NonNullable<Y>): Y | undefined =>
  x ? to(x) : undefined
