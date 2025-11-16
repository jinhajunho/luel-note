'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/db/prisma'
import type { Prisma } from '@/lib/generated/prisma'

type AttendanceResult = {
  success: boolean
  message: string
  error?: string
  newStatus?: boolean | null
  checkInTime?: string | null
  nextStatus?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

const ATTENDANCE_REVALIDATE_TARGETS = [
  '/admin/attendance',
  '/instructor/attendance',
  '/member/attendance',
  '/admin/classes',
  '/instructor/lessons',
  '/member/schedule',
  '/instructor/schedule',
  '/admin/schedule',
  '/member/history',
]

function revalidateAttendancePaths(paths: string[]) {
  paths.forEach((path) => revalidatePath(path))
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

type ToggleAttendanceOptions = {
  actor?: 'member' | 'instructor' | 'admin'
}

// DB의 date(Date), time(Time) 컬럼을 UTC 기준 하나의 Date로 결합
function combineDateAndTimeKST(dateValue: Date | null, timeValue: Date | null): Date | null {
  if (!dateValue || !timeValue) return null
  const y = dateValue.getUTCFullYear()
  const m = dateValue.getUTCMonth() // 0-based
  const d = dateValue.getUTCDate()
  const h = timeValue.getUTCHours()
  const min = timeValue.getUTCMinutes()
  const s = timeValue.getUTCSeconds()
  // KST(UTC+9) 기준의 로컬 시각을 실제 UTC 타임스탬프로 변환
  // 예) KST 19:00 → UTC 10:00 (= h - 9)
  const ms = Date.UTC(y, m, d, h - 9, min, s, 0)
  return new Date(ms)
}

function parseLocalDateTime(dateStr?: string | null, timeStr?: string | null): Date | null {
  if (!dateStr || !timeStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    hour === undefined ||
    minute === undefined
  ) {
    return null
  }
  const h = Number(hour)
  const m = Number(minute)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return new Date(year, month - 1, day, h, m, 0, 0)
}

function getDateString(dateValue: Date | null): string | null {
  if (!dateValue) return null
  return new Date(dateValue).toISOString().slice(0, 10)
}

function getTimeString(timeValue: Date | null): string | null {
  if (!timeValue) return null
  return new Date(timeValue).toISOString().slice(11, 16)
}

export async function toggleAttendance(
  classId: string,
  memberId: string,
  currentStatus: boolean | null,
  options: ToggleAttendanceOptions = {}
): Promise<AttendanceResult> {
  const actor = options.actor ?? 'member'
  try {
    const classMember = await prisma.classMember.findUnique({
      where: {
        classId_memberId: { classId, memberId },
      },
      select: {
        id: true,
        membershipPackageId: true,
      },
    })

    if (!classMember) {
      return {
        success: false,
        message: '출석 정보를 찾을 수 없습니다.',
        error: '수업 참여 정보를 찾을 수 없습니다.',
      }
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        paymentTypeId: true,
        date: true,
        startTime: true,
        endTime: true,
      },
    })

    if (!classData) {
      return {
        success: false,
        message: '레슨 정보를 찾을 수 없습니다.',
        error: '수업 정보를 찾을 수 없습니다.',
      }
    }

    if (actor === 'member') {
      // 서버 타임존(UTC)과 한국 현지시각 간 불일치를 방지하기 위해
      // DB의 date(Timezone 없는 DATE) + time(Time)을 UTC 기준으로 결합해 비교한다.
      const startDateTime = combineDateAndTimeKST(classData.date, classData.startTime)
      let endDateTime = combineDateAndTimeKST(classData.date, classData.endTime)
      if (startDateTime && endDateTime && endDateTime.getTime() <= startDateTime.getTime()) {
        // 자정을 넘어가는 경우 다음날로 이동
        endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000)
      }

      if (startDateTime && endDateTime) {
        const startWindow = new Date(startDateTime.getTime() - 60 * 60 * 1000)
        const endWindow = new Date(endDateTime.getTime() + 60 * 60 * 1000)
        const now = new Date()
        const windowOpen = now >= startWindow && now <= endWindow

        if (!windowOpen) {
          return {
            success: false,
            message: '출석 변경 가능 시간이 아닙니다. (레슨 시작 1시간 전 ~ 종료 후 1시간)',
          }
        }
      }
    }

    let newStatus: boolean | null
    if (currentStatus === null) {
      newStatus = true
    } else if (currentStatus === true) {
      newStatus = false
    } else {
      newStatus = true
    }

    if (newStatus === true) {
      if (!classData.paymentTypeId) {
        return {
          success: false,
          message: '레슨에 결제 유형이 지정되어 있지 않습니다.',
        }
      }

      try {
        await prisma.$transaction(async (tx) => {
          const membershipPackage = await tx.membershipPackage.findFirst({
            where: {
              memberId,
              paymentTypeId: classData.paymentTypeId!,
              status: 'active',
              remainingLessons: { gt: 0 },
            },
            orderBy: { endDate: 'asc' },
          })

          if (!membershipPackage) {
            throw new Error('NO_PACKAGE')
          }

          const remainingAfter = membershipPackage.remainingLessons - 1
          await tx.membershipPackage.update({
            where: { id: membershipPackage.id },
            data: {
              remainingLessons: { decrement: 1 },
              usedLessons: { increment: 1 },
              status: remainingAfter <= 0 ? 'exhausted' : 'active',
            },
          })

          await tx.classMember.update({
            where: {
              classId_memberId: { classId, memberId },
            },
            data: {
              attended: true,
              checkInTime: new Date(),
              membershipPackageId: membershipPackage.id,
            },
          })
        })
      } catch (error) {
        if (error instanceof Error && error.message === 'NO_PACKAGE') {
          return {
            success: false,
            message: '사용 가능한 회원권이 없습니다. 해당 결제 타입의 회원권을 먼저 등록하세요.',
          }
        }

        throw error
      }

      const checkInTime = new Date().toISOString()

      revalidateAttendancePaths(ATTENDANCE_REVALIDATE_TARGETS)
      return {
        success: true,
        message: '출석 체크 완료! 회원권이 차감되었습니다.',
        newStatus: true,
        checkInTime,
      }
    }

    if (newStatus === false) {
      await prisma.classMember.update({
        where: {
          classId_memberId: { classId, memberId },
        },
        data: {
          attended: false,
          checkInTime: null,
          membershipPackageId: null,
        },
      })

      revalidateAttendancePaths(ATTENDANCE_REVALIDATE_TARGETS)
      return {
        success: true,
        message: '결석 처리되었습니다.',
        newStatus: false,
        checkInTime: null,
      }
    }

    await prisma.$transaction(async (tx) => {
      if (classMember.membershipPackageId) {
        await tx.membershipPackage.update({
          where: { id: classMember.membershipPackageId },
          data: {
            remainingLessons: { increment: 1 },
            usedLessons: { decrement: 1 },
            status: 'active',
          },
        })
      }

      await tx.classMember.update({
        where: {
          classId_memberId: { classId, memberId },
        },
        data: {
          attended: null,
          checkInTime: null,
          membershipPackageId: null,
        },
      })
    })

    revalidateAttendancePaths(ATTENDANCE_REVALIDATE_TARGETS)
    return {
      success: true,
      message: '출석이 취소되었습니다.',
      newStatus: null,
      checkInTime: null,
    }
  } catch (error) {
    console.error('출석 처리 오류:', error)
    return {
      success: false,
      message: '출석 처리 중 오류가 발생했습니다.',
      error: getErrorMessage(error, '알 수 없는 오류'),
    }
  }
}

