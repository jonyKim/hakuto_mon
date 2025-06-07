import { NextResponse } from 'next/server'
import axios from 'axios'
//import { API_SERVER_URL } from '@/config'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 백엔드 API 호출
    //const response = await axios.post(`${API_SERVER_URL}/api/admin/auth/login`, {
    const response = await axios.post(`/api/admin/auth/login`, {
      email,
      password
    })

    console.log('로그인 응답:', response.data)

    if (response.data.success) {
      const { token, user } = response.data.data  // data 객체 안에서 token과 user를 추출

      // 성공 응답 반환
      return NextResponse.json({ 
        success: true, 
        token,
        user
      })
    }

    // 실패 응답 반환 (백엔드에서 온 메시지 사용)
    return NextResponse.json(
      { 
        success: false, 
        message: response.data.error?.message || "Failed to login" 
      },
      { status: 401 }
    )
  } catch (error) {
    // 기타 에러 처리
    console.error('로그인 중 오류:', error)
    return NextResponse.json(
      { success: false, message: "Failed to login" },
      { status: 500 }
    )
  }
} 