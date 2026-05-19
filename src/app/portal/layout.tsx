import { Metadata } from 'next'
import PortalLayoutClient from './PortalLayoutClient'

export const metadata: Metadata = {
  title: 'ผู้ใหญ่ลี - ระบบแจ้งเหตุ',
  description: 'พอร์ทัลสำหรับประชาชนในการแจ้งปัญหาและร้องเรียน ผู้ใหญ่ลี',
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayoutClient>{children}</PortalLayoutClient>
}
