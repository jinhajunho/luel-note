import React from 'react'

type LineProps = { width?: number | string; height?: number | string; className?: string }
export function SkeletonLine({ width = '100%', height = 12, className = '' }: LineProps) {
  const style = { width, height }
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} style={style as React.CSSProperties} />
}

type BlockProps = { className?: string; children?: React.ReactNode }
export function SkeletonBlock({ className = '', children }: BlockProps) {
  return <div className={`bg-white rounded-2xl p-4 shadow-sm border border-[#f0ebe1] ${className}`}>{children}</div>
}

export function SkeletonLessonCard() {
  return (
    <SkeletonBlock>
      <div className="flex items-center justify-between">
        <SkeletonLine width={96} height={20} />
        <SkeletonLine width={56} height={20} />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <SkeletonLine width={64} height={16} />
        <SkeletonLine width={80} height={16} />
        <SkeletonLine width={64} height={16} />
      </div>
      <div className="mt-2">
        <SkeletonLine width={180} height={12} />
      </div>
    </SkeletonBlock>
  )
}

type ListProps = { count?: number; renderItem?: (index: number) => React.ReactNode }
export function SkeletonList({ count = 3, renderItem }: ListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>{renderItem ? renderItem(i) : <SkeletonLessonCard />}</React.Fragment>
      ))}
    </div>
  )
}

const Skeleton = {
  SkeletonLine,
  SkeletonBlock,
  SkeletonLessonCard,
  SkeletonList,
}

export default Skeleton



