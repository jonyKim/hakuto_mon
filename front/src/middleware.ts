import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const isAuthenticated = token ? await verifyToken(token) : false
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // 로그인 페이지에서 이미 인증된 사용자가 접근하면 대시보드로 리다이렉트
  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 인증되지 않은 사용자가 대시보드에 접근하면 로그인 페이지로 리다이렉트
  if (!isAuthenticated && isDashboardRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/dashboard/:path*']
}