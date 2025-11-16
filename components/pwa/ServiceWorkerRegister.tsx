"use client"

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('SW register failed', e)
      }
    }
    register()
  }, [])
  return null
}


