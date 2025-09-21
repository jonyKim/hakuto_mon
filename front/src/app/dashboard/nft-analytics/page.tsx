'use client'

import { useState, useEffect } from 'react'
import { nftAnalyticsApi, type DashboardSummary, type HolderDistribution, type TopHolder, type RecentActivity, type HolderTrend } from '@/lib/api/nft-analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  Users, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Wallet,
  Crown,
  Eye,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'

// 색상 팔레트
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

// 임시 데이터 (실제로는 API에서 가져올 데이터)
const mockData = {
  summary: {
    totalNfts: 2869,
    totalHolders: 272,
    avgNftsPerHolder: 10.55,
    contractStats: [
      {
        contractName: 'THEMARKET HAKUTO.RABBIT NFT',
        contractAddress: '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1',
        totalNfts: 1284,
        uniqueHolders: 129,
        avgNftsPerHolder: 9.95
      },
      {
        contractName: 'THEMARKET HAKUTO.HALF NFT',
        contractAddress: '0x687F077249c6010BcAdD06E212BfE35bA42a8C41',
        totalNfts: 1035,
        uniqueHolders: 83,
        avgNftsPerHolder: 12.47
      },
      {
        contractName: 'THEMARKET HAKUTO.PUSA NFT',
        contractAddress: '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6',
        totalNfts: 550,
        uniqueHolders: 60,
        avgNftsPerHolder: 9.17
      }
    ]
  },
  holderDistribution: [
    { holderTier: '50개 이상 (고래)', holderCount: 5, totalNfts: 3215, avgNfts: 643.00 },
    { holderTier: '20-49개 (대형 홀더)', holderCount: 1, totalNfts: 23, avgNfts: 23.00 },
    { holderTier: '10-19개 (중형 홀더)', holderCount: 1, totalNfts: 16, avgNfts: 16.00 },
    { holderTier: '5-9개 (소형 홀더)', holderCount: 6, totalNfts: 36, avgNfts: 6.00 },
    { holderTier: '1-4개 (일반 홀더)', holderCount: 272, totalNfts: 333, avgNfts: 1.22 }
  ],
  topHolders: [
    {
      ownerAddress: '0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f',
      contractName: 'THEMARKET HAKUTO.RABBIT NFT',
      nftCount: 1361,
      isStakingAdmin: true
    },
    {
      ownerAddress: '0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f',
      contractName: 'THEMARKET HAKUTO.HALF NFT',
      nftCount: 695,
      isStakingAdmin: true
    },
    {
      ownerAddress: '0x060d098f9f75f77f4692edcc199447639ff0b6df',
      contractName: 'THEMARKET HAKUTO.PUSA NFT',
      nftCount: 485,
      isStakingAdmin: true
    },
    {
      ownerAddress: '0xbac4e2d1925e36a650e85092d329bc9b8ab1bc6e',
      contractName: 'THEMARKET HAKUTO.HALF NFT',
      nftCount: 455,
      isStakingAdmin: false
    },
    {
      ownerAddress: '0xbac4e2d1925e36a650e85092d329bc9b8ab1bc6e',
      contractName: 'THEMARKET HAKUTO.RABBIT NFT',
      nftCount: 95,
      isStakingAdmin: false
    }
  ],
  recentActivity: [
    {
      date: '2025-09-18',
      contractName: 'THEMARKET HAKUTO.RABBIT NFT',
      ownerAddress: '0xf0e194b0b07e143657795887e9d8ac6e84b8ae49',
      nftCount: 1,
      activityType: 'transfer'
    },
    {
      date: '2025-09-17',
      contractName: 'THEMARKET HAKUTO.RABBIT NFT',
      ownerAddress: '0x4010b35fb156d6b221f95cf9490abc9f2ba63a4d',
      nftCount: 1,
      activityType: 'transfer'
    },
    {
      date: '2025-09-02',
      contractName: 'THEMARKET HAKUTO.RABBIT NFT',
      ownerAddress: '0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f',
      nftCount: 1,
      activityType: 'admin_activity'
    }
  ],
  trends: [
    { date: '2025-09-18', activeHolders: 1, totalActivities: 1 },
    { date: '2025-09-17', activeHolders: 1, totalActivities: 1 },
    { date: '2025-09-16', activeHolders: 0, totalActivities: 0 },
    { date: '2025-09-15', activeHolders: 0, totalActivities: 0 },
    { date: '2025-09-14', activeHolders: 0, totalActivities: 0 },
    { date: '2025-09-13', activeHolders: 0, totalActivities: 0 },
    { date: '2025-09-12', activeHolders: 0, totalActivities: 0 }
  ]
}

