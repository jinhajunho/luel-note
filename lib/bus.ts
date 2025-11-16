// Lightweight BroadcastChannel utility for cross-tab/page sync
export type AppBusEvent =
  | { type: 'attendance-updated'; payload?: { classId?: string; newStatus?: boolean | null } }
  | { type: 'class-updated'; payload?: { classId?: string } }
  | { type: 'notice-updated'; payload?: { id?: string } }
  | { type: 'notifications-updated'; payload?: { id?: string } }

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    __APP_BUS__?: BroadcastChannel
  }
}

export function getBus(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null
  // Browser support check
  if (!(window as any).BroadcastChannel) return null
  if (!window.__APP_BUS__) {
    try {
      window.__APP_BUS__ = new BroadcastChannel('app-bus')
    } catch {
      window.__APP_BUS__ = undefined
    }
  }
  return window.__APP_BUS__ ?? null
}

export function postBus(event: AppBusEvent) {
  try {
    const bus = getBus()
    if (bus) bus.postMessage(event)
  } catch {
    // no-op
  }
}


