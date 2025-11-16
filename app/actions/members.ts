'use server'

import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import { normalizePhone, phoneToEmail } from '@/lib/auth-helpers'
import { supabaseAdminClient } from '@/lib/supabase/admin'

type ConvertToMemberResult = { success: true } | { success: false; error: string }
type SetRoleResult = { success: true } | { success: false; error: string }
type ResetPasswordResult = { success: true } | { success: false; error: string }

type Role = 'guest' | 'member' | 'instructor' | 'admin'
const MENU_KEYS = [
  'menu_dashboard',
  'menu_attendance',
  'menu_members',
  'menu_classes',
  'menu_settlements',
  'menu_settings',
] as const
type MenuPermissionKey = (typeof MENU_KEYS)[number]

const ROLE_PERMISSIONS: Record<Role, Record<MenuPermissionKey, boolean>> = {
  guest: {
    menu_dashboard: true,
    menu_attendance: true,
    menu_members: false,
    menu_classes: false,
    menu_settlements: false,
    menu_settings: true,
  },
  member: {
    menu_dashboard: true,
    menu_attendance: true,
    menu_members: false,
    menu_classes: false,
    menu_settlements: false,
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
  admin: {
    menu_dashboard: true,
    menu_attendance: true,
    menu_members: true,
    menu_classes: true,
    menu_settlements: true,
    menu_settings: true,
  },
}

const DEFAULT_MEMBER_JOIN_DATE = () => new Date()

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

async function syncMenuPermissions(
  tx: Prisma.TransactionClient,
  profileId: string,
  role: Role
) {
  const config = ROLE_PERMISSIONS[role]
  await Promise.all(
    MENU_KEYS.map((key) =>
      tx.userPermission.upsert({
        where: {
          profileId_permissionKey: {
            profileId,
            permissionKey: key,
          },
        },
        create: {
          profileId,
          permissionKey: key,
          granted: config[key],
        },
        update: {
          granted: config[key],
        },
      })
    )
  )
}

async function ensureMemberRecord(
  tx: Prisma.TransactionClient,
  profileId: string,
  phone: string,
  name?: string | null,
  memberType: 'member' | 'guest' = 'member'
) {
  const existing = await tx.member.findUnique({
    where: { phone },
    select: { id: true },
  })

  if (existing) {
    return tx.member.update({
      where: { phone },
      data: {
        profileId,
        type: memberType,
        status: 'active',
      },
    })
  }

  return tx.member.create({
    data: {
      profileId,
      phone,
      name: name ?? '',
      type: memberType,
      status: 'active',
      joinDate: DEFAULT_MEMBER_JOIN_DATE(),
    },
  })
}

// ==================== 회원 승격 (비회원 → 정회원) ====================

export async function convertToMember(memberPhone: string): Promise<ConvertToMemberResult> {
  const phone = normalizePhone(memberPhone)

  try {
    await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { phone },
        select: { id: true, profileId: true, name: true },
      })

      if (!member) {
        throw new Error('회원 정보를 찾을 수 없습니다.')
      }

      let profileId = member.profileId
      if (!profileId) {
        const profile = await tx.profile.findUnique({
          where: { phone },
          select: { id: true },
        })
        if (!profile) {
          throw new Error('프로필 정보를 찾을 수 없습니다.')
        }
        profileId = profile.id
        await tx.member.update({
          where: { id: member.id },
          data: { profileId },
        })
      }

      await tx.member.update({
        where: { id: member.id },
        data: {
          type: 'member',
          status: 'active',
        },
      })

      await tx.profile.update({
        where: { id: profileId },
        data: { role: 'member' },
      })

      await syncMenuPermissions(tx, profileId, 'member')
    })

    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '회원 전환 중 오류가 발생했습니다'),
    }
  }
}

export async function convertToMemberByMemberId(memberId: string): Promise<ConvertToMemberResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: { id: true, profileId: true, phone: true, name: true },
      })

      if (!member) {
        throw new Error('회원 정보를 찾을 수 없습니다.')
      }

      const phone = member.phone
      let profileId = member.profileId

      if (!profileId) {
        const profile = await tx.profile.findUnique({
          where: { phone },
          select: { id: true },
        })
        if (!profile) {
          throw new Error('프로필 정보를 찾을 수 없습니다.')
        }
        profileId = profile.id
        await tx.member.update({
          where: { id: member.id },
          data: { profileId },
        })
      }

      await tx.member.update({
        where: { id: member.id },
        data: {
          type: 'member',
          status: 'active',
        },
      })

      await tx.profile.update({
        where: { id: profileId },
        data: { role: 'member' },
      })

      await syncMenuPermissions(tx, profileId, 'member')
    })

    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '회원 전환 중 오류가 발생했습니다'),
    }
  }
}

