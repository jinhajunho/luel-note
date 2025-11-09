import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ID_TOKEN_COOKIE_NAME, ROLE_COOKIE_NAME } from '@/lib/cognito/session'

// 인증이 필요 없는 공개 경로
const PUBLIC_ROUTES = ['/login', '/signup']

// 권한별 접근 가능 경로
const ROLE_ROUTES = {
  admin: ['/admin', '/instructor', '/member'],
  instructor: ['/instructor', '/member'],
  member: ['/member'],
  guest: ['/member'],
} as const

type RoleKey = keyof typeof ROLE_ROUTES

function getDefaultRoute(role: RoleKey) {
  if (role === 'guest') {
    return '/member/schedule'
  }
  return `/${role}/schedule`
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로와 대부분의 페이지는 인증 체크 건너뜀
  if (
    PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next()
  }

  // 관리자/강사/회원 보호 경로만 검사
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/member')

  if (!isProtectedPath) {
    return NextResponse.next()
  }

  try {
    const idToken = request.cookies.get(ID_TOKEN_COOKIE_NAME)?.value

    if (!idToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value
    const allowedRoles: RoleKey[] = ['admin', 'instructor', 'member', 'guest']
    const role: RoleKey = allowedRoles.includes(roleCookie as RoleKey)
      ? (roleCookie as RoleKey)
      : 'guest'

    // 승인 대기 페이지 제거 (더 이상 필요 없음)
    if (pathname === '/pending') {
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
    }

    // 4. 역할별 접근 권한 체크
    const allowedRoutes = ROLE_ROUTES[role]

    if (!allowedRoutes) {
      // 알 수 없는 역할 → 로그인 페이지로
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 접근 가능한 경로인지 확인
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route))

    if (!hasAccess) {
      // 접근 권한 없음 → 해당 역할의 기본 페이지로
      return NextResponse.redirect(new URL(getDefaultRoute(role), request.url))
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
