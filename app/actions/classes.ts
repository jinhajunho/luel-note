'use server'

import { revalidatePath } from 'next/cache'

import { prisma } from '@/lib/db/prisma'
import { formatInstructorName } from '@/lib/utils/text'
import { normalizePhone } from '@/lib/auth-helpers'
import { randomUUID } from 'crypto'

type LessonStatus = '예정' | '완료' | '취소'
type LessonTypeName = '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'

const STATUS_TO_KO: Record<string, LessonStatus> = {
  scheduled: '예정',
  in_progress: '예정',
  ongoing: '예정',
  completed: '완료',
  cancelled: '취소',
}

const STATUS_TO_DB: Record<LessonStatus, string> = {
  '예정': 'scheduled',
  '완료': 'completed',
  '취소': 'cancelled',
}

const CLASS_REVALIDATE_TARGETS = [
  '/admin/classes',
  '/admin/attendance',
  '/admin/schedule',
  '/instructor/lessons',
  '/instructor/attendance',
  '/member/schedule',
]

interface ClassMemberInfo {
  memberId: string | null
  name: string
  phone?: string | null
  attended: boolean | null
  checkInTime?: string | null
  membershipPackageId?: string | null
  remainingLessons?: number | null
  totalLessons?: number | null
  paymentType?: string | null
  hasPackage?: boolean
}

export interface AdminClass {
  id: string
  date: string
  startTime: string
  endTime: string
  type: LessonTypeName
  status: LessonStatus
  paymentType: string
  instructor: string | null
  instructorId: string | null
  members: ClassMemberInfo[]
}

export interface CreateClassInput {
  classTypeName: LessonTypeName
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  paymentTypeId: string
  paymentTypeName: string
  instructorId?: string | null
  memberIds: string[]
  status?: LessonStatus
  introGuests?: Array<{ name: string; phone: string }>
}

function formatDate(date: Date | null | undefined) {
  if (!date) return ''
  const iso = new Date(date).toISOString()
  return iso.slice(0, 10)
}

function formatTime(time: Date | null | undefined) {
  if (!time) return ''
  const iso = new Date(time).toISOString()
  return iso.slice(11, 16)
}

function toDateOnly(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) {
    return new Date(NaN)
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
}

function toTime(time: string) {
  // time은 HH:mm 또는 HH:mm:ss 형태로 전달됨
  const normalized = time.length === 5 ? `${time}:00` : time
  const [hours, minutes, seconds] = normalized.split(':').map(Number)
  return new Date(Date.UTC(1970, 0, 1, hours ?? 0, minutes ?? 0, seconds ?? 0))
}

function mapClass(record: any): AdminClass {
  const members: ClassMemberInfo[] = (record.classMembers ?? []).map((cm: any, idx: number) => {
    const membership = cm.membershipPackage
    return {
      memberId: cm.memberId ?? `guest-${record.id}-${idx}`,
      name: cm.member?.name ?? '',
      phone: cm.member?.phone ?? null,
      attended: cm.attended ?? null,
      checkInTime: cm.checkInTime ? new Date(cm.checkInTime).toISOString() : null,
      membershipPackageId: membership?.id ?? null,
      remainingLessons: membership?.remainingLessons ?? null,
      totalLessons: membership?.totalLessons ?? null,
      paymentType: membership?.paymentType?.name ?? record.paymentType?.name ?? null,
      hasPackage: Boolean(membership),
    }
  })

  members.sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  const instructorName = record.instructor?.name
    ? formatInstructorName(record.instructor.name)
    : null

  const status: LessonStatus = STATUS_TO_KO[record.status] ?? '예정'

  const typeName =
    (record.classType?.name as LessonTypeName | undefined) ?? '인트로'

  return {
    id: record.id,
    date: formatDate(record.date),
    startTime: formatTime(record.startTime),
    endTime: formatTime(record.endTime),
    type: typeName,
    status,
    paymentType: record.paymentType?.name ?? record.paymentTypeName ?? '',
    instructor: instructorName,
    instructorId: record.instructorId ?? null,
    members,
  }
}

function revalidateClassPaths() {
  CLASS_REVALIDATE_TARGETS.forEach((path) => revalidatePath(path))
}

