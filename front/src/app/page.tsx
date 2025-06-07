'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession } from '@/lib/api/sign'

export default function RootPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const verifySession = async () => {
      try {
        console.log("세션 확인 시도");
        console.log(isLoading);
        const response = await checkSession()
        if (response.success) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error("세션 확인 중 오류:", error)
        router.push('/login')
      } finally {
        setIsLoading(false)
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
