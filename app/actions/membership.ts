'use server'

import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/prisma'

// ==================== 타입 정의 ====================
export interface MembershipPackage {
  id: string
  member_id: string
  payment_type_id: string | null
  payment_type_name: string
  payment_type_color: string
  total_lessons: number
  remaining_lessons: number
  used_lessons: number
  start_date: string
  end_date: string | null
  status: 'active' | 'expired' | 'exhausted'
  created_at: string
}

export interface CreateMembershipInput {
  member_id: string
  payment_type_id: string | null
  total_lessons: number
  start_date: string
  end_date: string | null
}

function formatDate(value: Date | null | undefined, fallback: string | null = null) {
  if (!value) return fallback
  return value.toISOString().split('T')[0]
}

type MembershipWithPayment = {
  id: string
  memberId: string | null
  paymentTypeId: string | null
  paymentType?: {
    name?: string | null
    color?: string | null
  } | null
  totalLessons: number
  remainingLessons: number
  usedLessons: number
  startDate: Date
  endDate: Date | null
  status: string | null
  createdAt: Date | null
}

function mapMembership(pkg: MembershipWithPayment): MembershipPackage {
  return {
    id: pkg.id,
    member_id: pkg.memberId ?? '',
    payment_type_id: pkg.paymentTypeId ?? null,
    payment_type_name: pkg.paymentType?.name ?? '',
    payment_type_color: pkg.paymentType?.color ?? '',
    total_lessons: pkg.totalLessons,
    remaining_lessons: pkg.remainingLessons,
    used_lessons: pkg.usedLessons,
    start_date: formatDate(pkg.startDate) ?? '',
    end_date: formatDate(pkg.endDate),
    status: pkg.status as MembershipPackage['status'],
    created_at: (pkg.createdAt ?? new Date()).toISOString(),
  }
}

function mapPaymentType(paymentType: { id: string; name: string; color: string | null }) {
  return {
    id: paymentType.id,
    name: paymentType.name,
    color: paymentType.color ?? '',
  }
}

// ==================== 회원권 조회 ====================

/**
 * 회원의 모든 회원권 조회
 */
