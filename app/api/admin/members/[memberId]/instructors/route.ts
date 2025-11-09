export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{
    memberId: string
  }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { memberId } = await context.params

  if (!memberId) {
    return NextResponse.json({ instructorIds: [] }, { status: 400 })
  }

  try {
    const assignments = await prisma.instructorMember.findMany({
      where: { memberId },
      select: { instructorId: true },
    })

    const instructorIds = assignments
      .map((assignment) => assignment.instructorId)
      .filter((id): id is string => Boolean(id))

    return NextResponse.json({ instructorIds })
  } catch (error) {
    console.error('강사 목록 조회 실패:', error)
    return NextResponse.json({ instructorIds: [] }, { status: 500 })
  }
}

