interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function Loading({ size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`
        ${sizeClasses[size]}
        border-4 border-gray-200 border-t-blue-600
        rounded-full animate-spin
      `} />
      {text && (
        <p className="mt-4 text-sm text-gray-600">{text}</p>
      )}
    </div>
  )
}
