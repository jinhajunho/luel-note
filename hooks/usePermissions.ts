import { useAuth } from '@/lib/auth-context';

export type MenuKey = 
  | 'dashboard'
  | 'attendance'
  | 'members'
  | 'classes'
  | 'settlements'
  | 'settings';

export function usePermissions() {
  const { profile, permissions } = useAuth();

  // 역할 체크
  const isAdmin = profile?.role === 'admin';
  const isInstructor = profile?.role === 'instructor';
  const isMember = profile?.role === 'member';

  // 메뉴 접근 권한 체크
  const canAccessMenu = (menuKey: MenuKey): boolean => {
    if (!profile || !permissions) return false;

    // admin은 항상 모든 메뉴 접근 가능
    if (isAdmin) return true;

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
    canAccessMenu,
    can,
  };
}