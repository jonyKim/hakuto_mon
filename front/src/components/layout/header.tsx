"use client"

interface HeaderProps {
  onLogout: () => void
}

export function Header({ onLogout }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b px-6 flex items-center justify-between">
      <h1 className="text-lg font-semibold">관리자 시스템</h1>
      <button
        onClick={onLogout}
        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
      >
        로그아웃
      </button>
    </header>
  )
}