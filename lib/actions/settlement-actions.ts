'use server'

import type {
  InstructorSettlement,
  InstructorSettlementData,
  MemberSettlement,
  MemberSummary,
} from '@/types/settlement'
import { prisma } from '@/lib/db/prisma'

type LessonTypeKey = 'intro' | 'personal' | 'duet' | 'group'
type PaymentTypeKey = 'trial' | 'regular' | 'instructor' | 'center'

const LESSON_TYPE_MAP: Record<string, LessonTypeKey> = {
  인트로: 'intro',
  개인레슨: 'personal',
  듀엣레슨: 'duet',
  그룹레슨: 'group',
}

const PAYMENT_TYPE_MAP: Record<string, PaymentTypeKey> = {
  체험수업: 'trial',
  정규수업: 'regular',
  강사제공: 'instructor',
  센터제공: 'center',
}

function toDateRange(startDate: string, endDate: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('INVALID_DATE_RANGE')
  }

  return { start, end }
}

function initMemberSettlement(memberId: string, memberName: string): MemberSettlement {
  return {
    memberId,
    memberName,
    totalSessions: 0,
    lessonTypes: {
      intro: 0,
      personal: 0,
      duet: 0,
      group: 0,
    },
    paymentTypes: {
      trial: 0,
      regular: 0,
      instructor: 0,
      center: 0,
    },
    expanded: false,
  }
}

function applyLessonType(member: MemberSettlement, lessonTypeName: string, count: number) {
  const key = LESSON_TYPE_MAP[lessonTypeName]
  if (key) {
    member.lessonTypes[key] += count
  }
}

function applyPaymentType(member: MemberSettlement, paymentTypeName: string, count: number) {
  const key = PAYMENT_TYPE_MAP[paymentTypeName]
  if (key) {
    member.paymentTypes[key] += count
  }
}

export async function getAdminSettlementData(
  startDate: string,
  endDate: string
): Promise<InstructorSettlement[]> {
  try {
    const { start, end } = toDateRange(startDate, endDate)

    const classes = await prisma.class.findMany({
      where: {
        status: 'completed',
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        instructor: {
          select: { id: true, name: true },
        },
        classType: {
          select: { name: true },
        },
        paymentType: {
          select: { name: true },
        },
        classMembers: {
          where: { attended: true },
          include: {
            member: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    const instructorMap = new Map<string, InstructorSettlement>()

    classes.forEach((cls) => {
      const instructorId = cls.instructor?.id
      const instructorName = cls.instructor?.name ?? '이름 미확인'

      if (!instructorId) {
        return
      }

      if (!instructorMap.has(instructorId)) {
        instructorMap.set(instructorId, {
          instructorId,
          instructorName,
          totalSessions: 0,
          members: [],
          expanded: false,
        })
      }

      const instructor = instructorMap.get(instructorId)!

      cls.classMembers.forEach((classMember) => {
        const memberId = classMember.member?.id
        const memberName = classMember.member?.name ?? '이름 미확인'

        if (!memberId) {
          return
        }

        let member = instructor.members.find((m) => m.memberId === memberId)
        if (!member) {
          member = initMemberSettlement(memberId, memberName)
          instructor.members.push(member)
        }

        member.totalSessions += 1
        instructor.totalSessions += 1

        const classTypeName = cls.classType?.name ?? ''
        const paymentTypeName = cls.paymentType?.name ?? ''

        applyLessonType(member, classTypeName, 1)
        applyPaymentType(member, paymentTypeName, 1)
      })
    })

    return Array.from(instructorMap.values())
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE_RANGE') {
      throw new Error('정확한 날짜 범위를 입력해 주세요.')
    }
    console.error('정산 데이터 조회 오류:', error)
    throw error
  }
}

export async function getInstructorSettlementData(
  instructorId: string,
  year: number,
  month: number
): Promise<InstructorSettlementData | null> {
  try {
    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    const classes = await prisma.class.findMany({
      where: {
        instructorId,
        status: 'completed',
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        instructor: {
          select: { name: true },
        },
        classType: {
          select: { name: true },
        },
        paymentType: {
          select: { name: true },
        },
        classMembers: {
          where: { attended: true },
          include: {
            member: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (classes.length === 0) {
      return null
    }

    const memberMap = new Map<string, MemberSummary>()
    let totalCount = 0
    const instructorName = classes[0].instructor?.name ?? '이름 미확인'

    classes.forEach((cls) => {
      const classTypeName = cls.classType?.name ?? ''
      const paymentTypeName = cls.paymentType?.name ?? ''

      cls.classMembers.forEach((classMember) => {
        const memberId = classMember.member?.id
        const memberName = classMember.member?.name ?? '이름 미확인'

        if (!memberId) {
          return
        }

        if (!memberMap.has(memberId)) {
          memberMap.set(memberId, {
            memberName,
            classTypeCounts: [],
            paymentTypeCounts: [],
            totalCount: 0,
          })
        }

        const summary = memberMap.get(memberId)!
        totalCount += 1
        summary.totalCount += 1

        const classTypeEntry = summary.classTypeCounts.find((c) => c.classType === classTypeName)
        if (classTypeEntry) {
          classTypeEntry.count += 1
        } else {
          summary.classTypeCounts.push({
            classType: classTypeName,
            count: 1,
          })
        }

        const paymentTypeEntry = summary.paymentTypeCounts.find(
          (p) => p.paymentType === paymentTypeName
        )
        if (paymentTypeEntry) {
          paymentTypeEntry.count += 1
        } else {
          summary.paymentTypeCounts.push({
            paymentType: paymentTypeName,
            count: 1,
          })
        }
      })
    })

    return {
      instructorName,
      year,
      month,
      members: Array.from(memberMap.values()),
      totalCount,
    }
  } catch (error) {
    console.error('강사 정산 데이터 조회 오류:', error)
    throw error
  }
}
