import { Metadata } from 'next'
import PortalLayoutClient from './PortalLayoutClient'

export const metadata: Metadata = {
  title: 'อบต. โค้ดมันเดย์ - ระบบแจ้งเหตุ',
  description: 'พอร์ทัลสำหรับประชาชนในการแจ้งปัญหาและร้องเรียน อบต. โค้ดมันเดย์',
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayoutClient>{children}</PortalLayoutClient>
}