export async function completeClass(classId: string): Promise<AttendanceResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.classMember.updateMany({
        where: { classId, attended: null },
        data: {
          attended: false,
          checkInTime: null,
          membershipPackageId: null,
        },
      })

      await tx.class.update({
        where: { id: classId },
        data: { status: 'completed' },
      })
    })

    revalidateAttendancePaths(ATTENDANCE_REVALIDATE_TARGETS)
    return {
      success: true,
      message: '레슨이 완료되었습니다!',
    }
  } catch (error) {
    console.error('레슨 완료 오류:', error)
    return {
      success: false,
      message: '레슨 완료 처리 중 오류가 발생했습니다.',
      error: getErrorMessage(error, '알 수 없는 오류'),
    }
  }
}

export async function cancelClass(classId: string): Promise<AttendanceResult> {
  try {
    let outcome: AttendanceResult | null = null

    await prisma.$transaction(async (tx) => {
      const classInfo = await tx.class.findUnique({
        where: { id: classId },
        select: { status: true },
      })

      if (!classInfo) {
        throw new Error('CLASS_NOT_FOUND')
      }

      if (classInfo.status === 'completed') {
        await tx.class.update({
          where: { id: classId },
          data: { status: 'scheduled' },
        })

        outcome = {
          success: true,
          message: '레슨 완료 상태를 취소했습니다. 다시 출석을 조정할 수 있습니다.',
          nextStatus: 'scheduled',
        }
        return
      }

      if (classInfo.status === 'cancelled') {
        outcome = {
          success: true,
          message: '이미 취소된 레슨입니다.',
          nextStatus: 'cancelled',
        }
        return
      }

      const members = await tx.classMember.findMany({
        where: { classId },
        select: { id: true, attended: true, membershipPackageId: true },
      })

      for (const member of members) {
        if (member.attended && member.membershipPackageId) {
          await tx.membershipPackage.update({
            where: { id: member.membershipPackageId },
            data: {
              remainingLessons: { increment: 1 },
              usedLessons: { decrement: 1 },
              status: 'active',
            },
          })
        }
      }

      await tx.classMember.updateMany({
        where: { classId },
        data: {
          attended: null,
          checkInTime: null,
          membershipPackageId: null,
        },
      })

      await tx.class.update({
        where: { id: classId },
        data: { status: 'cancelled' },
      })

      outcome = {
        success: true,
        message: '레슨이 취소되었습니다. 회원권이 복구되었습니다.',
        nextStatus: 'cancelled',
      }
    })

    revalidateAttendancePaths(ATTENDANCE_REVALIDATE_TARGETS)
    return outcome ?? {
      success: true,
      message: '처리가 완료되었습니다.',
    }
  } catch (error) {
    console.error('레슨 취소 오류:', error)
    return {
      success: false,
      message: '레슨 취소 처리 중 오류가 발생했습니다.',
      error: getErrorMessage(error, '알 수 없는 오류'),
    }
  }
}

