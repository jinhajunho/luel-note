'use server'

import { prisma } from '@/lib/db/prisma'

/**
 * 프로필 ID로 회원 ID 가져오기
 */
export async function getMemberIdByProfileId(profileId: string): Promise<string | null> {
  try {
    const member = await prisma.member.findFirst({
      where: { profileId },
      select: { id: true },
    })

    return member?.id ?? null
  } catch (error) {
    console.error('회원 ID 조회 실패:', error)
    return null
  }
}
