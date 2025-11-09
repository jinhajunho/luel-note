"use server"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthenticatedProfile } from '@/lib/server/getAuthenticatedProfile'

type RouteContext = {
  params: Promise<{
    noticeId: string
  }>
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '관리자만 공지를 삭제할 수 있습니다.' }, { status: 403 })
    }

    const { noticeId } = await context.params
    if (!noticeId) {
      return NextResponse.json({ error: '공지 ID가 필요합니다.' }, { status: 400 })
    }

    await prisma.notice.delete({
      where: { id: noticeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('공지 API: 공지 삭제 실패', error)
    return NextResponse.json(
      { error: '공지사항을 삭제하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

