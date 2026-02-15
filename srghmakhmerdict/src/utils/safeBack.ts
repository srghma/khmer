export const safeBack = (setLocation: (to: string) => void) => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    setLocation('/')
  }
}
