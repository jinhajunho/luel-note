import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 인증이 필요 없는 공개 경로
const PUBLIC_ROUTES = ['/login', '/signup']

// 권한별 접근 가능 경로
const ROLE_ROUTES = {
  admin: ['/admin', '/instructor', '/member'],
  instructor: ['/instructor', '/member'],
  member: ['/member']
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 공개 경로는 인증 체크 안 함
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    const supabase = await createClient()
    
    // 1. 세션 확인
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // 로그인 안 됨 → 로그인 페이지로
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. 프로필 조회 (role 확인)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, phone')
      .eq('auth_id', user.id)
      .single()

    if (!profile) {
      // 프로필 없음 → 로그인 페이지로
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 3. 권한 체크
    const role = profile.role

    // 권한이 없으면 승인 대기 페이지로
    if (!role) {
      if (pathname !== '/pending') {
        return NextResponse.redirect(new URL('/pending', request.url))
      }
      return NextResponse.next()
    }

    // 승인 대기 페이지는 권한이 있으면 접근 불가
    if (pathname === '/pending') {
      return NextResponse.redirect(new URL(`/${role}/schedule`, request.url))
    }

    // 4. 역할별 접근 권한 체크
    const allowedRoutes = ROLE_ROUTES[role as keyof typeof ROLE_ROUTES]
    
    if (!allowedRoutes) {
      // 알 수 없는 역할 → 로그인 페이지로
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 접근 가능한 경로인지 확인
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))
    
    if (!hasAccess) {
      // 접근 권한 없음 → 해당 역할의 기본 페이지로
      return NextResponse.redirect(new URL(`/${role}/schedule`, request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Middleware 오류:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
