'use server'

import { prisma } from '@/lib/db/prisma'
import { getAuthenticatedProfile } from '@/lib/server/getAuthenticatedProfile'

const NOTIFICATION_KEYS = {
  lesson: 'notification:lesson',
  attendance: 'notification:attendance',
  notice: 'notification:notice',
} as const

type NotificationKey = keyof typeof NOTIFICATION_KEYS
type NotificationPreferences = Record<NotificationKey, boolean>

const DEFAULT_PREFERENCES: NotificationPreferences = {
  lesson: true,
  attendance: true,
  notice: true,
}

function mapPermissionKeyToPreference(permissionKey: string): NotificationKey | null {
  const entry = Object.entries(NOTIFICATION_KEYS).find(([, value]) => value === permissionKey)
  return entry ? (entry[0] as NotificationKey) : null
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const profile = await getAuthenticatedProfile()
  if (!profile) {
    throw new Error('인증된 사용자를 찾을 수 없습니다.')
  }

  const preferences: NotificationPreferences = { ...DEFAULT_PREFERENCES }

  const existing = await prisma.userPermission.findMany({
    where: {
      profileId: profile.id,
      permissionKey: {
        in: Object.values(NOTIFICATION_KEYS),
      },
    },
  })

  existing.forEach((permission) => {
    const key = mapPermissionKeyToPreference(permission.permissionKey)
    if (!key) return
    preferences[key] = permission.granted ?? DEFAULT_PREFERENCES[key]
  })

  const missingKeys = (Object.keys(NOTIFICATION_KEYS) as NotificationKey[]).filter(
    (key) =>
      !existing.some((permission) => permission.permissionKey === NOTIFICATION_KEYS[key])
  )

  if (missingKeys.length > 0) {
    await Promise.all(
      missingKeys.map((key) =>
        prisma.userPermission.upsert({
          where: {
            profileId_permissionKey: {
              profileId: profile.id,
              permissionKey: NOTIFICATION_KEYS[key],
            },
          },
          create: {
            profileId: profile.id,
            permissionKey: NOTIFICATION_KEYS[key],
            granted: preferences[key],
          },
          update: {
            granted: preferences[key],
          },
        })
      )
    )
  }

  return preferences
}

export async function updateNotificationPreferences(
  updates: NotificationPreferences
): Promise<{ success: true }> {
  const profile = await getAuthenticatedProfile()
  if (!profile) {
    throw new Error('인증된 사용자를 찾을 수 없습니다.')
  }

  await Promise.all(
    (Object.keys(NOTIFICATION_KEYS) as NotificationKey[]).map((key) =>
      prisma.userPermission.upsert({
        where: {
          profileId_permissionKey: {
            profileId: profile.id,
            permissionKey: NOTIFICATION_KEYS[key],
          },
        },
        create: {
          profileId: profile.id,
          permissionKey: NOTIFICATION_KEYS[key],
          granted: updates[key],
        },
        update: {
          granted: updates[key],
        },
      })
    )
  )

  return { success: true }
}

