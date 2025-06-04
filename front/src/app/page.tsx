'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthCookie } from '@/lib/auth'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const token = getAuthCookie()
    
    if (!token) {
      router.push('/login')
    } else {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>
  )
}
