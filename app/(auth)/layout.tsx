export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFFEF5] relative overflow-hidden">
      {/* 노트북 라인 배경 */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            transparent,
            transparent 31px,
            #E5C8A8 31px,
            #E5C8A8 32px
          )`,
        }}
      />

      {/* 왼쪽 빨간 세로줄 */}
      <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-red-400/40" />

      {/* 컨텐츠 */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        {children}
      </div>
    </div>
  );
}