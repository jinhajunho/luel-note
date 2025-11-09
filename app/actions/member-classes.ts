'use server'

import { prisma } from '@/lib/db/prisma'
import { formatInstructorName } from '@/lib/utils/text'

// ==================== 타입 정의 ====================

export interface MemberClass {
  id: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  type: '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
  status: '예정' | '완료' | '취소'
  instructor: string // 강사 이름
  paymentType: string // 결제 유형
  attended: boolean | null // 출석 여부 (회원 기준)
  checkInTime: string | null // 출석 시간
  members: {
    memberId: string
    name: string
    attended: boolean | null
  }[]
}

const STATUS_MAP: Record<string, MemberClass['status']> = {
  scheduled: '예정',
  in_progress: '예정',
  completed: '완료',
  cancelled: '취소',
}

function formatDate(date: Date | null | undefined) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

function formatTime(time: Date | null | undefined) {
  if (!time) return ''
  return new Date(time).toISOString().slice(11, 16)
}

function formatCheckIn(time: Date | null | undefined) {
  if (!time) return null
  try {
    return new Date(time).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return new Date(time).toISOString().slice(11, 16)
  }
}

function toUtcStart(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

function toUtcEnd(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
}

// ==================== 회원 레슨 목록 조회 ====================

export async function getMemberClasses(
  memberId: string,
  startDate?: string,
  endDate?: string
): Promise<MemberClass[]> {
  try {
    const classMembers = await prisma.classMember.findMany({
      where: {
        memberId,
        class: {
          ...(startDate
            ? {
                date: {
                  gte: toUtcStart(startDate),
                  ...(endDate ? { lte: toUtcEnd(endDate) } : {}),
                },
              }
            : {}),
        },
      },
      include: {
        class: {
          include: {
            classType: { select: { name: true } },
            paymentType: { select: { name: true } },
            instructor: { select: { name: true } },
            classMembers: {
              include: {
                member: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    })

    const mapped = classMembers
      .filter((row) => row.class)
      .map((row) => {
        const cls = row.class!
        const members = cls.classMembers
          .map((cm) => ({
            memberId: cm.memberId ?? '',
            name: cm.member?.name ?? '',
            attended: cm.attended,
          }))
          .filter((member) => member.memberId !== '')

        const rawStatus = cls.status ?? 'scheduled'
        const status = STATUS_MAP[rawStatus] ?? '예정'
        const typeName =
          (cls.classType?.name as MemberClass['type'] | undefined) ?? '인트로'

        return {
          id: cls.id,
          date: formatDate(cls.date),
          startTime: formatTime(cls.startTime),
          endTime: formatTime(cls.endTime),
          type: typeName,
          status,
          instructor: cls.instructor?.name ? formatInstructorName(cls.instructor.name) : '',
          paymentType: cls.paymentType?.name ?? '',
          attended: row.attended ?? null,
          checkInTime: formatCheckIn(row.checkInTime),
          members,
        }
      })

    mapped.sort((a, b) => {
      const dateDiff = b.date.localeCompare(a.date)
      if (dateDiff !== 0) return dateDiff
      return b.startTime.localeCompare(a.startTime)
    })

    return mapped
  } catch (error) {
    console.error('회원 레슨 목록 조회 오류:', error)
    return []
  }
}