export async function getMemberPasses(memberId: string): Promise<MembershipPackage[]> {
  try {
    const packages = await prisma.membershipPackage.findMany({
      where: { memberId },
      include: {
        paymentType: {
          select: { name: true, color: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return packages.map((pkg) => mapMembership(pkg))
  } catch (error) {
    console.error('회원권 조회 실패:', error)
    return []
  }
}

/**
 * 회원의 총 잔여 횟수 조회
 */
export async function getMemberTotalRemaining(memberId: string): Promise<number> {
  try {
    const result = await prisma.membershipPackage.aggregate({
      where: {
        memberId,
        status: 'active',
      },
      _sum: {
        remainingLessons: true,
      },
    })

    return result._sum.remainingLessons ?? 0
  } catch (error) {
    console.error('잔여 횟수 조회 실패:', error)
    return 0
  }
}

/**
 * 회원이 회원권을 가지고 있는지 확인
 */
export async function checkMemberHasMembership(memberId: string): Promise<boolean> {
  try {
    const count = await prisma.membershipPackage.count({
      where: {
        memberId,
        status: 'active',
        remainingLessons: { gt: 0 },
      },
    })

    return count > 0
  } catch (error) {
    console.error('회원권 확인 실패:', error)
    return false
  }
}

/**
 * 특정 회원권 조회
 */
export async function getMembershipPackage(packageId: string): Promise<MembershipPackage | null> {
  try {
    const pkg = await prisma.membershipPackage.findUnique({
      where: { id: packageId },
      include: {
        paymentType: {
          select: { name: true, color: true },
        },
      },
    })

    if (!pkg) {
      return null
    }

    return mapMembership(pkg as MembershipWithPayment)
  } catch (error) {
    console.error('회원권 조회 실패:', error)
    return null
  }
}

// ==================== 회원권 생성 ====================

/**
 * 새 회원권 생성
 */
export async function createMembershipPackage(input: CreateMembershipInput) {
  try {
    const created = await prisma.membershipPackage.create({
      data: {
        memberId: input.member_id,
        paymentTypeId: input.payment_type_id,
        totalLessons: input.total_lessons,
        remainingLessons: input.total_lessons,
        usedLessons: 0,
        startDate: new Date(input.start_date),
        endDate: input.end_date ? new Date(input.end_date) : null,
        status: 'active',
      },
      include: {
        paymentType: {
          select: { name: true, color: true },
        },
      },
    })

    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')

    return { success: true, data: mapMembership(created as MembershipWithPayment) }
  } catch (error) {
    console.error('회원권 생성 실패:', error)
    return {
      success: false,
      error: `회원권 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    }
  }
}

// ==================== 회원권 수정 ====================

/**
 * 회원권 수정
 */
export async function updateMembershipPackage(
  packageId: string,
  updates: Partial<CreateMembershipInput>
) {
  try {
    const data: Record<string, unknown> = {}

    if (updates.payment_type_id !== undefined) {
      data.paymentTypeId = updates.payment_type_id
    }
    if (updates.total_lessons !== undefined) {
      data.totalLessons = updates.total_lessons
    }
    if (updates.start_date !== undefined) {
      data.startDate = updates.start_date ? new Date(updates.start_date) : null
    }
    if (updates.end_date !== undefined) {
      data.endDate = updates.end_date ? new Date(updates.end_date) : null
    }

    const updated = await prisma.membershipPackage.update({
      where: { id: packageId },
      data,
      include: {
        paymentType: {
          select: { name: true, color: true },
        },
      },
    })

    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')

    return { success: true, data: mapMembership(updated as MembershipWithPayment) }
  } catch (error) {
    console.error('회원권 수정 실패:', error)
    return { success: false, error: '회원권 수정에 실패했습니다' }
  }
}

// ==================== 회원권 삭제 ====================

/**
 * 회원권 삭제
 */
export async function deleteMembershipPackage(packageId: string) {
  try {
    await prisma.membershipPackage.delete({
      where: { id: packageId },
    })

    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')

    return { success: true }
  } catch (error) {
    console.error('회원권 삭제 실패:', error)
    return { success: false, error: '회원권 삭제에 실패했습니다' }
  }
}

// ==================== 회원권 차감 ====================

/**
 * 출석 시 회원권 차감
 */
export async function deductMembershipLesson(
  memberId: string,
  paymentTypeId: string
) {
  try {
    const packageId = await prisma.$transaction<string | null>(async (tx) => {
      const target = await tx.membershipPackage.findFirst({
        where: {
          memberId,
          paymentTypeId,
          status: 'active',
          remainingLessons: { gt: 0 },
        },
        orderBy: {
          startDate: 'asc',
        },
        select: { id: true },
      })

      if (!target) {
        return null
      }

      const updated = await tx.membershipPackage.updateMany({
        where: {
          id: target.id,
          remainingLessons: { gt: 0 },
        },
        data: {
          remainingLessons: { decrement: 1 },
          usedLessons: { increment: 1 },
        },
      })

      if (updated.count === 0) {
        return null
      }

      const refreshed = await tx.membershipPackage.findUnique({
        where: { id: target.id },
        select: { remainingLessons: true },
      })

      if (refreshed && refreshed.remainingLessons <= 0) {
        await tx.membershipPackage.update({
          where: { id: target.id },
          data: { status: 'exhausted' },
        })
      }

      return target.id
    })

    if (!packageId) {
      return { success: false, error: '사용 가능한 회원권이 없습니다.' }
    }

    revalidatePath('/admin/attendance')
    revalidatePath('/instructor/attendance')

    return { success: true, packageId }
  } catch (error) {
    console.error('회원권 차감 실패:', error)
    return { success: false, error: '회원권 차감에 실패했습니다' }
  }
}

// ==================== 결제 타입 조회 ====================

/**
 * 모든 결제 타입 조회
 */
export async function getPaymentTypes() {
  try {
    const types = await prisma.paymentType.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        color: true,
      },
    })

    return types.map(mapPaymentType)
  } catch (error) {
    console.error('결제 타입 조회 실패:', error)
    return []
  }
}
