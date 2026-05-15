const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__

export async function listen<T>(event: string, handler: (payload: T) => void) {
  if (isTauri) {
    const { listen: tauriListen } = await import('@tauri-apps/api/event')

    return tauriListen<T>(event, (evt: any) => handler(evt.payload))
  }

  return () => {} // Mock unlisten
}
