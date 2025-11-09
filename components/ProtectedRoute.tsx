'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usePermissions, type MenuKey } from '@/hooks/usePermissions';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireMenu?: MenuKey;
  requireRole?: 'admin' | 'instructor' | 'member';
};

export default function ProtectedRoute({
  children,
  requireMenu,
  requireRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, canAccessMenu, isMember, hasMemberPass, checkingPass } = usePermissions();

  useEffect(() => {
    if (loading || checkingPass) return;

    // 로그인 안 되어 있으면 로그인 페이지로
    if (!user) {
      router.push('/login');
      return;
    }

    // 프로필 없으면 대기
    if (!profile) return;

    // 역할 체크
    if (requireRole && profile.role !== requireRole) {
      const fallback = profile.role === 'admin' ? '/admin/schedule' : profile.role === 'instructor' ? '/instructor/schedule' : '/member/schedule';
      router.push(fallback);
      return;
    }

    // 메뉴 권한 체크
    if (requireMenu && !canAccessMenu(requireMenu)) {
      const fallback = profile.role === 'admin' ? '/admin/schedule' : profile.role === 'instructor' ? '/instructor/schedule' : '/member/schedule';
      router.push(fallback);
      return;
    }
  }, [user, profile, loading, requireMenu, requireRole, router, canAccessMenu, checkingPass, hasMemberPass, isMember]);

  // 로딩 중이거나 권한 체크 중
  if (loading || !user || !profile || checkingPass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFEF5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 회원이고 회원권이 없으면 빈 화면 표시
  if (isMember && !hasMemberPass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFEF5]">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-2">회원권이 없습니다</p>
          <p className="text-sm text-gray-500">관리자에게 문의하세요</p>
        </div>
      </div>
    );
  }

  // 메뉴 권한 체크
  if (requireMenu && !canAccessMenu(requireMenu)) {
    return null;
  }

  // 역할 체크
  if (requireRole && profile.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}
