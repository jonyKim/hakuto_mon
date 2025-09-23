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
  Copy, Check, Layers, Lock, Unlock, Activity, 
  Wallet, RefreshCw, Search, ExternalLink, AlertTriangle, TrendingUp
} from 'lucide-react';

import { 
  stakingAnalyticsAPI, 
  StakingSummary, 
  CollectionStakingStats, 
  StakingTransaction, 
  TopStaker, 
  StakingTrend,
  CollectionActivity,
  StakerDetails
} from '@/lib/api/staking-analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function StakingAnalyticsPage() {
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [stakerDetails, setStakerDetails] = useState<StakerDetails[]>([]);
  
  // 데이터 상태
  const [stakingSummary, setStakingSummary] = useState<StakingSummary | null>(null);
  const [collectionStats, setCollectionStats] = useState<CollectionStakingStats[]>([]);
  const [stakingTransactions, setStakingTransactions] = useState<StakingTransaction[]>([]);
  const [topStakers, setTopStakers] = useState<TopStaker[]>([]);
  const [stakingTrends, setStakingTrends] = useState<StakingTrend[]>([]);
  const [collectionActivity, setCollectionActivity] = useState<CollectionActivity[]>([]);
  
  // 트랜잭션 필터 상태
  const [selectedCollection, setSelectedCollection] = useState<string>('All');

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

  // BNB 포맷팅
  const formatBNB = (bnb: number) => {
    return `${bnb.toFixed(6)} BNB`;
  };

  // 트랜잭션 타입 배지 색상
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'stake': return 'bg-green-100 text-green-800';
      case 'unstake': return 'bg-red-100 text-red-800';
      case 'transfer': return 'bg-blue-100 text-blue-800';
      case 'mint': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 트랜잭션 타입 텍스트
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'stake': return 'Stake';
      case 'unstake': return 'Unstake';
      case 'transfer': return 'Transfer';
      case 'mint': return 'Mint';
      default: return 'Unknown';
    }
  };

  // 트랜잭션 로드
  const loadTransactions = async (collection: string = 'All') => {
    try {
      const transactionsData = await stakingAnalyticsAPI.getStakingTransactions(50, collection);
      setStakingTransactions(transactionsData);
    } catch (err) {
      console.error('트랜잭션 로드 실패:', err);
    }
  };

  // 컬렉션 변경 핸들러
  const handleCollectionChange = (collection: string) => {
    setSelectedCollection(collection);
    loadTransactions(collection);
  };

  // 스테이커 검색
  const searchStaker = async () => {
    if (!searchAddress.trim()) return;
    
    try {
      setLoading(true);
      const details = await stakingAnalyticsAPI.getStakerDetails(searchAddress.trim());
      setStakerDetails(details);
    } catch (err) {
      setError('스테이커 정보를 찾을 수 없습니다.');
      setStakerDetails([]);
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
        collectionStatsData,
        transactionsData,
        topStakersData,
        trendsData,
        activityData
      ] = await Promise.all([
        stakingAnalyticsAPI.getStakingSummary(),
        stakingAnalyticsAPI.getCollectionStakingStats(),
        stakingAnalyticsAPI.getStakingTransactions(50),
        stakingAnalyticsAPI.getTopStakers(20),
        stakingAnalyticsAPI.getStakingTrends(30),
        stakingAnalyticsAPI.getCollectionActivity(7)
      ]);

      setStakingSummary(summaryData);
      setCollectionStats(collectionStatsData);
      setStakingTransactions(transactionsData);
      setTopStakers(topStakersData);
      setStakingTrends(trendsData);
      setCollectionActivity(activityData);

    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('스테이킹 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 로딩 상태
  if (loading && !stakingSummary) {
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
  if (error && !stakingSummary) {
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
          <h1 className="text-3xl font-bold">NFT Staking Analytics</h1>
          <p className="text-muted-foreground mt-1">
            On-chain analysis of HAKUTO, HAKUTO HALF, and PUSA NFT staking activities
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 요약 통계 카드 */}
      {stakingSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stakingSummary.totalCollections}</div>
              <p className="text-xs text-muted-foreground">
                Stakeable NFT collections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total NFTs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stakingSummary.totalNFTs)}</div>
              <p className="text-xs text-muted-foreground">
                Staked: {stakingSummary.totalStakedNFTs} | Unstaked: {stakingSummary.totalUnstakedNFTs}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staking Rate</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stakingSummary.stakingRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                {stakingSummary.totalStakedNFTs} NFTs currently staked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stakers</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stakingSummary.totalStakers}</div>
              <p className="text-xs text-muted-foreground">
                Active: {stakingSummary.activeStakers} stakers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 컨테이너 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="stakers">Top Stakers</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 컬렉션별 스테이킹 현황 */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Staking Overview</CardTitle>
                <CardDescription>Staking statistics by NFT collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collectionStats.map((collection) => (
                    <div key={collection.contractAddress} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{collection.collectionName}</h3>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{collection.totalNFTs} NFTs</Badge>
                          <Badge variant="secondary">{collection.totalTransactions} TXs</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Currently Staked</p>
                          <p className="font-medium text-green-600">{collection.currentlyStaked}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Staking Rate</p>
                          <p className="font-medium">{collection.stakingRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unique Stakers</p>
                          <p className="font-medium">{collection.uniqueStakers}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Staked</p>
                          <p className="font-medium">{collection.totalStaked}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 스테이킹 통계 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>Staking Distribution</CardTitle>
                <CardDescription>NFT staking distribution by collection</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={collectionStats.map(item => ({
                        name: item.collectionName,
                        value: item.totalStaked,
                        percentage: item.stakingRate
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${entry.name}: ${entry.value}`}
                    >
                      {collectionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 컬렉션 탭 */}
        <TabsContent value="collections" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {collectionStats.map((collection) => (
              <Card key={collection.contractAddress}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{collection.collectionName}</CardTitle>
                      <CardDescription>
                        {collection.collectionSymbol} • {collection.contractAddress}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {collection.stakingRate.toFixed(1)}% staked
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total NFTs</p>
                      <p className="text-2xl font-bold">{collection.totalNFTs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Currently Staked</p>
                      <p className="text-2xl font-bold text-green-600">{collection.currentlyStaked}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Stakers</p>
                      <p className="text-2xl font-bold">{collection.uniqueStakers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Fees</p>
                      <p className="text-2xl font-bold">{formatBNB(collection.totalStakingFees)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">First Staking</p>
                        <p className="font-medium">{collection.firstStakingDate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Activity</p>
                        <p className="font-medium">{collection.lastActivityDate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Admin Address</p>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs font-mono">{shortenAddress(collection.stakingAdminAddress)}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(collection.stakingAdminAddress)}
                          >
                            {copiedAddress === collection.stakingAdminAddress ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Fee</p>
                        <p className="font-medium">{formatBNB(collection.avgStakingFee)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 트랜잭션 탭 */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Staking Transactions</CardTitle>
              <CardDescription>Latest NFT staking and unstaking activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stakingTransactions.slice(0, 20).map((tx, index) => (
                  <div key={`${tx.transactionHash}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getTransactionTypeColor(tx.transactionType)}>
                        {getTransactionTypeText(tx.transactionType)}
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
                          <div>Collection: {tx.collectionName}</div>
                          <div>From: <code className="font-mono">{shortenAddress(tx.fromAddress)}</code></div>
                          <div>To: <code className="font-mono">{shortenAddress(tx.toAddress)}</code></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatBNB(tx.txnFee)}
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

        {/* 상위 스테이커 탭 */}
        <TabsContent value="stakers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Stakers</CardTitle>
              <CardDescription>Users with highest staking activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topStakers.slice(0, 20).map((staker, index) => (
                  <div key={staker.stakerAddress} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">{staker.stakerAddress}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(staker.stakerAddress)}
                          >
                            {copiedAddress === staker.stakerAddress ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {staker.totalStakingTransactions} stakes
                          </Badge>
                          <Badge variant="outline">
                            {staker.stakedCollections.length} collections
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        Net: {staker.netStakedNFTs} NFTs
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Unstaked: {staker.totalUnstakingTransactions}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fees: {formatBNB(staker.totalStakingFees)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last: {staker.lastActivityDate}
                      </div>
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
              <CardTitle>Staking Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily staking and unstaking activity trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={[...stakingTrends].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="totalStakingTransactions" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Staking" />
                  <Area type="monotone" dataKey="totalUnstakingTransactions" stackId="2" stroke="#ffc658" fill="#ffc658" name="Unstaking" />
                  <Area type="monotone" dataKey="netStakingChange" stackId="3" stroke="#8884d8" fill="#8884d8" name="Net Change" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 검색 탭 */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staker Search</CardTitle>
              <CardDescription>Search for specific wallet address staking details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter wallet address (0x...)"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchStaker()}
                />
                <Button onClick={searchStaker} disabled={loading}>
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

              {stakerDetails.length > 0 && (
                <div className="space-y-4">
                  {stakerDetails.map((detail, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{detail.collectionName}</h3>
                        <Badge variant="outline">
                          Net: {detail.netStaked} NFTs
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Staking Count</p>
                          <p className="font-medium">{detail.stakingCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unstaking Count</p>
                          <p className="font-medium">{detail.unstakingCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Fees</p>
                          <p className="font-medium">{formatBNB(detail.totalFees)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Contract</p>
                          <p className="font-medium font-mono text-xs">{shortenAddress(detail.contractAddress)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">First Staking</p>
                          <p className="font-medium">{detail.firstStakingDate || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Activity</p>
                          <p className="font-medium">{detail.lastActivityDate || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
