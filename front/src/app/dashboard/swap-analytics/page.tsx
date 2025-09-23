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
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { 
  Copy, Check, ArrowRightLeft, TrendingUp, Activity, 
  Wallet, RefreshCw, Search, ExternalLink, AlertTriangle, ArrowUpDown
} from 'lucide-react';

import { 
  swapAnalyticsAPI, 
  SwapSummary, 
  SwapTransaction, 
  SwapTrend, 
  TopSwapper, 
  SwapDistribution,
  SwapperDetails
} from '@/lib/api/swap-analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function SwapAnalyticsPage() {
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [swapperDetails, setSwapperDetails] = useState<SwapperDetails | null>(null);
  
  // 데이터 상태
  const [swapSummary, setSwapSummary] = useState<SwapSummary | null>(null);
  const [swapTransactions, setSwapTransactions] = useState<SwapTransaction[]>([]);
  const [swapTrends, setSwapTrends] = useState<SwapTrend[]>([]);
  const [topSwappers, setTopSwappers] = useState<TopSwapper[]>([]);
  const [swapDistribution, setSwapDistribution] = useState<SwapDistribution[]>([]);

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

  // MEXC 거래소 지갑 확인
  const isMexcWallet = (address: string) => {
    return address.toLowerCase() === '0x4982085c9e2f89f2ecb8131eca71afad896e89cb';
  };

  // 지갑 유형 배지 표시
  const getWalletTypeBadge = (address: string) => {
    if (isMexcWallet(address)) {
      return (
        <Badge className="bg-orange-100 text-orange-800 text-xs">
          MEXC Exchange
        </Badge>
      );
    }
    return null;
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
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // SWAP 방향 배지 색상
  const getSwapDirectionColor = (direction: string) => {
    switch (direction) {
      case 'v1_to_v2': return 'bg-green-100 text-green-800';
      case 'v2_to_v1': return 'bg-blue-100 text-blue-800';
      case 'same_version': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // SWAP 방향 텍스트
  const getSwapDirectionText = (direction: string) => {
    switch (direction) {
      case 'v1_to_v2': return 'V1 → V2';
      case 'v2_to_v1': return 'V2 → V1';
      case 'same_version': return 'Same Version';
      default: return 'Unknown';
    }
  };

  // SWAP 사용자 검색
  const searchSwapper = async () => {
    if (!searchAddress.trim()) return;
    
    try {
      setLoading(true);
      const details = await swapAnalyticsAPI.getSwapperDetails(searchAddress.trim());
      setSwapperDetails(details);
    } catch (err) {
      setError('SWAP 사용자 정보를 찾을 수 없습니다.');
      setSwapperDetails(null);
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
        transactionsData,
        trendsData,
        topSwappersData,
        distributionData
      ] = await Promise.all([
        swapAnalyticsAPI.getSwapSummary(),
        swapAnalyticsAPI.getSwapTransactions(50),
        swapAnalyticsAPI.getSwapTrends(30),
        swapAnalyticsAPI.getTopSwappers(20),
        swapAnalyticsAPI.getSwapDistribution()
      ]);

      setSwapSummary(summaryData);
      setSwapTransactions(transactionsData);
      setSwapTrends(trendsData);
      setTopSwappers(topSwappersData);
      setSwapDistribution(distributionData);

    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('SWAP 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 로딩 상태
  if (loading && !swapSummary) {
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
  if (error && !swapSummary) {
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
          <h1 className="text-3xl font-bold">HKTM Swap Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Detailed analysis of HKTM token swap transactions and migration patterns
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 요약 통계 카드 */}
      {swapSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Swaps</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{swapSummary.totalSwapTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total swap transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(swapSummary.totalSwapVolume)}</div>
              <p className="text-xs text-muted-foreground">
                HKTM tokens swapped
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">V1 → V2 Migration</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(swapSummary.v1ToV2SwapVolume)}</div>
              <p className="text-xs text-muted-foreground">
                100% migration (one-way only)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Swappers</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{swapSummary.uniqueSwappers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatNumber(swapSummary.avgSwapAmount)} per swap
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 컨테이너 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="swappers">Top Swappers</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SWAP 분포 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>Swap Amount Distribution</CardTitle>
                <CardDescription>Distribution of swap amounts by range</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={swapDistribution.map(item => ({
                        ...item,
                        name: item.swapAmountRange,
                        value: item.swapCount
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                    >
                      {swapDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* SWAP 통계 */}
            <Card>
              <CardHeader>
                <CardTitle>Swap Statistics</CardTitle>
                <CardDescription>Key swap metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Largest Swap</div>
                      <div className="text-lg font-semibold">{formatNumber(swapSummary?.largestSwap || 0)} HKTM</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Smallest Swap</div>
                      <div className="text-lg font-semibold">{formatNumber(swapSummary?.smallestSwap || 0)} HKTM</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Migration Type</div>
                      <div className="text-lg font-semibold">One-Way Only</div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground">Migration Rate</div>
                      <div className="text-lg font-semibold">100%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 트랜잭션 탭 */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Swap Transactions</CardTitle>
              <CardDescription>Latest HKTM token swap transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {swapTransactions.slice(0, 20).map((tx, index) => (
                  <div key={`${tx.transactionHash}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getSwapDirectionColor(tx.swapDirection)}>
                        {getSwapDirectionText(tx.swapDirection)}
                      </Badge>
                      <div>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs font-mono">{shortenAddress(tx.transactionHash)}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(tx.transactionHash)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center space-x-2">
                            <span>From: <code className="font-mono">{tx.fromAddress}</code></span>
                            {getWalletTypeBadge(tx.fromAddress)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>To: <code className="font-mono">{tx.toAddress}</code></span>
                            {getWalletTypeBadge(tx.toAddress)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatNumber(tx.swapAmount)} HKTM
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(tx.datetimeUtc)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tx.method}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 트렌드 탭 */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Swap Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily swap volume and transaction count trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={[...swapTrends].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="swapVolume" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="v1ToV2Volume" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  <Area type="monotone" dataKey="v2ToV1Volume" stackId="3" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상위 SWAP 사용자 탭 */}
        <TabsContent value="swappers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Swappers</CardTitle>
              <CardDescription>Users with highest swap volumes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSwappers.slice(0, 20).map((swapper, index) => (
                  <div key={swapper.swapperAddress} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">{swapper.swapperAddress}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(swapper.swapperAddress)}
                          >
                            {copiedAddress === swapper.swapperAddress ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {swapper.totalSwapCount} swaps
                          </Badge>
                          {getWalletTypeBadge(swapper.swapperAddress)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatNumber(swapper.totalSwapVolume)} HKTM
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Migrated: {formatNumber(swapper.v1ToV2Volume)} HKTM
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {formatNumber(swapper.avgSwapAmount)} per swap
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 검색 탭 */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Swapper Search</CardTitle>
              <CardDescription>Search for specific wallet address swap details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter wallet address (0x...)"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchSwapper()}
                />
                <Button onClick={searchSwapper} disabled={loading}>
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

              {swapperDetails && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Swapper Details</h3>
                    <Badge variant="outline">
                      {swapperDetails.totalSwaps} total swaps
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Volume</p>
                      <p className="font-medium">{formatNumber(swapperDetails.totalVolume)} HKTM</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Migrated Volume</p>
                      <p className="font-medium">{formatNumber(swapperDetails.v1ToV2Volume)} HKTM</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Migration Type</p>
                      <p className="font-medium">V1 → V2 Only</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Swap Amount</p>
                      <p className="font-medium">{formatNumber(swapperDetails.avgSwapAmount)} HKTM</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Largest Swap</p>
                      <p className="font-medium">{formatNumber(swapperDetails.largestSwap)} HKTM</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Smallest Swap</p>
                      <p className="font-medium">{formatNumber(swapperDetails.smallestSwap)} HKTM</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">First Swap</p>
                      <p className="font-medium">{swapperDetails.firstSwapDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Swap</p>
                      <p className="font-medium">{swapperDetails.lastSwapDate}</p>
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
