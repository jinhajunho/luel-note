// app/actions/payment-types.ts
'use server'

import { prisma } from '@/lib/db/prisma'

export async function getPaymentTypes() {
  try {
    const types = await prisma.paymentType.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, color: true },
    })

    return types.map((type) => ({
      id: type.id,
      value: type.id,
      label: type.name ?? '',
      name: type.name ?? '',
      color: type.color ?? '',
    }))
  } catch (error) {
    console.error('결제 타입 조회 오류:', error)
    return []
  }
}
