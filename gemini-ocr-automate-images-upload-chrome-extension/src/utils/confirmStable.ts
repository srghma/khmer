// we do some action, it returns value (primitive)
// idea is to stabilize it by keeping last returned value
// it should not change at least nOfRetries times
// if changes - restart stabilization from beginning
// in end - return stabilized value

export async function confirmStable<T extends string | number | boolean>(
  ioAction: () => Promise<T>,
  {
    nOfRetries = 3,
    doesValueRequireConfirmation = () => true,
  }: {
    nOfRetries?: number
    doesValueRequireConfirmation?: (v: T) => boolean // e.g. only even values should stabilize OR only insuccessful scrolling downs
  } = {},
): Promise<T> {
  let lastValue: T | undefined = undefined
  let stableCount = 0

  while (true) {
    const currentValue = await ioAction()

    // Skip values that do NOT require confirmation
    if (!doesValueRequireConfirmation(currentValue)) {
      lastValue = currentValue
      stableCount = 0
      continue
    }

    if (currentValue === lastValue) {
      stableCount++
    } else {
      lastValue = currentValue
      stableCount = 1 // reset counter because value changed
    }

    if (stableCount >= nOfRetries) {
      return currentValue
    }
  }
}
