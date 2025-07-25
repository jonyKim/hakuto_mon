"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Smartphone,
  Bell,
  Activity,
  Database,
  Coins,
  Gift,
  ArrowUpDown 
} from "lucide-react"
import { dashboardApi } from '@/lib/api/dashboard'

interface DashboardStats {
  total_nfts: number
  total_nfts_change: number
  total_staked: number
  total_staked_change: number
  total_rewards: number
  total_rewards_change: number
  today_withdrawn: number
  active_users: number
  notifications_sent: number
  error_rate: number
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  description?: string
}

function StatCard({ title, value, change, icon: Icon, description }: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            {isPositive && <TrendingUp className="h-3 w-3 text-green-500" />}
            {isNegative && <TrendingDown className="h-3 w-3 text-red-500" />}
            <span className={isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground"}>
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
            <span className="text-muted-foreground">from last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total_nfts: 0,
    total_nfts_change: 0,
    total_staked: 0,
    total_staked_change: 0,
    total_rewards: 0,
    total_rewards_change: 0,
    today_withdrawn: 0,
    active_users: 0,
    notifications_sent: 0,
    error_rate: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardApi.getDashboardOverview()
        setStats({
          total_nfts: data.stats?.total_nfts || 0,
          total_nfts_change: data.stats?.total_nfts_change || 0,
          total_staked: data.stats?.total_staked || 0,
          total_staked_change: data.stats?.total_staked_change || 0,
          total_rewards: data.stats?.total_rewards || 0,
          total_rewards_change: data.stats?.total_rewards_change || 0,
          today_withdrawn: data.stats?.today_withdrawn || 0,
          active_users: 1250, // Mock data for new metrics
          notifications_sent: 3420,
          error_rate: 0.02
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Badge variant="outline">Live</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with HAKUTO ecosystem.</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Live
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total NFTs"
          value={stats.total_nfts}
          change={stats.total_nfts_change}
          icon={Database}
          description="Total NFTs in circulation"
        />
        <StatCard
          title="Total Staked"
          value={stats.total_staked}
          change={stats.total_staked_change}
          icon={Coins}
          description="NFTs currently staked"
        />
        <StatCard
          title="Total Rewards"
          value={stats.total_rewards}
          change={stats.total_rewards_change}
          icon={Gift}
          description="Rewards distributed to users"
        />
        <StatCard
          title="Active Users"
          value={stats.active_users}
          change={12.5}
          icon={Users}
          description="Users active in the last 30 days"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="wallet">Wallet Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Today&apos;s Withdrawals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.today_withdrawn} HKTM</div>
                <p className="text-xs text-muted-foreground">
                  Total withdrawn today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.notifications_sent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  This month via FCM & Email
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  App Error Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(stats.error_rate * 100).toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  Current error rate from Sentry
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Analytics Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Access detailed analytics reports</p>
                <div className="grid gap-2">
                  <Badge variant="secondary" className="justify-start">NFT Analytics</Badge>
                  <Badge variant="secondary" className="justify-start">Staking Analytics</Badge>
                  <Badge variant="secondary" className="justify-start">Reward Analytics</Badge>
                  <Badge variant="secondary" className="justify-start">Withdrawal Analytics</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Notification Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Push Notifications</span>
                    <Badge>Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email Notifications</span>
                    <Badge>Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SMS Notifications</span>
                    <Badge variant="secondary">Planned</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wallet" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sentry Integration</span>
                    <Badge variant="outline">Connected</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Tracking</span>
                    <Badge>Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Performance Monitoring</span>
                    <Badge>Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 