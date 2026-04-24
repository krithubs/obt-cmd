import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')
    const action = searchParams.get('action')

    const where: any = {}
    if (resource && resource !== 'ALL') where.resource = resource
    if (action && action !== 'ALL') where.action = action

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    })
    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึกการทำงาน' },
      { status: 500 }
    )
  }
}
