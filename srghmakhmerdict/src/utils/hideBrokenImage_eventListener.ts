export const hideBrokenImage_eventListener = (event: Event) => {
  // console.log('hideBrokenImage_eventListener', event)

  const target = event.target as HTMLElement

  if (target.tagName.toUpperCase() === 'IMG') {
    target.style.display = 'none'
  }
}
