'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  InstructorSettlement,
  MemberSettlement,
  InstructorSettlementData,
  MemberSummary,
  SettlementRow
} from '@/types/settlement'

/**
 * 관리자용: 전체 강사 정산 데이터 조회
 */
export async function getAdminSettlementData(
  startDate: string,
  endDate: string
): Promise<InstructorSettlement[]> {
  const supabase = await createClient()

  try {
    // Supabase RPC 함수 호출
    const { data, error } = await supabase.rpc('get_admin_settlement_data', {
      p_start_date: startDate,
      p_end_date: endDate
    })

    if (error) {
      console.error('❌ 정산 데이터 조회 실패:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return []
    }

    // DB 결과를 InstructorSettlement 형식으로 변환
    return transformToInstructorSettlements(data)
  } catch (error) {
    console.error('❌ getAdminSettlementData 오류:', error)
    throw error
  }
}

/**
 * 강사용: 본인 정산 데이터 조회
 */
export async function getInstructorSettlementData(
  instructorId: string,
  year: number,
  month: number
): Promise<InstructorSettlementData | null> {
  const supabase = await createClient()

  try {
    // Supabase RPC 함수 호출
    const { data, error } = await supabase.rpc('get_instructor_settlement_data', {
      p_instructor_id: instructorId,
      p_year: year,
      p_month: month
    })

    if (error) {
      console.error('❌ 강사 정산 데이터 조회 실패:', error)
      throw error
    }

    if (!data || data.length === 0) {
      return null
    }

    // DB 결과를 InstructorSettlementData 형식으로 변환
    return transformToInstructorSettlementData(data, year, month)
  } catch (error) {
    console.error('❌ getInstructorSettlementData 오류:', error)
    throw error
  }
}

/**
 * DB 결과를 InstructorSettlement[] 형식으로 변환
 */
function transformToInstructorSettlements(
  rows: SettlementRow[]
): InstructorSettlement[] {
  const instructorMap = new Map<string, InstructorSettlement>()

  rows.forEach((row) => {
    // 강사가 없으면 생성
    if (!instructorMap.has(row.instructor_id)) {
      instructorMap.set(row.instructor_id, {
        instructorId: row.instructor_id,
        instructorName: row.instructor_name,
        totalSessions: 0,
        members: [],
        expanded: false
      })
    }

    const instructor = instructorMap.get(row.instructor_id)!

    // 회원 찾기 또는 생성
    let member = instructor.members.find((m) => m.memberId === row.member_id)
    if (!member) {
      member = {
        memberId: row.member_id,
        memberName: row.member_name,
        totalSessions: 0,
        lessonTypes: {
          intro: 0,
          personal: 0,
          duet: 0,
          group: 0
        },
        paymentTypes: {
          trial: 0,
          regular: 0,
          instructor: 0,
          center: 0
        },
        expanded: false
      }
      instructor.members.push(member)
    }

    // 레슨 타입 집계
    const classType = row.class_type_name
    if (classType === '인트로') member.lessonTypes.intro += row.session_count
    else if (classType === '개인레슨') member.lessonTypes.personal += row.session_count
    else if (classType === '듀엣레슨') member.lessonTypes.duet += row.session_count
    else if (classType === '그룹레슨') member.lessonTypes.group += row.session_count

    // 결제 타입 집계
    const paymentType = row.payment_type_name
    if (paymentType === '체험수업') member.paymentTypes.trial += row.session_count
    else if (paymentType === '정규수업') member.paymentTypes.regular += row.session_count
    else if (paymentType === '강사제공') member.paymentTypes.instructor += row.session_count
    else if (paymentType === '센터제공') member.paymentTypes.center += row.session_count

    // 합계 업데이트
    member.totalSessions += row.session_count
    instructor.totalSessions += row.session_count
  })

  return Array.from(instructorMap.values())
}

/**
 * DB 결과를 InstructorSettlementData 형식으로 변환
 */
function transformToInstructorSettlementData(
  rows: SettlementRow[],
  year: number,
  month: number
): InstructorSettlementData {
  const memberMap = new Map<string, MemberSummary>()
  let instructorName = ''
  let totalCount = 0

  rows.forEach((row) => {
    if (!instructorName) {
      instructorName = row.instructor_name
    }

    // 회원 찾기 또는 생성
    if (!memberMap.has(row.member_id)) {
      memberMap.set(row.member_id, {
        memberName: row.member_name,
        classTypeCounts: [],
        paymentTypeCounts: [],
        totalCount: 0
      })
    }

    const member = memberMap.get(row.member_id)!

    // 레슨 타입 집계
    const classTypeCount = member.classTypeCounts.find(
      (ct) => ct.classType === row.class_type_name
    )
    if (classTypeCount) {
      classTypeCount.count += row.session_count
    } else {
      member.classTypeCounts.push({
        classType: row.class_type_name,
        count: row.session_count
      })
    }

    // 결제 타입 집계
    const paymentTypeCount = member.paymentTypeCounts.find(
      (pt) => pt.paymentType === row.payment_type_name
    )
    if (paymentTypeCount) {
      paymentTypeCount.count += row.session_count
    } else {
      member.paymentTypeCounts.push({
        paymentType: row.payment_type_name,
        count: row.session_count
      })
    }

    member.totalCount += row.session_count
    totalCount += row.session_count
  })

  return {
    instructorName,
    year,
    month,
    members: Array.from(memberMap.values()),
    totalCount
  }
}
