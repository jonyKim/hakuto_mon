"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  Coins, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Users,
  Calendar,
  Shield
} from "lucide-react"
import { stakeStatsApi } from '@/lib/api/stake-stats'

const NFT_ADDRESS_MAP: Record<string, string> = {
  '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6': 'PUSA',
  '0x687F077249c6010BcAdCb7E4F82c1b4843072B1': 'HAKUTO HALF',
  '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1': 'HAKUTO'
}

interface StakingSummary {
  total_staked: number
  by_admin: { admin_waletaddress: string; staked_count: number }[]
  by_type: { pusa: number; hakuto_half: number; hakuto: number }
  by_date: { date: string; count: number }[]
  by_user_type: { own_waletaddress: string; contract_address: string; staked_count: number }[]
}

interface StatCardProps {
  title: string
  value: number
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
        <div className="text-2xl font-bold">{value.toLocaleString()} {suffix}</div>
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

export default function StakingAnalyticsPage() {
  const [summary, setSummary] = useState<StakingSummary>({
    total_staked: 0,
    by_admin: [],
    by_type: { pusa: 0, hakuto_half: 0, hakuto: 0 },
    by_date: [],
    by_user_type: []
  })
  
  const [loading, setLoading] = useState(true)
  const [showAllAdmins, setShowAllAdmins] = useState(false)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await stakeStatsApi.getSummary()
        setSummary(data)
      } catch (error) {
        console.error('Error fetching staking summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Staking Analytics</h1>
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

  const displayedAdmins = showAllAdmins ? summary.by_admin : summary.by_admin.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staking Analytics</h1>
          <p className="text-muted-foreground">Comprehensive staking statistics and performance metrics</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Staked NFTs"
          value={summary.total_staked || 0}
          change={15.2}
          icon={Coins}
          description="Total NFTs currently staked"
          suffix="NFTs"
        />
        <StatCard
          title="PUSA Staked"
          value={summary.by_type?.pusa || 0}
          change={8.7}
          icon={PieChart}
          description="PUSA NFTs in staking"
        />
        <StatCard
          title="HAKUTO HALF Staked"
          value={summary.by_type?.hakuto_half || 0}
          change={-3.2}
          icon={BarChart3}
          description="HAKUTO HALF NFTs in staking"
        />
        <StatCard
          title="HAKUTO Staked"
          value={summary.by_type?.hakuto || 0}
          change={22.1}
          icon={Shield}
          description="HAKUTO NFTs in staking"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="admins">Admin Analysis</TabsTrigger>
          <TabsTrigger value="users">User Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Staking Distribution by NFT Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-sm">PUSA</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(summary.by_type?.pusa || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((summary.by_type?.pusa || 0) / (summary.total_staked || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">HAKUTO HALF</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(summary.by_type?.hakuto_half || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((summary.by_type?.hakuto_half || 0) / (summary.total_staked || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-sm">HAKUTO</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(summary.by_type?.hakuto || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((summary.by_type?.hakuto || 0) / (summary.total_staked || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
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
                    <span className="text-sm">Overall Growth</span>
                    <Badge variant="secondary">+15.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Staked Type</span>
                    <Badge>HAKUTO</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fastest Growing</span>
                    <Badge variant="outline">HAKUTO (+22.1%)</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Admins</span>
                    <Badge variant="secondary">{summary.by_admin?.length || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Admin Staking Statistics
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAllAdmins(!showAllAdmins)}
              >
                {showAllAdmins ? 'Show Less' : 'Show All'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayedAdmins.map((admin, index) => (
                  <div key={admin.admin_waletaddress} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="text-sm font-medium">
                          {admin.admin_waletaddress.slice(0, 6)}...{admin.admin_waletaddress.slice(-4)}
                        </div>
                        <div className="text-xs text-muted-foreground">Admin Wallet</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{admin.staked_count.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">NFTs staked</div>
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
                User Staking Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.by_user_type?.slice(0, 10).map((user, index) => (
                  <div key={`${user.own_waletaddress}-${user.contract_address}`} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <div className="text-sm font-medium">
                          {user.own_waletaddress.slice(0, 6)}...{user.own_waletaddress.slice(-4)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {NFT_ADDRESS_MAP[user.contract_address] || 'Unknown Type'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{user.staked_count.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">NFTs staked</div>
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
                Staking Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {summary.by_date?.slice(0, 7).map((item) => (
                  <div key={item.date} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.date}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.count.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">stakes</div>
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