// ==================== 권한 설정 ====================

export async function setMemberRole(
  memberPhone: string,
  role: Role
): Promise<SetRoleResult> {
  const phone = normalizePhone(memberPhone)

  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { phone },
        select: { id: true, name: true },
      })

      if (!profile) {
        throw new Error('프로필 정보를 찾을 수 없습니다.')
      }

      await tx.profile.update({
        where: { id: profile.id },
        data: { role },
      })

      if (role === 'member' || role === 'guest') {
        await ensureMemberRecord(tx, profile.id, phone, profile.name, role === 'guest' ? 'guest' : 'member')
      } else {
        await tx.member.deleteMany({
          where: { profileId: profile.id },
        })
      }

      await syncMenuPermissions(tx, profile.id, role)
    })

    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '권한 설정 중 오류가 발생했습니다'),
    }
  }
}

export async function setProfileRole(
  profileId: string,
  role: Role
): Promise<SetRoleResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { id: profileId },
        select: { id: true, phone: true, name: true },
      })

      if (!profile || !profile.phone) {
        throw new Error('프로필 정보를 찾을 수 없습니다.')
      }

      const phone = normalizePhone(profile.phone)

      await tx.profile.update({
        where: { id: profileId },
        data: { role },
      })

      if (role === 'member' || role === 'guest') {
        await ensureMemberRecord(tx, profileId, phone, profile.name, role === 'guest' ? 'guest' : 'member')
      } else {
        await tx.member.deleteMany({ where: { profileId } })
      }

      await syncMenuPermissions(tx, profileId, role)
    })

    revalidatePath('/admin/members')
    revalidatePath('/admin/profile')
    revalidatePath('/profile')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '권한 설정 중 오류가 발생했습니다'),
    }
  }
}

// ==================== 비밀번호 초기화 ====================

export async function resetMemberPassword(memberPhone: string): Promise<ResetPasswordResult> {
  const phone = normalizePhone(memberPhone)
  const email = phoneToEmail(phone)

  try {
    let authId: string | null = null

    const profile = await prisma.profile.findUnique({
      where: { phone },
      select: { authId: true },
    })

    if (profile?.authId) {
      authId = profile.authId
    } else {
      // Supabase Admin SDK는 이메일로 사용자를 직접 조회하는 메서드를 제공하지 않음
      // 기존 데이터에 authId가 없는 경우에는 비밀번호 초기화를 진행할 수 없도록 안내
      return {
        success: false,
        error:
          '이 계정은 인증 사용자 ID(authId)가 연결되어 있지 않습니다. 먼저 로그인 후 프로필 동기화를 진행해 주세요.',
      }
    }

    if (!authId) {
      throw new Error('사용자 정보를 찾을 수 없습니다.')
    }

    await supabaseAdminClient.auth.admin.updateUserById(authId, {
      password: phone,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '비밀번호 초기화에 실패했습니다'),
    }
  }
}

// ==================== 회원 메모 ====================

export async function updateMemberNotes(
  memberPhone: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const phone = normalizePhone(memberPhone)

  try {
    const result = await prisma.member.updateMany({
      where: { phone },
      data: {
        notes,
        updatedAt: new Date(),
      } as any,
    })

    if (result.count === 0) {
      return { success: false, error: '회원 정보를 찾을 수 없습니다' }
    }

    revalidatePath('/admin/members')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '메모 업데이트에 실패했습니다'),
    }
  }
}

// ==================== 조회 액션 ====================

const normalize = (value?: string | null) => {
  if (!value) return ''
  try {
    return value.normalize('NFC')
  } catch {
    return value
  }
}

export async function getAllProfiles(): Promise<{
  success: boolean
  data?: Array<{ id: string; name: string; phone: string; role: Role | null }>
  error?: string
}> {
  try {
    const profiles = await prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, phone: true, role: true },
    })

      return {
        success: true,
        data: profiles.map((profile) => ({
          ...profile,
          name: normalize(profile.name),
          phone: normalize(profile.phone),
          role: (profile.role ?? null) as Role | null,
        })),
      }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '사용자 목록을 불러올 수 없습니다'),
    }
  }
}

