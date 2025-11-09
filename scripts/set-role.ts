#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma'
import { normalizePhone } from '../lib/auth-helpers'

type Role = 'guest' | 'member' | 'instructor' | 'admin'

const MENU_KEYS = [
  'menu_dashboard',
  'menu_attendance',
  'menu_members',
  'menu_classes',
  'menu_settlements',
  'menu_settings',
] as const

const ROLE_PERMISSIONS: Record<Role, Record<(typeof MENU_KEYS)[number], boolean>> = {
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

const prisma = new PrismaClient()

async function ensureMemberRecord(
  profileId: string,
  phone: string,
  name: string | null | undefined,
  memberType: 'guest' | 'member'
) {
  const existing = await prisma.member.findUnique({
    where: { phone },
    select: { id: true },
  })

  if (existing) {
    await prisma.member.update({
      where: { phone },
      data: {
        profileId,
        type: memberType,
        status: 'active',
      },
    })
    return
  }

  await prisma.member.create({
    data: {
      profileId,
      phone,
      name: name ?? '',
      type: memberType,
      status: 'active',
      joinDate: new Date(),
    },
  })
}

async function syncPermissions(profileId: string, role: Role) {
  const config = ROLE_PERMISSIONS[role]
  for (const key of MENU_KEYS) {
    await prisma.userPermission.upsert({
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
  }
}

async function main() {
  const [, , phoneArg, roleArg] = process.argv

  if (!phoneArg || !roleArg) {
    console.error('Usage: npx tsx scripts/set-role.ts <phone> <guest|member|instructor|admin>')
    process.exit(1)
  }

  const role = roleArg.toLowerCase() as Role
  if (!['guest', 'member', 'instructor', 'admin'].includes(role)) {
    console.error('Role must be one of: guest, member, instructor, admin')
    process.exit(1)
  }

  const phone = normalizePhone(phoneArg)
  if (!phone) {
    console.error('Invalid phone number provided.')
    process.exit(1)
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUnique({
      where: { phone },
      select: { id: true, name: true },
    })

    if (!profile) {
      throw new Error(`Profile not found for phone ${phone}`)
    }

    await tx.profile.update({
      where: { id: profile.id },
      data: { role },
    })

    if (role === 'member' || role === 'guest') {
      await ensureMemberRecord(profile.id, phone, profile.name, role === 'member' ? 'member' : 'guest')
    } else {
      await tx.member.deleteMany({ where: { profileId: profile.id } })
    }

    await syncPermissions(profile.id, role)
  })

  console.log(`✅ Updated role for ${phoneArg} to ${role}`)
}

main()
  .catch((error) => {
    console.error('Failed to update role:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


