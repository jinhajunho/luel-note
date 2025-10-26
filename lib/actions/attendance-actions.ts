'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 출석 시스템 서버 액션
 * 
 * 핵심 기능:
 * 1. 출석 체크 시 회원권 자동 차감
 * 2. 레슨의 payment_type_id에 맞는 회원권에서만 차감
 * 3. class_members 테이블에 membership_package_id 저장
 */

// ==================== 타입 정의 ====================

type AttendanceStatus = 'present' | 'absent' | null

interface AttendanceData {
  memberId: string
  attended: boolean | null
  checkInTime?: string
}

interface AttendanceResult {
  success: boolean
  message: string
  error?: string
}

// ==================== 출석 토글 ====================

/**
 * 개별 회원 출석 상태 토글
 * 출석 체크 시 회원권 자동 차감
 */
export async function toggleAttendance(
  classId: string,
  memberId: string,
  currentStatus: boolean | null
): Promise<AttendanceResult> {
  try {
    const supabase = await createClient()

    // 새로운 출석 상태 결정
    let newStatus: boolean | null
    if (currentStatus === null) {
      newStatus = true  // null → 출석
    } else if (currentStatus === true) {
      newStatus = false  // 출석 → 결석
    } else {
      newStatus = true  // 결석 → 출석
    }

    // 레슨 정보 조회 (payment_type_id 필요)
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('payment_type_id')
      .eq('id', classId)
      .single()

    if (classError) {
      return {
        success: false,
        message: '레슨 정보를 찾을 수 없습니다.',
        error: classError.message
      }
    }

    // class_members 데이터 조회
    const { data: classMember, error: classMemberError } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', classId)
      .eq('member_id', memberId)
      .single()

    if (classMemberError) {
      return {
        success: false,
        message: '출석 정보를 찾을 수 없습니다.',
        error: classMemberError.message
      }
    }

    // 출석 처리
    if (newStatus === true) {
      // ========== 출석 체크: 회원권 차감 ==========

      // 1. 해당 결제 타입의 활성 회원권 찾기
      const { data: membershipPackage, error: packageError } = await supabase
        .from('membership_packages')
        .select('*')
        .eq('member_id', memberId)
        .eq('payment_type_id', classData.payment_type_id)
        .eq('status', 'active')
        .gt('remaining_lessons', 0)
        .order('end_date', { ascending: true })  // 만료일이 가까운 순
        .limit(1)
        .single()

      if (packageError || !membershipPackage) {
        return {
          success: false,
          message: '사용 가능한 회원권이 없습니다. 해당 결제 타입의 회원권을 먼저 등록하세요.',
          error: packageError?.message
        }
      }

      // 2. 회원권 차감
      const { error: deductError } = await supabase
        .from('membership_packages')
        .update({
          remaining_lessons: membershipPackage.remaining_lessons - 1,
          used_lessons: membershipPackage.used_lessons + 1,
          status: membershipPackage.remaining_lessons - 1 === 0 ? 'exhausted' : 'active'
        })
        .eq('id', membershipPackage.id)

      if (deductError) {
        return {
          success: false,
          message: '회원권 차감에 실패했습니다.',
          error: deductError.message
        }
      }

      // 3. class_members 업데이트 (출석 + 회원권 ID + 체크인 시간)
      const checkInTime = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('class_members')
        .update({
          attended: true,
          check_in_time: checkInTime,
          membership_package_id: membershipPackage.id
        })
        .eq('id', classMember.id)

      if (updateError) {
        // 실패 시 회원권 복구
        await supabase
          .from('membership_packages')
          .update({
            remaining_lessons: membershipPackage.remaining_lessons,
            used_lessons: membershipPackage.used_lessons,
            status: membershipPackage.status
          })
          .eq('id', membershipPackage.id)

        return {
          success: false,
          message: '출석 체크에 실패했습니다.',
          error: updateError.message
        }
      }

      revalidatePath('/admin/attendance')
      revalidatePath('/instructor/attendance')
      revalidatePath('/member/attendance')

      return {
        success: true,
        message: '출석 체크 완료! 회원권이 차감되었습니다.'
      }

    } else if (newStatus === false) {
      // ========== 결석 처리 ==========

      const { error: updateError } = await supabase
        .from('class_members')
        .update({
          attended: false,
          check_in_time: null,
          membership_package_id: null
        })
        .eq('id', classMember.id)

      if (updateError) {
        return {
          success: false,
          message: '결석 처리에 실패했습니다.',
          error: updateError.message
        }
      }

      revalidatePath('/admin/attendance')
      revalidatePath('/instructor/attendance')
      revalidatePath('/member/attendance')

      return {
        success: true,
        message: '결석 처리되었습니다.'
      }

    } else {
      // ========== 출석 취소 (출석 → null, 회원권 복구) ==========

      if (classMember.membership_package_id) {
        // 회원권 복구
        const { data: packageData } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('id', classMember.membership_package_id)
          .single()

        if (packageData) {
          await supabase
            .from('membership_packages')
            .update({
              remaining_lessons: packageData.remaining_lessons + 1,
              used_lessons: packageData.used_lessons - 1,
              status: 'active'
            })
            .eq('id', packageData.id)
        }
      }

      const { error: updateError } = await supabase
        .from('class_members')
        .update({
          attended: null,
          check_in_time: null,
          membership_package_id: null
        })
        .eq('id', classMember.id)

      if (updateError) {
        return {
          success: false,
          message: '출석 취소에 실패했습니다.',
          error: updateError.message
        }
      }

      revalidatePath('/admin/attendance')
      revalidatePath('/instructor/attendance')
      revalidatePath('/member/attendance')

      return {
        success: true,
        message: '출석이 취소되었습니다.'
      }
    }

  } catch (error) {
    console.error('❌ 출석 처리 오류:', error)
    return {
      success: false,
      message: '출석 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

// ==================== 레슨 완료 ====================

/**
 * 레슨 완료 처리
 * - 출석하지 않은 회원은 자동으로 결석 처리
 * - 레슨 상태를 'completed'로 변경
 */
export async function completeClass(classId: string): Promise<AttendanceResult> {
  try {
    const supabase = await createClient()

    // 1. class_members 조회
    const { data: classMembers, error: membersError } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', classId)

    if (membersError) {
      return {
        success: false,
        message: '레슨 정보를 찾을 수 없습니다.',
        error: membersError.message
      }
    }

    // 2. 출석 체크되지 않은 회원들 자동 결석 처리
    const unmarkedMembers = classMembers.filter(m => m.attended === null)
    for (const member of unmarkedMembers) {
      await supabase
        .from('class_members')
        .update({
          attended: false,
          check_in_time: null,
          membership_package_id: null
        })
        .eq('id', member.id)
    }

    // 3. 레슨 상태 변경 (scheduled → completed)
    const { error: classError } = await supabase
      .from('classes')
      .update({ status: 'completed' })
      .eq('id', classId)

    if (classError) {
      return {
        success: false,
        message: '레슨 완료 처리에 실패했습니다.',
        error: classError.message
      }
    }

    revalidatePath('/admin/attendance')
    revalidatePath('/instructor/attendance')
    revalidatePath('/admin/classes')
    revalidatePath('/instructor/lessons')

    return {
      success: true,
      message: '레슨이 완료되었습니다!'
    }

  } catch (error) {
    console.error('❌ 레슨 완료 오류:', error)
    return {
      success: false,
      message: '레슨 완료 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

// ==================== 레슨 취소 ====================

/**
 * 레슨 취소 처리
 * - 모든 출석 기록 삭제
 * - 차감된 회원권 복구
 * - 레슨 상태를 'cancelled'로 변경
 */
export async function cancelClass(classId: string): Promise<AttendanceResult> {
  try {
    const supabase = await createClient()

    // 1. class_members 조회
    const { data: classMembers, error: membersError } = await supabase
      .from('class_members')
      .select('*')
      .eq('class_id', classId)

    if (membersError) {
      return {
        success: false,
        message: '레슨 정보를 찾을 수 없습니다.',
        error: membersError.message
      }
    }

    // 2. 출석한 회원들의 회원권 복구
    for (const member of classMembers) {
      if (member.attended === true && member.membership_package_id) {
        const { data: packageData } = await supabase
          .from('membership_packages')
          .select('*')
          .eq('id', member.membership_package_id)
          .single()

        if (packageData) {
          await supabase
            .from('membership_packages')
            .update({
              remaining_lessons: packageData.remaining_lessons + 1,
              used_lessons: packageData.used_lessons - 1,
              status: 'active'
            })
            .eq('id', packageData.id)
        }
      }

      // class_members 초기화
      await supabase
        .from('class_members')
        .update({
          attended: null,
          check_in_time: null,
          membership_package_id: null
        })
        .eq('id', member.id)
    }

    // 3. 레슨 상태 변경 (scheduled → cancelled)
    const { error: classError } = await supabase
      .from('classes')
      .update({ status: 'cancelled' })
      .eq('id', classId)

    if (classError) {
      return {
        success: false,
        message: '레슨 취소 처리에 실패했습니다.',
        error: classError.message
      }
    }

    revalidatePath('/admin/attendance')
    revalidatePath('/instructor/attendance')
    revalidatePath('/admin/classes')
    revalidatePath('/instructor/lessons')

    return {
      success: true,
      message: '레슨이 취소되었습니다. 회원권이 복구되었습니다.'
    }

  } catch (error) {
    console.error('❌ 레슨 취소 오류:', error)
    return {
      success: false,
      message: '레슨 취소 처리 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

// ==================== 출석 기록 조회 ====================

/**
 * 관리자/강사용 출석 기록 조회
 */
export async function getAttendanceHistory(
  role: 'admin' | 'instructor',
  userId?: string,
  startDate?: string,
  endDate?: string
) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('classes')
      .select(`
        *,
        class_type:class_types(name, color),
        payment_type:payment_types(name, color),
        instructor:profiles!classes_instructor_id_fkey(name),
        class_members(
          *,
          member:members(name, phone),
          membership_package:membership_packages(payment_type_id)
        )
      `)
      .eq('status', 'completed')
      .order('date', { ascending: false })
      .order('time', { ascending: false })

    // 강사는 본인 레슨만
    if (role === 'instructor' && userId) {
      query = query.eq('instructor_id', userId)
    }

    // 날짜 필터
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ 출석 기록 조회 오류:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }

  } catch (error) {
    console.error('❌ 출석 기록 조회 오류:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

/**
 * 회원용 출석 기록 조회
 */
export async function getMemberAttendanceHistory(memberId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('class_members')
      .select(`
        *,
        class:classes(
          date,
          time,
          class_type:class_types(name),
          payment_type:payment_types(name),
          instructor:profiles!classes_instructor_id_fkey(name)
        )
      `)
      .eq('member_id', memberId)
      .not('attended', 'is', null)
      .order('class.date', { ascending: false })

    if (error) {
      console.error('❌ 출석 기록 조회 오류:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }

  } catch (error) {
    console.error('❌ 출석 기록 조회 오류:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}
