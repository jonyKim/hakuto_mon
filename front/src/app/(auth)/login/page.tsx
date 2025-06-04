import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">LFIT HEALTH ADMIN</h1>
          <p className="text-gray-600 mt-2">관리자 로그인</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}