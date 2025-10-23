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
    menu_members: false,  // 회원은 회원관리 접근 불가
    menu_classes: false,   // 회원은 수업 접근 불가
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
  menu_dashboard: '일정',
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
    // 강사는 담당 회원만 (instructor_members 테이블 조인 필요)
    return {
      instructor_id: userPhone,
    };
  }

  if (role === 'member') {
    // 회원은 본인 것만
    return {
      member_id: userPhone,
    };
  }

  return {};
}

// 강사가 특정 회원을 담당하는지 체크
export async function isInstructorOfMember(
  instructorPhone: string, 
  memberPhone: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/instructor_members?instructor_id=eq.${instructorPhone}&member_id=eq.${memberPhone}`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        }
      }
    );
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error('담당 회원 체크 오류:', error);
    return false;
  }
}

// 회원의 잔여 회원권 체크
export async function checkMemberHasPasses(memberPhone: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/check_member_has_passes`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ member_phone: memberPhone })
      }
    );
    const hasPass = await response.json();
    return hasPass === true;
  } catch (error) {
    console.error('회원권 체크 오류:', error);
    return false;
  }
}
