import { normalizePhone } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db/prisma'

type Role = 'admin' | 'instructor' | 'member' | 'guest';

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
  guest: {
    menu_dashboard: true,
    menu_attendance: true,
    menu_members: false,
    menu_classes: false,
    menu_settlements: false,
    menu_settings: true,
  },
};

// 역할별 설명
export const ROLE_LABELS: Record<Role, string> = {
  admin: '관리자',
  instructor: '강사',
  member: '회원',
  guest: '비회원',
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

  if (role === 'member' || role === 'guest') {
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
    const [instructor, member] = await Promise.all([
      prisma.profile.findUnique({
        where: { phone: normalizePhone(instructorPhone) },
        select: { id: true },
      }),
      prisma.profile.findUnique({
        where: { phone: normalizePhone(memberPhone) },
        select: { id: true },
      }),
    ])

    if (!instructor || !member) {
      return false
    }

    const assignment = await prisma.instructorMember.findFirst({
      where: {
        instructorId: instructor.id,
        member: {
          profileId: member.id,
        },
      },
      select: { id: true },
    })

    return Boolean(assignment)
  } catch (error) {
    console.error('담당 회원 체크 오류:', error)
    return false
  }
}

// 회원의 잔여 회원권 체크
export async function checkMemberHasPasses(memberPhone: string): Promise<boolean> {
  try {
    const member = await prisma.member.findUnique({
      where: { phone: normalizePhone(memberPhone) },
      select: { id: true },
    })

    if (!member) {
      return false
    }

    const count = await prisma.membershipPackage.count({
      where: {
        memberId: member.id,
        status: 'active',
        remainingLessons: { gt: 0 },
      },
    })

    return count > 0
  } catch (error) {
    console.error('회원권 체크 오류:', error)
    return false
  }
}
