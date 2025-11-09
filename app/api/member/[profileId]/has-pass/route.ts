export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{
    profileId: string
  }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { profileId } = await context.params

  if (!profileId) {
    return NextResponse.json({ hasPass: false }, { status: 400 })
  }

  try {
    const member = await prisma.member.findFirst({
      where: { profileId },
      select: { id: true },
    })

    if (!member) {
      return NextResponse.json({ hasPass: false })
    }

    const count = await prisma.membershipPackage.count({
      where: {
        memberId: member.id,
        status: 'active',
        remainingLessons: { gt: 0 },
      },
    })

    return NextResponse.json({ hasPass: count > 0 })
  } catch (error) {
    console.error('회원권 보유 여부 조회 실패:', error)
    return NextResponse.json({ hasPass: false }, { status: 500 })
  }
}

