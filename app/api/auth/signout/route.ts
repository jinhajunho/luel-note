import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/cognito/session'

export async function POST() {
  clearAuthCookies()
  return NextResponse.json({ success: true })
}

