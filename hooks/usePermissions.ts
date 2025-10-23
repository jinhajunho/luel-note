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

  // 회원의 경우 회원권 체크
  useEffect(() => {
    if (isMember && profile?.phone) {
      checkMemberPass();
    }
  }, [isMember, profile?.phone]);

  const checkMemberPass = async () => {
    if (!profile?.phone) return;

    setCheckingPass(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/check_member_has_passes`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ member_phone: profile.phone })
        }
      );
      const hasPass = await response.json();
      setHasMemberPass(hasPass === true);
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
    if (isMember && (menuKey === 'members' || menuKey === 'classes')) {
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
    checkAttendance: isAdmin || isInstructor || isMember,
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
    hasMemberPass,
    checkingPass,
    canAccessMenu,
    can,
  };
}
