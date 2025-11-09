"use server"

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getAuthenticatedProfile } from '@/lib/server/getAuthenticatedProfile'

export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: notices.map((notice) => ({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        createdAt: notice.createdAt?.toISOString() ?? null,
        updatedAt: notice.updatedAt?.toISOString() ?? null,
        author: notice.author
          ? {
              id: notice.author.id,
              name: notice.author.name,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('공지 API: 목록 조회 실패', error)
    return NextResponse.json(
      { error: '공지사항을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getAuthenticatedProfile()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '관리자만 공지를 작성할 수 있습니다.' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const content = typeof body?.content === 'string' ? body.content.trim() : ''

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용을 모두 입력해주세요.' }, { status: 400 })
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        authorId: profile.id,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    })

    // 모든 프로필에 알림 발송
    try {
      const profiles = await prisma.profile.findMany({ select: { id: true } })
      if (profiles.length > 0) {
        const now = new Date()
        const data = profiles.map((p) => ({
          profileId: p.id,
          title: notice.title,
          message: content,
          type: 'notice',
          read: p.id === profile.id,
          readAt: p.id === profile.id ? now : null,
        }))
        await prisma.notification.createMany({ data })
      }
    } catch (error) {
      console.error('공지 알림 생성 실패:', error)
    }

    return NextResponse.json(
      {
        data: {
          id: notice.id,
          title: notice.title,
          content: notice.content,
          createdAt: notice.createdAt?.toISOString() ?? null,
          updatedAt: notice.updatedAt?.toISOString() ?? null,
          author: notice.author
            ? {
                id: notice.author.id,
                name: notice.author.name,
              }
            : null,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('공지 API: 공지 작성 실패', error)
    return NextResponse.json(
      { error: '공지사항을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

