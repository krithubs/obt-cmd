import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ระบบแจ้งเหตุ อบต',
  description: 'ระบบร้องเรียนปัญหาขององค์การบริหารส่วนตำบล',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
