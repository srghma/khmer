export const assert_element_is =
  <T>(constructor: new (...args: any[]) => T) =>
  (element: unknown): asserts element is T => {
    if (element instanceof constructor) return
    throw new Error(`Expected an ${constructor.name}, but got something else.`)
  }

export const mk_element_is =
  <T>(constructor: new (...args: any[]) => T) =>
  (el: unknown): el is T =>
    el instanceof constructor

export const mk_element_to_orThrow =
  <T>(assert_fn: (el: unknown) => asserts el is T) =>
  (el: unknown): T => {
    assert_fn(el)
    return el as T
  }

export const assert_element_is_HTMLElement = assert_element_is(HTMLElement)
export const element_to_HTMLElement_orThrow = mk_element_to_orThrow(assert_element_is_HTMLElement)

export const assert_element_is_HTMLIFrameElement = assert_element_is(HTMLIFrameElement)
export const element_to_HTMLIFrameElement_orThrow = mk_element_to_orThrow(assert_element_is_HTMLIFrameElement)

export const element_is_HTMLInputElement = mk_element_is(HTMLInputElement)
export const assert_element_is_HTMLInputElement = assert_element_is(HTMLInputElement)
export const element_to_HTMLInputElement_orThrow = mk_element_to_orThrow(assert_element_is_HTMLInputElement)

export const element_is_HTMLTextAreaElement = mk_element_is(HTMLTextAreaElement)
export const assert_element_is_HTMLTextAreaElement = assert_element_is(HTMLTextAreaElement)
export const element_to_HTMLTextAreaElement_orThrow = mk_element_to_orThrow(assert_element_is_HTMLTextAreaElement)

export function element_is_visible(el: Element | null | undefined): boolean {
  if (!el) return false
  if (!(el instanceof HTMLElement)) return false
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

export const unlessUndefined_use<X, Y>(x: X | null | undefined, to: (x: X) => NonNullable<Y>): Y | undefined => x ? to(x) : undefined
