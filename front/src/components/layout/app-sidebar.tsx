"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Bell,
  Users,
  Smartphone,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Database,
  Coins,
  Gift,
  ArrowUpDown,
  NotebookPen,
  Mail,
  UserCheck,
  Activity,
  AlertTriangle,
  Gauge,
  MessageSquare,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface SidebarProps {
  onLogout: () => void
}

interface MenuItem {
  title: string
  href?: string
  icon: React.ElementType
  items?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics & Reports",
    icon: BarChart3,
    items: [
      {
        title: "NFT Analytics",
        href: "/dashboard/analytics/nft",
        icon: Database,
      },
      {
        title: "Staking Analytics", 
        href: "/dashboard/analytics/staking",
        icon: Coins,
      },
      {
        title: "Reward Analytics",
        href: "/dashboard/analytics/rewards", 
        icon: Gift,
      },
      {
        title: "Withdrawal Analytics",
        href: "/dashboard/analytics/withdrawals",
        icon: ArrowUpDown,
      },
    ],
  },
  {
    title: "Notification Management",
    icon: Bell,
    items: [
      {
        title: "Push Notifications",
        href: "/dashboard/notifications/push",
        icon: NotebookPen,
      },
      {
        title: "Email Notifications", 
        href: "/dashboard/notifications/email",
        icon: Mail,
      },
      {
        title: "Notification Templates",
        href: "/dashboard/notifications/templates",
        icon: MessageSquare,
      },
      {
        title: "Notification Logs",
        href: "/dashboard/notifications/logs",
        icon: Activity,
      },
      {
        title: "Subscriber Management",
        href: "/dashboard/notifications/subscribers",
        icon: UserCheck,
      },
    ],
  },
  {
    title: "User Management",
    icon: Users,
    items: [
      {
        title: "Wallet Users",
        href: "/dashboard/users/wallets",
        icon: Users,
      },
      {
        title: "Email Verification",
        href: "/dashboard/users/verification",
        icon: UserCheck,
      },
      {
        title: "User Preferences",
        href: "/dashboard/users/preferences", 
        icon: Settings,
      },
      {
        title: "User Activity Logs",
        href: "/dashboard/users/activity",
        icon: Activity,
      },
    ],
  },
  {
    title: "Hakuto Wallet Monitoring",
    icon: Smartphone,
    items: [
      {
        title: "App Analytics",
        href: "/dashboard/wallet/analytics",
        icon: TrendingUp,
      },
      {
        title: "Transaction Monitoring",
        href: "/dashboard/wallet/transactions",
        icon: ArrowUpDown,
      },
      {
        title: "Error Tracking",
        href: "/dashboard/wallet/errors",
        icon: AlertTriangle,
      },
      {
        title: "Performance Metrics",
        href: "/dashboard/wallet/performance",
        icon: Gauge,
      },
    ],
  },
  {
    title: "System Configuration",
    icon: Settings,
    items: [
      {
        title: "FCM Settings",
        href: "/dashboard/settings/fcm",
        icon: NotebookPen,
      },
      {
        title: "Email Settings",
        href: "/dashboard/settings/email",
        icon: Mail,
      },
      {
        title: "Alert Thresholds",
        href: "/dashboard/settings/alerts",
        icon: AlertTriangle,
      },
      {
        title: "API Configurations",
        href: "/dashboard/settings/api",
        icon: Settings,
      },
    ],
  },
]

export function AppSidebar({ onLogout }: SidebarProps) {
  const pathname = usePathname()
  const [openItems, setOpenItems] = React.useState<string[]>([])

  const toggleItem = (title: string) => {
    setOpenItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => pathname === href

  const isParentActive = (items: MenuItem[]) =>
    items.some(item => item.href && pathname === item.href)

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            H
          </div>
          <span className="text-lg">HAKUTO MON</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {menuItems.map((item) => {
          if (item.items) {
            const isOpen = openItems.includes(item.title)
            const hasActiveChild = isParentActive(item.items)

            return (
              <Collapsible
                key={item.title}
                open={isOpen}
                onOpenChange={() => toggleItem(item.title)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={hasActiveChild ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-between px-3 py-2 h-auto",
                      hasActiveChild && "bg-secondary"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 px-6 py-1">
                  {item.items.map((subItem) => (
                    <Button
                      key={subItem.title}
                      asChild
                      variant={subItem.href && isActive(subItem.href) ? "secondary" : "ghost"}
                      className="w-full justify-start px-3 py-2 h-auto"
                    >
                      <Link href={subItem.href || "#"}>
                        <subItem.icon className="h-4 w-4 mr-3" />
                        <span className="text-sm">{subItem.title}</span>
                      </Link>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )
          }

          return (
            <Button
              key={item.title}
              asChild
              variant={item.href && isActive(item.href) ? "secondary" : "ghost"}
              className="w-full justify-start px-3 py-2 h-auto"
            >
              <Link href={item.href || "#"}>
                <item.icon className="h-4 w-4 mr-3" />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <Button
          onClick={onLogout}
          variant="ghost"
          className="w-full justify-start px-3 py-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-3" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </div>
  )
}