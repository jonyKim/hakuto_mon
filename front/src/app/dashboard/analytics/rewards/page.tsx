"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Gift, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  Activity,
  Users,
  DollarSign
} from "lucide-react"
import { rewardStatsApi } from '@/lib/api/reward-stats'

interface RewardStats {
  total_rewards: number
  total_rewards_value?: number
  by_date: { date: string; total_rewards: number; total_value?: number }[]
  by_user: { own_waletaddress: string; total_rewards: number; total_value?: number }[]
  recent_rewards: { id: string; own_waletaddress: string; total_rewards: number; reward_date: string }[]
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

export default function RewardAnalyticsPage() {
  const [rewardStats, setRewardStats] = useState<RewardStats>({
    total_rewards: 0,
    total_rewards_value: 0,
    by_date: [],
    by_user: [],
    recent_rewards: []
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRewardStats = async () => {
      try {
        const data = await rewardStatsApi.getSummary()
        setRewardStats(data)
      } catch (error) {
        console.error('Error fetching reward stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRewardStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Reward Analytics</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Reward Analytics</h1>
          <p className="text-muted-foreground">Track reward distribution and performance metrics</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Rewards"
          value={rewardStats.total_rewards || 0}
          change={18.5}
          icon={Gift}
          description="Total rewards distributed"
          suffix="HKTM"
        />
        <StatCard
          title="Reward Value"
          value={rewardStats.total_rewards_value || 0}
          change={22.3}
          icon={DollarSign}
          description="Total monetary value"
          suffix="USD"
        />
        <StatCard
          title="Daily Average"
          value={Math.round((rewardStats.total_rewards || 0) / 30)}
          change={5.7}
          icon={Calendar}
          description="Average daily rewards"
          suffix="HKTM"
        />
        <StatCard
          title="Active Recipients"
          value={rewardStats.by_user?.length || 0}
          change={12.1}
          icon={Users}
          description="Users receiving rewards"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recipients">Top Recipients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Reward Distribution Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Distributed</span>
                    <Badge variant="secondary">{(rewardStats.total_rewards || 0).toLocaleString()} HKTM</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average per User</span>
                    <Badge variant="outline">
                      {Math.round((rewardStats.total_rewards || 0) / (rewardStats.by_user?.length || 1)).toLocaleString()} HKTM
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Distribution Events</span>
                    <Badge>{rewardStats.by_date?.length || 0}</Badge>
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
                    <span className="text-sm">Growth Rate</span>
                    <Badge variant="secondary">+18.5%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Value Growth</span>
                    <Badge variant="secondary">+22.3%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">User Growth</span>
                    <Badge variant="outline">+12.1%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Reward Distribution by Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewardStats.by_date?.slice(0, 10).map((item, index) => (
                  <div key={item.date} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="text-sm font-medium">{item.date}</div>
                        <div className="text-xs text-muted-foreground">
                          ${item.total_value?.toLocaleString() || 0} USD
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.total_rewards?.toLocaleString() || 0}</div>
                      <div className="text-xs text-muted-foreground">HKTM rewards</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reward Trends Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Historical reward trends and forecasting charts will be displayed here.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-500">+18.5%</div>
                  <div className="text-sm text-muted-foreground">Monthly Growth</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">+22.3%</div>
                  <div className="text-sm text-muted-foreground">Value Growth</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">+12.1%</div>
                  <div className="text-sm text-muted-foreground">User Growth</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Top Reward Recipients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewardStats.by_user?.slice(0, 10).map((user, index) => (
                  <div key={user.own_waletaddress} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="text-sm font-medium">
                          {user.own_waletaddress.slice(0, 6)}...{user.own_waletaddress.slice(-4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.total_value ? `$${user.total_value.toLocaleString()} USD value` : 'Wallet Address'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{user.total_rewards?.toLocaleString() || 0}</div>
                      <div className="text-xs text-muted-foreground">HKTM earned</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 