export async function getAllMembers(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    name: string
    phone: string
    status: 'active' | 'inactive'
    type: 'member' | 'guest'
    joinDate: string
    instructor?: string | null
    remainingLessons: number
    totalLessons: number
    notes?: string | null
  }>
  error?: string
}> {
  try {
    const members = await prisma.member.findMany({
      include: {
        instructorMembers: {
          include: {
            instructor: {
              select: { name: true },
            },
          },
        },
        membershipPackages: {
          where: { status: 'active' },
          select: { remainingLessons: true, totalLessons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const profileIds = Array.from(
      new Set(
        members
          .map((member) => member.profileId)
          .filter((value): value is string => Boolean(value))
      )
    )

    const profiles = profileIds.length
      ? await prisma.profile.findMany({
          where: { id: { in: profileIds } },
          select: { id: true, name: true, phone: true, role: true },
        })
      : []

    const profileMap = new Map(
      profiles.map((profile) => [
        profile.id,
        {
          ...profile,
          name: normalize(profile.name),
          phone: normalize(profile.phone),
        },
      ])
    )

    const data = members
      .map((member) => {
        const profile = member.profileId ? profileMap.get(member.profileId) : undefined
        const name = normalize(profile?.name ?? member.name)
        const phone = normalize(profile?.phone ?? member.phone)
        const instructorNames = member.instructorMembers
          .map((im) => im.instructor?.name)
          .filter((value): value is string => Boolean(value))

        const remainingLessons = member.membershipPackages.reduce(
          (sum, pkg) => sum + (pkg.remainingLessons ?? 0),
          0
        )
        const totalLessons = member.membershipPackages.reduce(
          (sum, pkg) => sum + (pkg.totalLessons ?? 0),
          0
        )

        const joinDateSource = member.joinDate ?? member.createdAt

        return {
          id: member.id,
          name,
          phone,
          status: member.status as 'active' | 'inactive',
          type: member.type as 'member' | 'guest',
          joinDate: joinDateSource ? joinDateSource.toISOString().split('T')[0] : '',
          instructor: instructorNames.length ? instructorNames.join(', ') : null,
          remainingLessons,
          totalLessons,
          notes: null,
        }
      })

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '회원 목록을 불러오는 중 오류가 발생했습니다'),
    }
  }
}

export async function getInstructorMembers(instructorProfileId: string): Promise<{
  success: boolean
  data?: Array<{
    id: string
    name: string
    phone: string
    status: 'active' | 'inactive'
    type: 'member' | 'guest'
    joinDate: string
    remainingLessons: number
    totalLessons: number
    notes?: string | null
  }>
  error?: string
}> {
  try {
    const assignments = await prisma.instructorMember.findMany({
      where: { instructorId: instructorProfileId },
      include: {
        member: {
          include: {
            membershipPackages: {
              where: { status: 'active' },
              select: { remainingLessons: true, totalLessons: true },
            },
          },
        },
      },
    })

    const data = assignments
      .map((assignment) => assignment.member)
      .filter((member): member is NonNullable<typeof member> => Boolean(member))
      .map((member) => {
        const remainingLessons = member.membershipPackages.reduce(
          (sum, pkg) => sum + (pkg.remainingLessons ?? 0),
          0
        )
        const totalLessons = member.membershipPackages.reduce(
          (sum, pkg) => sum + (pkg.totalLessons ?? 0),
          0
        )

        const joinDateSource = member.joinDate ?? member.createdAt

        return {
          id: member.id,
          name: member.name,
          phone: member.phone,
          status: member.status as 'active' | 'inactive',
          type: member.type as 'member' | 'guest',
          joinDate: joinDateSource ? joinDateSource.toISOString().split('T')[0] : '',
          remainingLessons,
          totalLessons,
          notes: null,
        }
      })

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '강사 담당 회원 목록을 불러오는 중 오류가 발생했습니다'),
    }
  }
}

// ==================== 강사 배정 ====================

export async function assignInstructorsToMember(
  memberId: string,
  instructorIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.instructorMember.findMany({
        where: { memberId },
        select: { instructorId: true },
      })

      const existingIds = existing
        .map((item) => item.instructorId)
        .filter((id): id is string => Boolean(id))
      const incomingUnique = Array.from(new Set(instructorIds))

      const toDelete = existingIds.filter((id) => !incomingUnique.includes(id))
      if (toDelete.length) {
        await tx.instructorMember.deleteMany({
          where: {
            memberId,
            instructorId: { in: toDelete },
          },
        })
      }

      const toInsert = incomingUnique.filter((id) => !existingIds.includes(id))
      if (toInsert.length) {
        await tx.instructorMember.createMany({
          data: toInsert.map((instructorId) => ({
            memberId,
            instructorId,
          })),
        })
      }
    })

    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, '강사 배정 중 오류가 발생했습니다'),
    }
  }
}

