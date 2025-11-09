import { SkeletonBlock, SkeletonLine, SkeletonList } from '@/components/common/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 bg-white border-b border-[#f0ebe1] h-[50px]" />
      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <SkeletonBlock>
          <SkeletonLine width={80} height={12} />
          <SkeletonLine width={180} height={18} className="mt-2" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <SkeletonBlock key={i}>
                <SkeletonLine width={72} height={12} />
                <SkeletonLine width={64} height={28} className="mt-2" />
              </SkeletonBlock>
            ))}
          </div>
        </SkeletonBlock>

        <SkeletonBlock>
          <div className="flex items-center justify-between mb-4">
            <SkeletonLine width={120} height={18} />
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonLine key={i} height={24} />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </SkeletonBlock>

        <SkeletonList count={3} />
      </main>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#f0ebe1]" />
    </div>
  )
}



