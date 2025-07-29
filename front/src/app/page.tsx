'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession } from '@/lib/api/sign'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await checkSession()
        if (response.success) {
          console.log("세션이 유효하므로 대시보드로 이동")
          router.push('/dashboard')
        } else {
          console.log("세션이 유효하지 않으므로 로그인으로 이동")
          router.push('/login')
        }
      } catch (error) {
        console.error("세션 확인 실패:", error)
        router.push('/login')
      }
    }

    verifySession()
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
