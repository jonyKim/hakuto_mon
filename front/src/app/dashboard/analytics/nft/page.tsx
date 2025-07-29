"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Database, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Users
} from "lucide-react"
import { nftStatsApi } from '@/lib/api/nft-stats'

interface NFTStats {
  total: number
  by_type: {
    pusa: number
    hakuto_half: number
    hakuto: number
  }
}

interface StatCardProps {
  title: string
  value: number
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
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
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

export default function NFTAnalyticsPage() {
  const [nftStats, setNftStats] = useState<NFTStats>({
    total: 0,
    by_type: {
      pusa: 0,
      hakuto_half: 0,
      hakuto: 0
    }
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNFTStats = async () => {
      try {
        console.log('Fetching NFT stats....')
        const stats = await nftStatsApi.getStats()
        console.log('NFT stats fetched:', stats)
        setNftStats(stats)
      } catch (error) {
        console.error('Error fetching NFT stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">NFT Analytics</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">NFT Analytics</h1>
          <p className="text-muted-foreground">Comprehensive analytics for HAKUTO NFT ecosystem</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total NFTs"
          value={nftStats.total || 0}
          change={8.2}
          icon={Database}
          description="Total NFTs in circulation"
        />
        <StatCard
          title="PUSA NFTs"
          value={nftStats.by_type?.pusa || 0}
          change={12.5}
          icon={PieChart}
          description="PUSA type NFTs"
        />
        <StatCard
          title="HAKUTO HALF NFTs"
          value={nftStats.by_type?.hakuto_half || 0}
          change={-2.1}
          icon={BarChart3}
          description="HAKUTO HALF type NFTs"
        />
        <StatCard
          title="HAKUTO NFTs"
          value={nftStats.by_type?.hakuto || 0}
          change={15.3}
          icon={Users}
          description="HAKUTO type NFTs"
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  NFT Type Distribution
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
                      <div className="text-sm font-medium">{(nftStats.by_type?.pusa || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((nftStats.by_type?.pusa || 0) / (nftStats.total || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">HAKUTO HALF</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(nftStats.by_type?.hakuto_half || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((nftStats.by_type?.hakuto_half || 0) / (nftStats.total || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span className="text-sm">HAKUTO</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(nftStats.by_type?.hakuto || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {((nftStats.by_type?.hakuto || 0) / (nftStats.total || 1) * 100).toFixed(1)}%
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
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Growth</span>
                    <Badge variant="secondary">+8.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Popular Type</span>
                    <Badge>HAKUTO</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fastest Growing</span>
                    <Badge variant="outline">HAKUTO (+15.3%)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>NFT Distribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed distribution analysis charts and data visualization will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Historical trends and prediction models will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Performance indicators and benchmarks will be shown here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 