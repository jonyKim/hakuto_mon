"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { checkSession, logout } from "@/lib/api/sign"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    console.log("대시보드 레이아웃 마운트")
    
    const verifySession = async () => {
      try {
        const response = await checkSession()
        if (response.success) {
          console.log("세션 검증 성공")
          setIsAuthenticated(true)
        } else {
          console.log("세션이 유효하지 않아서 로그인 페이지로 리다이렉트")
          router.push('/login')
        }
      } catch (error) {
        console.error("세션 검증 실패:", error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [router])

  const handleLogout = async () => {
    console.log("로그아웃 처리")
    try {
      await logout()
      console.log("서버 로그아웃 완료")
      setIsAuthenticated(false)
      router.push('/login')
    } catch (error) {
      console.error("로그아웃 중 오류:", error)
      // 에러가 발생해도 로그인 페이지로 이동
      router.push('/login')
    }
  }

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // 리다이렉션 중
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <AppHeader onLogout={handleLogout} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 