export async function getAttendanceHistory(
  role: 'admin' | 'instructor',
  userId?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    const where: Prisma.ClassWhereInput = {
      status: 'completed',
    }

    if (role === 'instructor' && userId) {
      where.instructorId = userId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const data = await prisma.class.findMany({
      where,
      include: {
        classType: { select: { name: true, color: true } },
        paymentType: { select: { name: true, color: true } },
        instructor: { select: { name: true } },
        classMembers: {
          include: {
            member: { select: { name: true, phone: true } },
            membershipPackage: { select: { paymentTypeId: true } },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    })

    return { data, error: null }
  } catch (error) {
    console.error('출석 기록 조회 오류:', error)
    return {
      data: null,
      error: getErrorMessage(error, '출석 기록을 불러오는 중 오류가 발생했습니다'),
    }
  }
}

export async function getMemberAttendanceHistory(memberId: string) {
  try {
    const data = await prisma.classMember.findMany({
      where: {
        memberId,
        NOT: { attended: null },
      },
      include: {
        class: {
          include: {
            classType: { select: { name: true } },
            paymentType: { select: { name: true } },
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { class: { date: 'desc' } },
        { class: { startTime: 'desc' } },
      ],
    })

    return { data, error: null }
  } catch (error) {
    console.error('출석 기록 조회 오류:', error)
    return {
      data: null,
      error: getErrorMessage(error, '출석 기록을 불러오는 중 오류가 발생했습니다'),
    }
  }
}