export default function NFTAnalyticsPage() {
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  
  // 실제 API 데이터 상태
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const [holderDistribution, setHolderDistribution] = useState<{ topHolders: TopHolder[], distribution: HolderDistribution[] } | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  // 실제 API 호출 함수들
  const loadDashboardData = async () => {
    try {
      const dashboardSummary = await nftAnalyticsApi.getDashboardSummary()
      setDashboardData(dashboardSummary)
      setApiError(null)
      
      // 기존 mockData 구조에 맞춰 업데이트
      setData(prev => ({
        ...prev,
        summary: dashboardSummary
      }))
    } catch (error) {
      console.error('Dashboard data loading failed:', error)
      setApiError('대시보드 데이터 로딩에 실패했습니다.')
    }
  }

  const loadHolderData = async () => {
    try {
      const [distribution, topHolders, recentActivity] = await Promise.all([
        nftAnalyticsApi.getHolderDistribution(),
        nftAnalyticsApi.getTopHolders(20),
        nftAnalyticsApi.getRecentActivity(50, 7)
      ])
      
      setHolderDistribution(distribution)
      
      // 스테이킹 어드민 주소들
      const stakingAdminAddresses = [
        '0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f', // Main Staking Admin
        '0x060d098f9f75f77f4692edcc199447639ff0b6df'  // Sub Staking Admin
      ]
      
      // topHolders에 isStakingAdmin 속성 추가
      const topHoldersWithAdmin = topHolders.map(holder => ({
        ...holder,
        isStakingAdmin: !!(stakingAdminAddresses.includes(holder.ownerAddress.toLowerCase()) || 
                          stakingAdminAddresses.includes(holder.ownerAddress))
      }))
      
      // recentActivity에 activityType 추가
      const recentActivityWithType = recentActivity.map(activity => ({
        ...activity,
        activityType: stakingAdminAddresses.includes(activity.ownerAddress.toLowerCase()) || 
                     stakingAdminAddresses.includes(activity.ownerAddress) ? 'admin_activity' : 'transfer'
      }))
      
      // 기존 mockData 구조에 맞춰 업데이트
      setData(prev => ({
        ...prev,
        holderDistribution: distribution.distribution,
        topHolders: topHoldersWithAdmin,
        recentActivity: recentActivityWithType
      }))
    } catch (error) {
      console.error('Holder data loading failed:', error)
      setApiError('홀더 데이터 로딩에 실패했습니다.')
    }
  }

  // 데이터 새로고침
  const refreshData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadDashboardData(), loadHolderData()])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('데이터 새로고침 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 실제 API 데이터 로딩
  useEffect(() => {
    refreshData()
  }, [])

  // 주소 단축 함수
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // 클립보드 복사 함수
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAddress(text)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // 날짜 포맷팅 함수 (분까지만 표시)
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (error) {
      return dateString
    }
  }

  // 홀더 분포 차트 데이터 변환 (파이 차트용)
  const pieChartData = data.holderDistribution.map((item, index) => ({
    name: item.holderTier,
    value: item.holderCount,
    nfts: item.totalNfts,
    percentage: ((item.holderCount / data.summary.totalHolders) * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  }))

  // 커스텀 라벨 함수 (작은 섹션은 라벨 숨김)
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percentage }: any) => {
    // 3% 미만의 작은 섹션은 라벨 숨김 (차트가 커져서 기준을 낮춤)
    if (parseFloat(percentage) < 3) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 1.3
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="#374151" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={13}
        fontWeight={500}
      >
        {`${value} (${percentage}%)`}
      </text>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">NFT Holder Analytics</h1>
          <p className="text-muted-foreground">
            Real-time NFT holder status and change tracking system
          </p>
        </div>
        <div className="flex items-center gap-4">
          {apiError && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {apiError}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            Last Updated: {lastUpdated.toLocaleString('en-US')}
          </span>
          <Button 
            onClick={refreshData} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total NFTs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalNfts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              NFTs with timestamp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Holders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalHolders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Unique wallet addresses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Holdings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgNftsPerHolder}</div>
            <p className="text-xs text-muted-foreground">
              NFTs per holder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Whale Holders</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.holderDistribution.find(d => d.holderTier.includes('50+') || d.holderTier.includes('Whales'))?.holderCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Holding 50+ NFTs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holders">Holder Analysis</TabsTrigger>
          <TabsTrigger value="activity">Activity Tracking</TabsTrigger>
          <TabsTrigger value="admin">Admin Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>NFT Distribution by Contract</CardTitle>
                <CardDescription>Issuance and holder status for each NFT contract</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.summary.contractStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="contractName" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        value.toLocaleString(), 
                        name === 'totalNfts' ? 'Total NFTs' : 'Holders'
                      ]}
                    />
                    <Bar dataKey="totalNfts" fill="#8884d8" name="totalNfts" />
                    <Bar dataKey="uniqueHolders" fill="#82ca9d" name="uniqueHolders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Holder Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Holder Distribution</CardTitle>
                <CardDescription>Classification of holders by holdings amount</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} holders (${props.payload.nfts} NFTs)`,
                        'Count'
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Holder Distribution Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Holder Distribution Details</CardTitle>
              <CardDescription>Holder statistics by holdings amount</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.holderDistribution.map((dist, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-medium">{dist.holderTier}</div>
                        <div className="text-sm text-muted-foreground">
                          Average {dist.avgNfts} NFTs held
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{dist.holderCount} holders</div>
                      <div className="text-sm text-muted-foreground">
                        Total {dist.totalNfts} NFTs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holder Analysis Tab */}
        <TabsContent value="holders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Holders</CardTitle>
              <CardDescription>Top holders with the most NFTs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topHolders.map((holder, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold">{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                              {holder.ownerAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(holder.ownerAddress)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedAddress === holder.ownerAddress ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {holder.isStakingAdmin && (
                            <Badge variant="secondary">
                              <Crown className="w-3 h-3 mr-1" />
                              Staking Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {holder.contractName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{holder.nftCount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">NFTs held</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tracking Tab */}
        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Recent 7-Day Activity Trends</CardTitle>
                <CardDescription>Daily holder activity status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.slice(5)} // MM-DD format
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `Date: ${value}`}
                      formatter={(value, name) => [
                        value,
                        name === 'activeHolders' ? 'Active Holders' : 'Total Activities'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="activeHolders" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalActivities" 
                      stackId="2"
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Recent NFT transfers and activity history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <Activity className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                {activity.ownerAddress}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(activity.ownerAddress)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedAddress === activity.ownerAddress ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            {activity.activityType === 'admin_activity' && (
                              <Badge variant="outline" className="text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.contractName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{activity.nftCount} NFTs</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(activity.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Admin Monitoring Tab */}
        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staking Admin Wallet Monitoring</CardTitle>
              <CardDescription>NFT holdings and activities of staking admin wallets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Admin Wallet Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">HAKUTO RABBIT</div>
                          <div className="text-2xl font-bold">1,361</div>
                          <div className="text-xs text-muted-foreground">NFTs held</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium">HAKUTO HALF</div>
                          <div className="text-2xl font-bold">695</div>
                          <div className="text-xs text-muted-foreground">NFTs held</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="text-sm font-medium">HAKUTO PUSA</div>
                          <div className="text-2xl font-bold">485</div>
                          <div className="text-xs text-muted-foreground">NFTs held</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Admin Wallet Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <Crown className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">Main Staking Admin</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-white px-2 py-1 rounded font-mono">
                            0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard('0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f')}
                            className="h-6 w-6 p-0"
                          >
                            {copiedAddress === '0x032ef9ea54b85627a8e0b2a6ef95e570476b3b7f' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Last Activity: {formatDateTime('2025-09-03T12:59:06.000Z')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">2,541 NFTs</div>
                      <div className="text-sm text-muted-foreground">Total NFTs held</div>
                      <Badge variant="default" className="mt-1">
                        <Eye className="w-3 h-3 mr-1" />
                        Monitoring
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                        <Crown className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Sub Staking Admin</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <code className="text-sm bg-white px-2 py-1 rounded font-mono">
                            0x060d098f9f75f77f4692edcc199447639ff0b6df
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard('0x060d098f9f75f77f4692edcc199447639ff0b6df')}
                            className="h-6 w-6 p-0"
                          >
                            {copiedAddress === '0x060d098f9f75f77f4692edcc199447639ff0b6df' ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Last Activity: {formatDateTime('2025-08-28T18:19:58.000Z')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">485 NFTs</div>
                      <div className="text-sm text-muted-foreground">Total NFTs held</div>
                      <Badge variant="default" className="mt-1">
                        <Eye className="w-3 h-3 mr-1" />
                        Monitoring
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Anomalous Pattern Alert */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-800">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Anomalous Pattern Detection</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Whale Holders (50+ NFTs)</span>
                        <Badge variant="outline">5 detected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Recent Surge Activity (10+ in 7 days)</span>
                        <Badge variant="outline">0 cases</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
