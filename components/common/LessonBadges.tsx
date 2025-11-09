"use client"

import { Sparkles, User, Users, UsersRound, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { getLessonTypes, colorToLessonTypeClass } from '@/lib/utils/lesson-types'

export type LessonType = '인트로' | '개인레슨' | '듀엣레슨' | '그룹레슨'
export type LessonStatus = '예정' | '완료' | '취소'

// 동적 아이콘 결정 (최대 인원에 따라)
const getIcon = (maxMembers: number) => {
  if (maxMembers === 1) return User
  if (maxMembers === 2) return Users
  if (maxMembers >= 3) return UsersRound
  return Sparkles // 기본값
}

// 기본 타입별 아이콘 매핑 (하위 호환 - 레슨 타입 정보가 없을 때)
const getDefaultIcon = (type: string) => {
  switch (type) {
    case '인트로': return Sparkles
    case '개인레슨': return User
    case '듀엣레슨': return Users
    case '그룹레슨': return UsersRound
    default: return UsersRound
  }
}

const statusClasses: Record<LessonStatus, string> = {
  예정: 'text-blue-600 bg-blue-50',
  완료: 'text-green-600 bg-green-50',
  취소: 'text-red-600 bg-red-50',
}

export function LessonTypeBadge({ type }: { type: string }) {
  const lessonTypes = typeof window !== 'undefined' ? getLessonTypes() : []
  const lessonType = lessonTypes.find(lt => lt.name === type)
  
  // 동적 색상 사용
  const colorClass = lessonType ? colorToLessonTypeClass(lessonType.color) : 'bg-gray-500 text-white'
  // 아이콘 (최대 인원에 따라 동적으로 결정)
  const Icon = lessonType ? getIcon(lessonType.maxMembers) : getDefaultIcon(type)
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {type}
    </span>
  )
}

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  const Icon = status === '예정' ? Clock : status === '완료' ? CheckCircle2 : XCircle
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${statusClasses[status]}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}


