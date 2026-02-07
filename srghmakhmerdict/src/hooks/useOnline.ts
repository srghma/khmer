import { useSyncExternalStore } from 'react'

// 1. Define getSnapshot outside the component:
// It reads the current state from the external source.
function getOnlineStatusSnapshot() {
  return navigator.onLine
}

// 2. Define subscribe outside the component:
// It sets up listeners and calls the React-provided callback on change.
function subscribeToOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)

  // Return the cleanup function
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

// 3. Create the custom hook
export function useOnline() {
  const isOnline = useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatusSnapshot, () => true)

  return isOnline
}
