import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

export type MenuKey = 
  | 'dashboard'
  | 'attendance'
  | 'members'
  | 'classes'
  | 'settlements'
  | 'settings';

export function usePermissions() {
  const { profile, permissions } = useAuth();
  const [hasMemberPass, setHasMemberPass] = useState<boolean>(true);
  const [checkingPass, setCheckingPass] = useState<boolean>(false);

  // 역할 체크
  const isAdmin = profile?.role === 'admin';
  const isInstructor = profile?.role === 'instructor';
  const isMember = profile?.role === 'member';
  const isGuest = profile?.role === 'guest';

  // 회원의 경우 회원권 체크
  useEffect(() => {
    if (isMember && profile?.id) {
      checkMemberPass();
    }
  }, [isMember, profile?.id]);

  const checkMemberPass = async () => {
    if (!profile?.id) return;

    setCheckingPass(true);
    try {
      const response = await fetch(`/api/member/${profile.id}/has-pass`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Failed to load pass status: ${response.status}`);
      }
      const data: { hasPass?: boolean } = await response.json();
      setHasMemberPass(data.hasPass ?? false);
    } catch (error) {
      console.error('회원권 체크 오류:', error);
      setHasMemberPass(false);
    } finally {
      setCheckingPass(false);
    }
  };

  // 메뉴 접근 권한 체크
  const canAccessMenu = (menuKey: MenuKey): boolean => {
    if (!profile || !permissions) return false;

    // 회원이고 회원권이 없으면 모든 메뉴 접근 불가
    if (isMember && !hasMemberPass) {
      return false;
    }

    // admin은 항상 모든 메뉴 접근 가능
    if (isAdmin) return true;

    // 회원은 회원관리, 수업 메뉴 접근 불가
    if ((isMember || isGuest) && (menuKey === 'members' || menuKey === 'classes')) {
      return false;
    }

    // 메뉴별 권한 체크
    const permissionKey = `menu_${menuKey}` as keyof typeof permissions;
    return permissions[permissionKey] === true;
  };

  // 특정 기능 권한 체크
  const can = {
    // 회원 관리
    createMember: isAdmin || isInstructor,
    updateMember: isAdmin || isInstructor,
    deleteMember: isAdmin,
    
    // 수업 관리
    createClass: isAdmin || isInstructor,
    updateClass: isAdmin || isInstructor,
    deleteClass: isAdmin || isInstructor,
    
    // 출석 관리
    checkAttendance: isAdmin || isInstructor || isMember || isGuest,
    updateAttendance: isAdmin || isInstructor,
    deleteAttendance: isAdmin || isInstructor,
    
    // 정산 관리
    viewAllSettlements: isAdmin,
    viewOwnSettlement: isAdmin || isInstructor,
    createSettlement: isAdmin,
    updateSettlement: isAdmin,
    deleteSettlement: isAdmin,
    
    // 설정
    viewSettings: true, // 모두 프로필은 볼 수 있음
    updateSystemSettings: isAdmin,
    managePermissions: isAdmin,
    manageClassTypes: isAdmin || isInstructor,
    managePaymentTypes: isAdmin || isInstructor,
  };

  return {
    profile,
    permissions,
    isAdmin,
    isInstructor,
    isMember,
    isGuest,
    hasMemberPass,
    checkingPass,
    canAccessMenu,
    can,
  };
}
