'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageLoading } from '@/components/ui'

export default function PortalHome() {
  const router = useRouter()

  useEffect(() => {
    router.push('/portal')
  }, [router])

  return <PageLoading text="กำลังโหลด..." bgClass="bg-gray-50" />
}
