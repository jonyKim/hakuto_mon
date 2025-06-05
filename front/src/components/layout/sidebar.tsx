import Link from "next/link"

interface SidebarProps {
  onLogout: () => void
}

export function Sidebar({ onLogout }: SidebarProps) {
  const menuItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/nft-stats', label: 'NFT Stats' },
    { href: '/dashboard/staking-stats', label: 'Staking Stats' },
    { href: '/dashboard/reward-stats', label: 'Reward Stats' },
    { href: '/dashboard/withdraw-stats', label: 'Withdraw Stats' },
  ]

  return (
    <div className="w-64 bg-white border-r min-h-screen p-4">
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold">THE MOON ADMIN</h1>
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
          Logout
        </button>
      </nav>
    </div>
  )
}