"use server"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthenticatedProfile } from '@/lib/server/getAuthenticatedProfile'

function mapNotification(notification: any) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message ?? null,
    type: notification.type,
    read: notification.read,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt ? notification.createdAt.toISOString() : null,
  }
}

export async function GET() {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({
      data: notifications.map(mapNotification),
    })
  } catch (error) {
    console.error('알림 API: 목록 조회 실패', error)
    return NextResponse.json({ error: '알림을 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const type = typeof body?.type === 'string' ? body.type.trim() : 'custom'

    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다.' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        profileId: profile.id,
        title,
        message: message || null,
        type,
      },
    })

    return NextResponse.json({ data: mapNotification(notification) }, { status: 201 })
  } catch (error) {
    console.error('알림 API: 생성 실패', error)
    return NextResponse.json({ error: '알림을 생성하는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

