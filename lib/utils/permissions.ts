type Role = 'admin' | 'instructor' | 'member';

// 역할별 기본 권한 정의
export const DEFAULT_PERMISSIONS = {
  admin: {
    menu_dashboard: true,
    menu_attendance: true,
    menu_members: true,
    menu_classes: true,
    menu_settlements: true,
    menu_settings: true,
  },
  instructor: {
    menu_dashboard: true,
    menu_attendance: true,
    menu_members: true,
    menu_classes: true,
    menu_settlements: true,
    menu_settings: true,
  },
  member: {
    menu_dashboard: true,
    menu_attendance: true,
    menu_members: false,
    menu_classes: true,
    menu_settlements: false,
    menu_settings: true,
  },
};

// 역할별 설명
export const ROLE_LABELS: Record<Role, string> = {
  admin: '관리자',
  instructor: '강사',
  member: '회원',
};

// 메뉴 설명
export const MENU_LABELS = {
  menu_dashboard: '대시보드',
  menu_attendance: '출석 관리',
  menu_members: '회원 관리',
  menu_classes: '수업 관리',
  menu_settlements: '정산 관리',
  menu_settings: '설정',
};

// 역할에 따른 데이터 필터 조건 생성
export function getDataFilter(role: Role, userPhone: string) {
  if (role === 'admin') {
    return {}; // admin은 필터 없음 (모든 데이터)
  }

  if (role === 'instructor') {
    return {
      instructor_id: userPhone, // 강사 본인 것만
    };
  }

  if (role === 'member') {
    return {
      member_id: userPhone, // 회원 본인 것만
    };
  }

  return {};
}