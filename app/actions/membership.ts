'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ==================== 타입 정의 ====================
export interface MembershipPackage {
  id: string
  member_id: string
  payment_type_id: string
  payment_type_name: string
  payment_type_color: string
  total_lessons: number
  remaining_lessons: number
  used_lessons: number
  start_date: string
  end_date: string | null
  status: 'active' | 'expired' | 'exhausted'
  created_at: string
}

export interface CreateMembershipInput {
  member_id: string
  payment_type_id: string
  total_lessons: number
  start_date: string
  end_date: string | null
}

// ==================== 회원권 조회 ====================

/**
 * 회원의 모든 회원권 조회
 */
export async function getMemberPasses(memberId: string): Promise<MembershipPackage[]> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .rpc('get_member_passes', { p_member_id: memberId })
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('회원권 조회 실패:', error)
    throw new Error('회원권 조회에 실패했습니다')
  }
}

/**
 * 회원의 총 잔여 횟수 조회
 */
export async function getMemberTotalRemaining(memberId: string): Promise<number> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .rpc('get_member_total_remaining', { p_member_id: memberId })
    
    if (error) throw error
    
    return data || 0
  } catch (error) {
    console.error('잔여 횟수 조회 실패:', error)
    return 0
  }
}

/**
 * 특정 회원권 조회
 */
export async function getMembershipPackage(packageId: string): Promise<MembershipPackage | null> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('membership_packages')
      .select(`
        *,
        payment_type:payment_types (
          name,
          color
        )
      `)
      .eq('id', packageId)
      .single()
    
    if (error) throw error
    
    if (!data) return null
    
    return {
      id: data.id,
      member_id: data.member_id,
      payment_type_id: data.payment_type_id,
      payment_type_name: data.payment_type.name,
      payment_type_color: data.payment_type.color,
      total_lessons: data.total_lessons,
      remaining_lessons: data.remaining_lessons,
      used_lessons: data.used_lessons,
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      created_at: data.created_at
    }
  } catch (error) {
    console.error('회원권 조회 실패:', error)
    return null
  }
}

// ==================== 회원권 생성 ====================

/**
 * 새 회원권 생성
 */
export async function createMembershipPackage(input: CreateMembershipInput) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('membership_packages')
      .insert({
        member_id: input.member_id,
        payment_type_id: input.payment_type_id,
        total_lessons: input.total_lessons,
        remaining_lessons: input.total_lessons,
        used_lessons: 0,
        start_date: input.start_date,
        end_date: input.end_date,
        status: 'active'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // 페이지 재검증
    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')
    
    return { success: true, data }
  } catch (error) {
    console.error('회원권 생성 실패:', error)
    return { success: false, error: '회원권 생성에 실패했습니다' }
  }
}

// ==================== 회원권 수정 ====================

/**
 * 회원권 수정
 */
export async function updateMembershipPackage(
  packageId: string,
  updates: Partial<CreateMembershipInput>
) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('membership_packages')
      .update(updates)
      .eq('id', packageId)
      .select()
      .single()
    
    if (error) throw error
    
    // 페이지 재검증
    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')
    
    return { success: true, data }
  } catch (error) {
    console.error('회원권 수정 실패:', error)
    return { success: false, error: '회원권 수정에 실패했습니다' }
  }
}

// ==================== 회원권 삭제 ====================

/**
 * 회원권 삭제
 */
export async function deleteMembershipPackage(packageId: string) {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('membership_packages')
      .delete()
      .eq('id', packageId)
    
    if (error) throw error
    
    // 페이지 재검증
    revalidatePath('/admin/members')
    revalidatePath('/instructor/members')
    
    return { success: true }
  } catch (error) {
    console.error('회원권 삭제 실패:', error)
    return { success: false, error: '회원권 삭제에 실패했습니다' }
  }
}

// ==================== 회원권 차감 ====================

/**
 * 출석 시 회원권 차감
 */
export async function deductMembershipLesson(
  memberId: string,
  paymentTypeId: string
) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .rpc('deduct_membership_lesson', {
        p_member_id: memberId,
        p_payment_type_id: paymentTypeId
      })
      .single()
    
    if (error) throw error
    
    if (!data.success) {
      return { success: false, error: data.message }
    }
    
    // 페이지 재검증
    revalidatePath('/admin/attendance')
    revalidatePath('/instructor/attendance')
    
    return { success: true, packageId: data.package_id }
  } catch (error) {
    console.error('회원권 차감 실패:', error)
    return { success: false, error: '회원권 차감에 실패했습니다' }
  }
}

// ==================== 결제 타입 조회 ====================

/**
 * 모든 결제 타입 조회
 */
export async function getPaymentTypes() {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('payment_types')
      .select('*')
      .order('id')
    
    if (error) throw error
    
    return data || []
  } catch (error) {
    console.error('결제 타입 조회 실패:', error)
    return []
  }
}
