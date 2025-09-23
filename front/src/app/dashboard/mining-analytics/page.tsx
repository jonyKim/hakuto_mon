'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, PieChart, Pie, Cell
} from 'recharts';
import { 
  Copy, Check, Pickaxe, TrendingUp, Users, Calendar, 
  Wallet, RefreshCw, Search, ExternalLink, AlertTriangle, Target, Clock
} from 'lucide-react';

import { 
  miningRewardsAPI, 
  MiningRewardSummary, 
  MinerDetails, 
  DailyMiningStats, 
  ContractMiningStats,
  MiningTrends
} from '@/lib/api/mining-rewards';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function MiningAnalyticsPage() {
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [minerDetails, setMinerDetails] = useState<MinerDetails | null>(null);
  
  // 데이터 상태
  const [miningSummary, setMiningSummary] = useState<MiningRewardSummary | null>(null);
  const [topMiners, setTopMiners] = useState<MinerDetails[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyMiningStats[]>([]);
  const [contractStats, setContractStats] = useState<ContractMiningStats[]>([]);
  const [miningTrends, setMiningTrends] = useState<MiningTrends[]>([]);
  const [completionAnalysis, setCompletionAnalysis] = useState<any>(null);

  // 클립보드 복사 기능
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // 주소 단축 표시
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 날짜 포맷팅
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 숫자 포맷팅
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // HKTM 포맷팅
  const formatHKTM = (amount: number) => {
    return `${formatNumber(amount)} HKTM`;
  };

  // 진행률 계산
  const getProgressPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  // 마이너 검색
  const searchMiner = async () => {
    if (!searchAddress.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const details = await miningRewardsAPI.getMinerDetails(searchAddress.trim());
      setMinerDetails(details);
    } catch (err) {
      setError('마이너 정보를 찾을 수 없습니다.');
      setMinerDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        summaryData,
        minersData,
        dailyStatsData,
        contractStatsData,
        trendsData,
        completionData
      ] = await Promise.all([
        miningRewardsAPI.getMiningRewardSummary(),
        miningRewardsAPI.getTopMiners(20),
        miningRewardsAPI.getDailyMiningStats(30),
        miningRewardsAPI.getContractMiningStats(),
        miningRewardsAPI.getMiningTrends(30),
        miningRewardsAPI.getRewardCompletionAnalysis()
      ]);

      setMiningSummary(summaryData);
      setTopMiners(minersData);
      setDailyStats(dailyStatsData);
      setContractStats(contractStatsData);
      setMiningTrends(trendsData);
      setCompletionAnalysis(completionData);

    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('마이닝 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 로딩 상태
  if (loading && !miningSummary) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && !miningSummary) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NFT Staking Mining Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Off-chain mining rewards analysis based on business logic calculations
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 요약 통계 카드 */}
      {miningSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Miners</CardTitle>
              <Pickaxe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(miningSummary.totalMiners)}</div>
              <p className="text-xs text-muted-foreground">
                Active: {miningSummary.activeMiners} | Completed: {miningSummary.completedMiners}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHKTM(miningSummary.totalRewardsGenerated)}</div>
              <p className="text-xs text-muted-foreground">
                Generated rewards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Miner</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHKTM(miningSummary.avgRewardsPerMiner)}</div>
              <p className="text-xs text-muted-foreground">
                {miningSummary.avgRewardsDaysPerMiner.toFixed(1)} avg days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max Period</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{miningSummary.maxRewardsDays}</div>
              <p className="text-xs text-muted-foreground">
                Days maximum
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 컨테이너 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="miners">Top Miners</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 컨트랙트별 마이닝 현황 */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Mining Overview</CardTitle>
                <CardDescription>Mining statistics by NFT contract</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contractStats.map((contract) => (
                    <div key={contract.contractAddress} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{contract.contractName}</h3>
                        <Badge variant="outline">{contract.totalMiners} miners</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Rewards</p>
                          <p className="font-medium">{formatHKTM(contract.totalRewards)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg per Miner</p>
                          <p className="font-medium">{formatHKTM(contract.avgRewardsPerMiner)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Active Miners</p>
                          <p className="font-medium text-green-600">{contract.activeMiners}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Completed</p>
                          <p className="font-medium text-blue-600">{contract.completedMiners}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 보상 분포 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>Reward Distribution</CardTitle>
                <CardDescription>Total rewards by contract</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contractStats.map(item => ({
                        name: item.contractName,
                        value: item.totalRewards,
                        miners: item.totalMiners
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${entry.name}: ${formatNumber(entry.value)}`}
                    >
                      {contractStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatHKTM(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 상위 마이너 탭 */}
        <TabsContent value="miners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Miners</CardTitle>
              <CardDescription>Miners with highest reward amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topMiners.slice(0, 20).map((miner, index) => (
                  <div key={`${miner.ownWalletAddress}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">{miner.ownWalletAddress}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(miner.ownWalletAddress)}
                          >
                            {copiedAddress === miner.ownWalletAddress ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={miner.isCompleted ? "default" : "secondary"}>
                            {miner.rewardsDays}/{miningSummary?.maxRewardsDays} days
                          </Badge>
                          <Badge variant="outline">
                            {miner.remainingDays} days left
                          </Badge>
                        </div>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${getProgressPercentage(miner.rewardsDays, miningSummary?.maxRewardsDays || 500)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatHKTM(miner.getRewards)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Daily: {formatHKTM(miner.dailyRewardRate)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Projected: {formatHKTM(miner.projectedTotalRewards)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 컨트랙트 탭 */}
        <TabsContent value="contracts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {contractStats.map((contract) => (
              <Card key={contract.contractAddress}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{contract.contractName}</CardTitle>
                      <CardDescription>
                        {contract.contractAddress}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {((contract.completedMiners / contract.totalMiners) * 100).toFixed(1)}% completed
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Miners</p>
                      <p className="text-2xl font-bold">{contract.totalMiners}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Miners</p>
                      <p className="text-2xl font-bold text-green-600">{contract.activeMiners}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Rewards</p>
                      <p className="text-2xl font-bold">{formatHKTM(contract.totalRewards)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg per Miner</p>
                      <p className="text-2xl font-bold">{formatHKTM(contract.avgRewardsPerMiner)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completion Progress</span>
                      <span>{contract.completedMiners} / {contract.totalMiners}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(contract.completedMiners / contract.totalMiners) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 완료율 분석 탭 */}
        <TabsContent value="completion" className="space-y-4">
          {completionAnalysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 컨트랙트별 완료율 */}
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate by Contract</CardTitle>
                  <CardDescription>Percentage of miners who completed 500 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={completionAnalysis.completionRateByContract}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="contractName" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="completionRate" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 보상 일수 분포 */}
              <Card>
                <CardHeader>
                  <CardTitle>Rewards Days Distribution</CardTitle>
                  <CardDescription>Distribution of miners by reward days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={completionAnalysis.rewardsDaysDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="daysRange" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="minerCount" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 트렌드 탭 */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mining Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily mining activity and completion trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={[...miningTrends].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => {
                    if (name === 'cumulativeRewards' || name === 'dailyRewards') return formatHKTM(value);
                    if (name === 'completionRate') return `${value.toFixed(1)}%`;
                    return value;
                  }} />
                  <Area type="monotone" dataKey="cumulativeRewards" stroke="#82ca9d" fill="#82ca9d" name="Cumulative Rewards" />
                  <Area type="monotone" dataKey="activeMinerCount" stroke="#8884d8" fill="#8884d8" name="Active Miners" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 검색 탭 */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Miner Search</CardTitle>
              <CardDescription>Search for specific wallet address mining details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter wallet address (0x...)"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchMiner()}
                />
                <Button onClick={searchMiner} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {error && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {minerDetails && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Mining Summary</h3>
                      <Badge variant={minerDetails.isCompleted ? "default" : "secondary"}>
                        {minerDetails.isCompleted ? "Completed" : "Active"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Total Rewards</p>
                        <p className="font-medium text-green-600">{formatHKTM(minerDetails.getRewards)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reward Days</p>
                        <p className="font-medium">{minerDetails.rewardsDays} / {miningSummary?.maxRewardsDays}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Daily Rate</p>
                        <p className="font-medium">{formatHKTM(minerDetails.dailyRewardRate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Remaining Days</p>
                        <p className="font-medium">{minerDetails.remainingDays}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Projected Total</p>
                        <p className="font-medium">{formatHKTM(minerDetails.projectedTotalRewards)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Contract</p>
                        <p className="font-medium font-mono text-xs">{shortenAddress(minerDetails.contractAddress)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">First Reward</p>
                        <p className="font-medium">{minerDetails.firstRewardDate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Update</p>
                        <p className="font-medium">{minerDetails.lastRewardDate || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{getProgressPercentage(minerDetails.rewardsDays, miningSummary?.maxRewardsDays || 500).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full" 
                          style={{ width: `${getProgressPercentage(minerDetails.rewardsDays, miningSummary?.maxRewardsDays || 500)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
