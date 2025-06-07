import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode('your-super-secret-key-here')

export interface UserData {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  [key: string]: string;  // 추가 속성을 위한 인덱스 시그니처
}

export const createToken = async (userData: UserData) => {
  const token = await new SignJWT({
    id: userData.id,
    userId: userData.userId,
    email: userData.email,
    name: userData.name,
    role: userData.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET)
  
  return token
}

export const verifyToken = async (token: string) => {
  try {
    console.log("[verifyToken] 토큰 검증 시도:", token)
    const { payload } = await jwtVerify(token, JWT_SECRET)
    console.log("[verifyToken] 토큰 검증 성공:", payload)
    return payload as unknown as UserData
  } catch (error) {
    console.error("[verifyToken] 토큰 검증 실패:", error)
    return null
  }
}