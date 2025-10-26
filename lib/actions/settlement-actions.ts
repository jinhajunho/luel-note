'use server'

// ==================== 정산 집계 서버 액션 ====================
// 위치: lib/actions/settlement-actions.ts

import { createClient } from '@/lib/supabase/server'
import type {
  InstructorSettlement,
  MemberSettlement,
  MonthlySettlement,
  SettlementRPCResponse,
  ClassTypeCount,
  PaymentTypeCount
} from '@/types/settlement'

// ==================== 1. 관리자용: 전체 강사 정산 조회 ====================
export async function getAdminSettlements(
  startDate: string,
  endDate: string
): Promise<InstructorSettlement[]> {
  try {
    const supabase = await createClient()

    // RPC 함수 호출
    const { data, error } = await supabase.rpc('get_settlement_data', {
      p_start_date: startDate,
      p_end_date: endDate,
      p_instructor_id: null
    })

    if (error) {
      console.error('❌ 정산 데이터 조회 실패:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // 데이터 가공: 강사별 → 회원별 → 레슨유형/결제타입
    return processSettlementData(data as SettlementRPCResponse[])
  } catch (error) {
    console.error('❌ getAdminSettlements 오류:', error)
    throw error
  }
}

// ==================== 2. 강사용: 본인 월별 정산 조회 ====================
export async function getInstructorMonthlySettlement(
  instructorId: string,
  year: number,
  month: number
): Promise<MonthlySettlement | null> {
  try {
    const supabase = await createClient()

    // RPC 함수 호출
    const { data, error } = await supabase.rpc('get_instructor_monthly_settlement', {
      p_instructor_id: instructorId,
      p_year: year,
      p_month: month
    })

    if (error) {
      console.error('❌ 월별 정산 데이터 조회 실패:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return null
    }

    // 데이터 가공: 회원별 → 레슨유형/결제타입
    const members = processInstructorData(data as SettlementRPCResponse[])
    const totalCount = members.reduce((sum, m) => sum + m.totalCount, 0)

    // 강사 정보 가져오기 (첫 번째 레코드에서)
    const instructorName = await getInstructorName(instructorId)

    return {
      year,
      month,
      instructorId,
      instructorName,
      totalCount,
      members
    }
  } catch (error) {
    console.error('❌ getInstructorMonthlySettlement 오류:', error)
    throw error
  }
}

// ==================== 보조 함수: 강사 이름 조회 ====================
async function getInstructorName(instructorId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('phone', instructorId)
      .single()

    if (error || !data) {
      return '알 수 없음'
    }

    return data.name
  } catch (error) {
    console.error('❌ 강사 이름 조회 실패:', error)
    return '알 수 없음'
  }
}

// ==================== 보조 함수: 전체 정산 데이터 가공 ====================
function processSettlementData(
  data: SettlementRPCResponse[]
): InstructorSettlement[] {
  const instructorMap = new Map<string, InstructorSettlement>()

  data.forEach((row) => {
    const instructorKey = row.instructor_id

    // 강사 레벨
    if (!instructorMap.has(instructorKey)) {
      instructorMap.set(instructorKey, {
        instructorId: row.instructor_id,
        instructorName: row.instructor_name,
        totalCount: 0,
        members: [],
        expanded: false
      })
    }

    const instructor = instructorMap.get(instructorKey)!

    // 회원 찾기 또는 생성
    let member = instructor.members.find((m) => m.memberId === row.member_id)

    if (!member) {
      member = {
        memberId: row.member_id,
        memberName: row.member_name,
        totalCount: 0,
        classTypeCounts: [],
        paymentTypeCounts: [],
        expanded: false
      }
      instructor.members.push(member)
    }

    // 레슨 유형별 집계
    let classTypeCount = member.classTypeCounts.find(
      (c) => c.classType === row.class_type
    )
    if (!classTypeCount) {
      classTypeCount = { classType: row.class_type, count: 0 }
      member.classTypeCounts.push(classTypeCount)
    }
    classTypeCount.count += Number(row.lesson_count)

    // 결제 타입별 집계
    let paymentTypeCount = member.paymentTypeCounts.find(
      (p) => p.paymentType === row.payment_type
    )
    if (!paymentTypeCount) {
      paymentTypeCount = { paymentType: row.payment_type, count: 0 }
      member.paymentTypeCounts.push(paymentTypeCount)
    }
    paymentTypeCount.count += Number(row.lesson_count)

    // 회원 총 횟수 업데이트
    member.totalCount += Number(row.lesson_count)

    // 강사 총 횟수 업데이트
    instructor.totalCount += Number(row.lesson_count)
  })

  return Array.from(instructorMap.values())
}

// ==================== 보조 함수: 강사 정산 데이터 가공 ====================
function processInstructorData(
  data: SettlementRPCResponse[]
): MemberSettlement[] {
  const memberMap = new Map<string, MemberSettlement>()

  data.forEach((row) => {
    const memberKey = row.member_id

    // 회원 찾기 또는 생성
    if (!memberMap.has(memberKey)) {
      memberMap.set(memberKey, {
        memberId: row.member_id,
        memberName: row.member_name,
        totalCount: 0,
        classTypeCounts: [],
        paymentTypeCounts: [],
        expanded: false
      })
    }

    const member = memberMap.get(memberKey)!

    // 레슨 유형별 집계
    let classTypeCount = member.classTypeCounts.find(
      (c) => c.classType === row.class_type
    )
    if (!classTypeCount) {
      classTypeCount = { classType: row.class_type, count: 0 }
      member.classTypeCounts.push(classTypeCount)
    }
    classTypeCount.count += Number(row.lesson_count)

    // 결제 타입별 집계
    let paymentTypeCount = member.paymentTypeCounts.find(
      (p) => p.paymentType === row.payment_type
    )
    if (!paymentTypeCount) {
      paymentTypeCount = { paymentType: row.payment_type, count: 0 }
      member.paymentTypeCounts.push(paymentTypeCount)
    }
    paymentTypeCount.count += Number(row.lesson_count)

    // 회원 총 횟수 업데이트
    member.totalCount += Number(row.lesson_count)
  })

  return Array.from(memberMap.values())
}

// ==================== 3. 검색 기능 (클라이언트 측) ====================
// 이 함수는 클라이언트에서 사용하기 위한 유틸리티 함수입니다
// 서버 액션이 아니므로 'use client' 컴포넌트에서 사용하세요

export function filterSettlementsByQuery(
  instructors: InstructorSettlement[],
  query: string
): InstructorSettlement[] {
  if (!query.trim()) {
    return instructors
  }

  const lowerQuery = query.toLowerCase()

  return instructors
    .map((instructor) => {
      // 강사 이름 매치
      const instructorMatch = instructor.instructorName.toLowerCase().includes(lowerQuery)

      // 회원 이름 매치
      const matchedMembers = instructor.members.filter((member) =>
        member.memberName.toLowerCase().includes(lowerQuery)
      )

      // 강사 이름이 매치되거나, 매치된 회원이 있으면 포함
      if (instructorMatch || matchedMembers.length > 0) {
        return {
          ...instructor,
          members: instructorMatch ? instructor.members : matchedMembers
        }
      }

      return null
    })
    .filter((instructor) => instructor !== null) as InstructorSettlement[]
}
