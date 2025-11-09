"use server"

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthenticatedProfile } from '@/lib/server/getAuthenticatedProfile'

export async function POST() {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const now = new Date()
    await prisma.notification.updateMany({
      where: { profileId: profile.id, read: false },
      data: { read: true, readAt: now },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('알림 API: 전체 읽음 처리 실패', error)
    return NextResponse.json({ error: '알림을 업데이트하는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