export async function getAllClasses(): Promise<{
  success: boolean
  data?: AdminClass[]
  error?: string
}> {
  try {
    const classes = await prisma.class.findMany({
      include: {
        classType: { select: { id: true, name: true } },
        paymentType: { select: { id: true, name: true } },
        instructor: { select: { id: true, name: true } },
        classMembers: {
          include: {
            member: { select: { id: true, name: true, phone: true } },
            membershipPackage: {
              select: {
                id: true,
                remainingLessons: true,
                totalLessons: true,
                paymentType: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' },
      ],
    })

    const data = classes.map(mapClass)
    return { success: true, data }
  } catch (error) {
    console.error('레슨 목록 조회 오류:', error)
    return {
      success: false,
      error: '레슨 목록을 불러오는 중 오류가 발생했습니다.',
    }
  }
}

export async function createClass(input: CreateClassInput): Promise<{
  success: boolean
  data?: AdminClass
  error?: string
}> {
  try {
    const status = input.status ?? '예정'

    const classType = await prisma.classType.findFirst({
      where: { name: input.classTypeName },
      select: { id: true },
    })

    if (!classType) {
      return {
        success: false,
        error: `'${input.classTypeName}' 레슨 유형을 찾을 수 없습니다.`,
      }
    }

    const paymentType = await prisma.paymentType.findUnique({
      where: { id: input.paymentTypeId },
      select: { id: true, name: true },
    })

    if (!paymentType) {
      return {
        success: false,
        error: '선택한 결제 유형을 찾을 수 없습니다.',
      }
    }

    const targetDate = toDateOnly(input.date)
    const startTime = toTime(input.startTime)
    const endTime = toTime(input.endTime)
    const initialMemberIds = Array.isArray(input.memberIds) ? [...input.memberIds] : []
    let resolvedMemberIds: string[] = []

    const classId = await prisma.$transaction(async (tx) => {
      const created = await tx.class.create({
        data: {
          classTypeId: classType.id,
          date: targetDate,
          time: startTime,
          startTime,
          endTime,
          instructorId: input.instructorId ?? null,
          paymentTypeId: paymentType.id,
          status: STATUS_TO_DB[status] ?? 'scheduled',
        },
      })

      const participantIds = new Set(initialMemberIds)

      if (input.classTypeName === '인트로' && input.introGuests?.length) {
        for (const guest of input.introGuests) {
          const normalizedPhone = normalizePhone(guest.phone)
          if (!normalizedPhone) {
            continue
          }
          const displayName = (guest.name ?? '').trim() || '비회원'

          const existingMember = await tx.member.findUnique({
            where: { phone: normalizedPhone },
            select: {
              id: true,
              profileId: true,
              type: true,
              name: true,
            },
          })

          let memberId: string | null = null

          if (existingMember) {
            memberId = existingMember.id
            await tx.member.update({
              where: { id: existingMember.id },
              data: {
                status: 'active',
                ...(existingMember.type === 'guest' && existingMember.name !== displayName
                  ? { name: displayName }
                  : {}),
              },
            })

            if (existingMember.profileId && existingMember.type === 'guest') {
              await tx.profile.update({
                where: { id: existingMember.profileId },
                data: { name: displayName },
              })
            }
          } else {
            const profile = await tx.profile.create({
              data: {
                authId: `guest-${randomUUID()}`,
                phone: normalizedPhone,
                name: displayName,
                role: 'guest',
              },
              select: { id: true },
            })

            const member = await tx.member.create({
              data: {
                profileId: profile.id,
                phone: normalizedPhone,
                name: displayName,
                type: 'guest',
                status: 'active',
                joinDate: new Date(),
              },
              select: { id: true },
            })

            memberId = member.id
          }

          if (memberId) {
            participantIds.add(memberId)
            if (input.instructorId) {
              await tx.instructorMember.upsert({
                where: {
                  instructorId_memberId: {
                    instructorId: input.instructorId,
                    memberId,
                  },
                },
                update: {},
                create: {
                  memberId,
                  instructorId: input.instructorId,
                },
              })
            }
          }
        }
      }

      resolvedMemberIds = Array.from(participantIds)

      if (resolvedMemberIds.length > 0) {
        for (const memberId of resolvedMemberIds) {
          let membershipPackageId: string | null = null
          const membership = await tx.membershipPackage.findFirst({
            where: {
              memberId,
              paymentTypeId: paymentType.id,
              status: 'active',
              remainingLessons: { gt: 0 },
            },
            orderBy: { endDate: 'asc' },
          })

          if (membership) {
            membershipPackageId = membership.id
          }

          await tx.classMember.create({
            data: {
              classId: created.id,
              memberId,
              membershipPackageId,
            },
          })
        }
      }

      return created.id
    })

    const createdClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        classType: { select: { id: true, name: true } },
        paymentType: { select: { id: true, name: true } },
        instructor: { select: { id: true, name: true } },
        classMembers: {
          include: {
            member: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    })

    if (!createdClass) {
      return {
        success: false,
        error: '레슨 정보를 다시 불러오는 데 실패했습니다.',
      }
    }

    if (resolvedMemberIds.length > 0) {
      const members = await prisma.member.findMany({
        where: { id: { in: resolvedMemberIds } },
        select: { id: true, profileId: true, name: true },
      })

      const notificationTargets = members
        .map((member) => member.profileId)
        .filter((profileId): profileId is string => Boolean(profileId))

      if (notificationTargets.length > 0) {
        const formattedDate = input.date
        const messageLines = [
          `${formattedDate} ${input.startTime} ${input.classTypeName}`,
          createdClass.instructor?.name ? formatInstructorName(createdClass.instructor.name) : '',
        ].filter(Boolean)
        const message = messageLines.join('\n')

        await prisma.notification.createMany({
          data: notificationTargets.map((profileId) => ({
            profileId,
            title: '새 레슨이 등록되었습니다',
            message,
            type: 'lesson',
          })),
        })

        revalidatePath('/member/notifications')
      }
    }

    revalidateClassPaths()
    return {
      success: true,
      data: mapClass(createdClass),
    }
  } catch (error) {
    console.error('레슨 생성 오류:', error)
    return {
      success: false,
      error: '레슨을 등록하는 중 오류가 발생했습니다.',
    }
  }
}

export async function deleteClass(classId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.class.delete({
      where: { id: classId },
    })

    revalidateClassPaths()
    return { success: true }
  } catch (error) {
    console.error('레슨 삭제 오류:', error)
    return {
      success: false,
      error: '레슨을 삭제하는 중 오류가 발생했습니다.',
    }
  }
}

