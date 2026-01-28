import waitFor from 'p-wait-for'
import { delay } from '../utils/delay'
import { confirmStable } from '../utils/confirmStable'

export type TryConsumeResponse<Result, PartialResult> =
  | { t: 'i_consumed_all_im_full'; result: Result }
  | { t: 'i_want_more'; partialResult: PartialResult }

interface ScrollOptions<Result, PartialResult> {
  container: HTMLElement
  maxAttempts: number
  scrollStepDelay: number
  tryConsume: () => Promise<TryConsumeResponse<Result, PartialResult>>
}

export type ScrollAndProcessResponse<Result, PartialResult> =
  | { t: 'success'; result: Result }
  | {
      t: 'we_scrolled_to_buttom_but_still_want_more'
      partialResult: PartialResult
    }
  | { t: 'error_max_attempts_exceeded' }

export const doScroll = (container: HTMLElement, scrollStepDelay: number) => {
  let lastScrollHeight = 0

  return async (): Promise<boolean> => {
    // 2. Perform scroll
    container.scrollTop = container.scrollHeight

    // 3. Wait for the next render cycle / network load
    await delay(scrollStepDelay)

    const scrollingDownWasSuccessful = container.scrollHeight !== lastScrollHeight

    lastScrollHeight = container.scrollHeight

    return scrollingDownWasSuccessful
  }
}

/**
 * Generic utility to handle virtualized list scrolling
 */
export async function scrollAndProcess<Result, PartialResult>({
  container,
  maxAttempts,
  scrollStepDelay,
  tryConsume,
}: ScrollOptions<Result, PartialResult>): Promise<ScrollAndProcessResponse<Result, PartialResult>> {
  await waitFor(() => container.scrollHeight > 0, {
    timeout: scrollStepDelay * 5,
    interval: 50,
  })

  const scroll = doScroll(container, scrollStepDelay)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // 1. Run the item-processing logic
    const consumeResult = await tryConsume()

    if (consumeResult.t === 'i_consumed_all_im_full') return { t: 'success', result: consumeResult.result }

    const scrollingDownWasSuccessful = await confirmStable(() => scroll(), {
      nOfRetries: 3,
      doesValueRequireConfirmation: (scrollingDownWasSuccessful: boolean) => scrollingDownWasSuccessful === false,
    })

    // 4. Confirm bottom
    if (!scrollingDownWasSuccessful) {
      const consumeResult = await tryConsume()

      if (consumeResult.t === 'i_consumed_all_im_full') return { t: 'success', result: consumeResult.result }

      return {
        t: 'we_scrolled_to_buttom_but_still_want_more',
        partialResult: consumeResult.partialResult,
      }
    }
  }

  return { t: 'error_max_attempts_exceeded' }
}
