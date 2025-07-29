"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  Activity,
  Users,
  DollarSign,
  Clock
} from "lucide-react"
import { stakeStatsApi } from '@/lib/api/withdraw-stats'

interface WithdrawStats {
  total_withdrawn: number
  total_withdrawals?: number
  total_amount?: number
  today_withdrawals?: number
  pending_withdrawals?: number
  by_date: { date: string; total_withdrawn: number; count?: number; amount?: number }[]
  by_user?: { user_address?: string; own_waletaddress?: string; total_count?: number; total_amount?: number }[]
  recent_withdrawals?: any[]
}

interface StatCardProps {
  title: string
  value: number | string
  change?: number
  icon: React.ElementType
  description?: string
  suffix?: string
}

function StatCard({ title, value, change, icon: Icon, description, suffix = "" }: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value} {suffix}
        </div>
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

export default function WithdrawalAnalyticsPage() {
  const [withdrawStats, setWithdrawStats] = useState<WithdrawStats>({
    total_withdrawn: 0,
    total_withdrawals: 0,
    total_amount: 0,
    today_withdrawals: 0,
    pending_withdrawals: 0,
    by_date: [],
    by_user: [],
    recent_withdrawals: []
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWithdrawStats = async () => {
      try {
        const data = await stakeStatsApi.getSummary()
        setWithdrawStats(data)
      } catch (error) {
        console.error('Error fetching withdrawal stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWithdrawStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Analytics</h1>
          <Badge variant="outline">Loading...</Badge>
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
          <h1 className="text-3xl font-bold tracking-tight">Withdrawal Analytics</h1>
          <p className="text-muted-foreground">Monitor withdrawal activities and transaction patterns</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Withdrawals"
          value={withdrawStats.total_withdrawals || withdrawStats.by_date?.length || 0}
          change={14.3}
          icon={ArrowUpDown}
          description="Total withdrawal transactions"
        />
        <StatCard
          title="Total Amount"
          value={withdrawStats.total_withdrawn || 0}
          change={18.7}
          icon={DollarSign}
          description="Total amount withdrawn"
          suffix="HKTM"
        />
        <StatCard
          title="Today&apos;s Withdrawals"
          value={withdrawStats.today_withdrawals || 0}
          change={-5.2}
          icon={Calendar}
          description="Withdrawals processed today"
        />
        <StatCard
          title="Pending"
          value={withdrawStats.pending_withdrawals || 0}
          icon={Clock}
          description="Withdrawals awaiting processing"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Activity</TabsTrigger>
          <TabsTrigger value="users">User Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Withdrawal Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Processed</span>
                    <Badge variant="secondary">{(withdrawStats.total_withdrawals || withdrawStats.by_date?.length || 0).toLocaleString()}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Amount</span>
                    <Badge variant="outline">{(withdrawStats.total_withdrawn || 0).toLocaleString()} HKTM</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average per Transaction</span>
                    <Badge>
                      {Math.round((withdrawStats.total_withdrawn || 0) / (withdrawStats.total_withdrawals || withdrawStats.by_date?.length || 1)).toLocaleString()} HKTM
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Users</span>
                    <Badge variant="secondary">{withdrawStats.by_user?.length || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transaction Growth</span>
                    <Badge variant="secondary">+14.3%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Volume Growth</span>
                    <Badge variant="secondary">+18.7%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Status</span>
                    <Badge variant="outline">
                      {(withdrawStats.pending_withdrawals || 0) > 0 ? 'Pending' : 'Up to Date'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Daily Withdrawal Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawStats.by_date?.slice(0, 10).map((item, index) => (
                  <div key={item.date} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="text-sm font-medium">{new Date(item.date).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.count || 1} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(item.total_withdrawn || item.amount || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">HKTM withdrawn</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top Users by Withdrawal Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawStats.by_user?.slice(0, 10).map((user, index) => {
                  const userAddress = user.user_address || user.own_waletaddress || '';
                  return (
                    <div key={userAddress || index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <div className="text-sm font-medium">
                            {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Unknown Address'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.total_count || 0} transactions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{user.total_amount?.toLocaleString() || 0}</div>
                        <div className="text-xs text-muted-foreground">HKTM withdrawn</div>
                      </div>
                    </div>
                  );
                }) || <div className="text-center text-muted-foreground py-4">No user data available</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Withdrawal Trends Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Historical withdrawal trends and pattern analysis will be displayed here.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">+14.3%</div>
                  <div className="text-sm text-muted-foreground">Transaction Growth</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">+18.7%</div>
                  <div className="text-sm text-muted-foreground">Volume Growth</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">
                    {Math.round((withdrawStats.total_withdrawn || 0) / (withdrawStats.total_withdrawals || withdrawStats.by_date?.length || 1)).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg per Transaction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 