import Link from "next/link"

interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const menuItems = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/dashboard/mission-rewards', label: '미션 보상 설정' },
    { href: '/dashboard/ad-rewards', label: '광고 보상 설정' },
    { href: '/dashboard/mission-claims', label: '미션 보상 지급 현황' },
    { href: '/dashboard/ad-claims', label: '광고 보상 지급 현황' },
  ]

  return (
    <div className="w-64 bg-white border-r min-h-screen p-4">
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold">LFIT HEALTH ADMIN</h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
        >
          로그아웃
        </button>
      </nav>
    </div>
  )
}