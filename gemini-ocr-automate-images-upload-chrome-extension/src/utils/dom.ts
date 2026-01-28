export function assert_element_is_HTMLElement(element: Element): asserts element is HTMLElement {
  if (element instanceof HTMLElement) return
  throw new Error('Expected an HTMLElement, but got something else.')
}

export function element_to_HTMLElement_orThrow(element: Element): HTMLElement {
  assert_element_is_HTMLElement(element)
  return element
}

export function assert_element_is_HTMLIFrameElement(element: Element): asserts element is HTMLIFrameElement {
  if (element instanceof HTMLIFrameElement) return
  throw new Error('Expected an HTMLIFrameElement, but got something else.')
}

export function element_to_HTMLIFrameElement_orThrow(element: Element): HTMLIFrameElement {
  assert_element_is_HTMLIFrameElement(element)
  return element
}

export function unlessUndefined_use<X, Y>(x: X | null | undefined, to: (x: X) => NonNullable<Y>): Y | undefined {
  return x ? to(x) : undefined
}
