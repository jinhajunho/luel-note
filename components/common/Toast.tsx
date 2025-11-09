import { useEffect } from 'react'

type ToastProps = {
  message: string
  type?: 'info' | 'success' | 'error'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const color = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-900'

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[2000]">
      <div className={`${color} text-white text-sm px-4 py-2.5 rounded-lg shadow-lg`}>{message}</div>
    </div>
  )
}



