import { Metadata } from 'next'
import AdminLayoutClient from '@/components/AdminLayoutClient'

export const metadata: Metadata = {
  title: 'ระบบจัดการ - ระบบแจ้งเหตุผู้ใหญ่ลี',
  description: 'ระบบจัดการคำร้องร้องเรียนสำหรับเจ้าหน้าที่',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
