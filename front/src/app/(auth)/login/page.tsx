import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">HAKUTO MONITOR ADMIN</h1>
          <p className="text-gray-600 mt-2">ADMIN LOGIN</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}