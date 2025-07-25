"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { getAuthCookie, removeAuthCookie } from "@/lib/auth"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    console.log("대시보드 레이아웃 마운트")
    const token = getAuthCookie()
    if (!token) {
      console.log("토큰이 없어서 로그인 페이지로 리다이렉트")
      router.push('/login')
    }
  }, [router])

  const handleLogout = () => {
    console.log("로그아웃 처리")
    removeAuthCookie()
    router.push('/login')
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