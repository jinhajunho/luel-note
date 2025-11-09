"use server"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthenticatedProfile } from '@/lib/server/getAuthenticatedProfile'

type RouteContext = {
  params: Promise<{
    notificationId: string
  }>
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { notificationId } = await context.params
    if (!notificationId) {
      return NextResponse.json({ error: '알림 ID가 필요합니다.' }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    const read = typeof body?.read === 'boolean' ? body.read : undefined
    if (typeof read === 'undefined') {
      return NextResponse.json({ error: '읽음 상태(read)를 전달해주세요.' }, { status: 400 })
    }

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, profileId: profile.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '알림을 찾을 수 없습니다.' }, { status: 404 })
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read,
        readAt: read ? new Date() : null,
      },
    })

    return NextResponse.json({
      data: {
        id: updated.id,
        read: updated.read,
        readAt: updated.readAt ? updated.readAt.toISOString() : null,
      },
    })
  } catch (error) {
    console.error('알림 API: 업데이트 실패', error)
    return NextResponse.json({ error: '알림을 업데이트하는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const { notificationId } = await context.params
    if (!notificationId) {
      return NextResponse.json({ error: '알림 ID가 필요합니다.' }, { status: 400 })
    }

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, profileId: profile.id },
    })

    if (!existing) {
      return NextResponse.json({ error: '알림을 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.notification.delete({ where: { id: notificationId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('알림 API: 삭제 실패', error)
    return NextResponse.json({ error: '알림을 삭제하는 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
