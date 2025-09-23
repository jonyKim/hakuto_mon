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
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Copy, Check, Users, Coins, TrendingUp, Activity, 
  Wallet, RefreshCw, Search, ExternalLink, AlertTriangle
} from 'lucide-react';

import { 
  tokenAnalyticsAPI, 
  TokenStatsSummary, 
  TokenHolderSummary, 
  TopTokenHolder, 
  TokenTransaction, 
  MigrationStatus, 
  TokenDistribution
} from '@/lib/api/token-analytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TokenAnalyticsPage() {
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [holderDetails, setHolderDetails] = useState<any[]>([]);
  
  // 데이터 상태
  const [statsSummary, setStatsSummary] = useState<TokenStatsSummary | null>(null);
  const [holderSummary, setHolderSummary] = useState<TokenHolderSummary[]>([]);
  const [topHolders, setTopHolders] = useState<TopTokenHolder[]>([]);
  const [topHoldersV1, setTopHoldersV1] = useState<TopTokenHolder[]>([]);
  const [topHoldersV2, setTopHoldersV2] = useState<TopTokenHolder[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TokenTransaction[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);
  const [tokenDistribution, setTokenDistribution] = useState<TokenDistribution[]>([]);
  const [selectedTokenVersion, setSelectedTokenVersion] = useState<'all' | 'v1' | 'v2'>('all');

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
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  // 홀더 카테고리 배지 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'whale': return 'bg-purple-100 text-purple-800';
      case 'large': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-green-100 text-green-800';
      case 'small': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 마이그레이션 상태 배지 색상
  const getMigrationStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'v1_only': return 'bg-red-100 text-red-800';
      case 'v2_only': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 마이그레이션 상태 텍스트
  const getMigrationStatusText = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'partial': return 'Partial';
      case 'v1_only': return 'V1 Only';
      case 'v2_only': return 'V2 Only';
      default: return 'Unknown';
    }
  };

  // 홀더 검색
  const searchHolder = async () => {
    if (!searchAddress.trim()) return;
    
    try {
      setLoading(true);
      const details = await tokenAnalyticsAPI.getHolderDetails(searchAddress.trim());
      setHolderDetails(details);
    } catch (err) {
      setError('홀더 정보를 찾을 수 없습니다.');
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
        holderSummaryData,
        topHoldersData,
        topHoldersV1Data,
        topHoldersV2Data,
        transactionsData,
        migrationData,
        distributionData
      ] = await Promise.all([
        tokenAnalyticsAPI.getTokenStatsSummary(),
        tokenAnalyticsAPI.getTokenHolderSummary(),
        tokenAnalyticsAPI.getTopTokenHolders(undefined, 20),
        tokenAnalyticsAPI.getTopTokenHolders('v1', 20),
        tokenAnalyticsAPI.getTopTokenHolders('v2', 20),
        tokenAnalyticsAPI.getRecentTokenTransactions(50),
        tokenAnalyticsAPI.getMigrationStatus(),
        tokenAnalyticsAPI.getTokenDistribution()
      ]);

      setStatsSummary(summaryData);
      setHolderSummary(holderSummaryData);
      setTopHolders(topHoldersData);
      setTopHoldersV1(topHoldersV1Data);
      setTopHoldersV2(topHoldersV2Data);
      setRecentTransactions(transactionsData);
      setMigrationStatus(migrationData);
      setTokenDistribution(distributionData);

    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 로딩 상태
  if (loading && !statsSummary) {
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
  if (error) {
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
          <h1 className="text-3xl font-bold">HKTM Token Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analysis of HKTM v1 and v2 token holders and transactions
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 요약 통계 카드 */}
      {statsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Holders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsSummary.totalHolders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                V1: {statsSummary.v1Holders} | V2: {statsSummary.v2Holders}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Holders</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsSummary.uniqueHolders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Distinct wallet addresses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsSummary.totalTransactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                V1: {statsSummary.v1Transactions} | V2: {statsSummary.v2Transactions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Migration Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((statsSummary.v2Holders / statsSummary.v1Holders) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                V1 to V2 migration progress
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 컨테이너 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holders">Top Holders</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="migration">Migration</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 토큰별 홀더 통계 */}
            <Card>
              <CardHeader>
                <CardTitle>Token Holder Statistics</CardTitle>
                <CardDescription>Comparison between HKTM v1 and v2</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {holderSummary.map((token) => (
                    <div key={token.tokenVersion} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">HKTM {token.tokenVersion.toUpperCase()}</h3>
                        <Badge variant="outline">{token.totalHolders} holders</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Balance</p>
                          <p className="font-medium">{formatNumber(token.totalBalance)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Balance</p>
                          <p className="font-medium">{formatNumber(token.avgBalance)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Whales</p>
                          <p className="font-medium">{token.whaleCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Large Holders</p>
                          <p className="font-medium">{token.largeCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 토큰 분포 차트 */}
            <Card>
              <CardHeader>
                <CardTitle>Token Distribution</CardTitle>
                <CardDescription>Holder distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tokenDistribution.filter(d => d.tokenVersion === 'v1').map(item => ({
                        ...item,
                        name: item.holderTier,
                        value: item.holderCount
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry: any) => `${entry.holderTier}: ${entry.percentage.toFixed(1)}%`}
                    >
                      {tokenDistribution.filter(d => d.tokenVersion === 'v1').map((entry, index) => (
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

        {/* 상위 홀더 탭 */}
        <TabsContent value="holders" className="space-y-4">
          {/* 토큰 버전 선택 버튼 */}
          <div className="flex space-x-2">
            <Button
              variant={selectedTokenVersion === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedTokenVersion('all')}
            >
              All Tokens
            </Button>
            <Button
              variant={selectedTokenVersion === 'v1' ? 'default' : 'outline'}
              onClick={() => setSelectedTokenVersion('v1')}
            >
              HKTM V1
            </Button>
            <Button
              variant={selectedTokenVersion === 'v2' ? 'default' : 'outline'}
              onClick={() => setSelectedTokenVersion('v2')}
            >
              HKTM V2
            </Button>
          </div>

          {/* All Tokens */}
          {selectedTokenVersion === 'all' && (
            <Card>
              <CardHeader>
                <CardTitle>Top Token Holders - All Versions</CardTitle>
                <CardDescription>Largest HKTM token holders across v1 and v2</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topHolders.slice(0, 20).map((holder, index) => (
                    <div key={`${holder.holderAddress}-${holder.tokenVersion}`} 
                         className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">#{holder.holderRank}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm font-mono">{holder.holderAddress}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(holder.holderAddress)}
                            >
                              {copiedAddress === holder.holderAddress ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline">
                              {holder.tokenVersion.toUpperCase()}
                            </Badge>
                            <Badge className={getCategoryColor(holder.holderCategory)}>
                              {holder.holderCategory}
                            </Badge>
                            {getWalletTypeBadge(holder.holderAddress)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(holder.balanceFormatted)} HKTM
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {holder.percentageOfSupply.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {holder.transactionCount} txs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* HKTM V1 */}
          {selectedTokenVersion === 'v1' && (
            <Card>
              <CardHeader>
                <CardTitle>Top HKTM V1 Holders</CardTitle>
                <CardDescription>Largest HKTM v1 token holders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topHoldersV1.map((holder, index) => (
                    <div key={`${holder.holderAddress}-v1`} 
                         className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">#{holder.holderRank}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm font-mono">{holder.holderAddress}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(holder.holderAddress)}
                            >
                              {copiedAddress === holder.holderAddress ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              V1
                            </Badge>
                            <Badge className={getCategoryColor(holder.holderCategory)}>
                              {holder.holderCategory}
                            </Badge>
                            {getWalletTypeBadge(holder.holderAddress)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(holder.balanceFormatted)} HKTM
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {holder.percentageOfSupply.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {holder.transactionCount} txs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* HKTM V2 */}
          {selectedTokenVersion === 'v2' && (
            <Card>
              <CardHeader>
                <CardTitle>Top HKTM V2 Holders</CardTitle>
                <CardDescription>Largest HKTM v2 token holders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topHoldersV2.map((holder, index) => (
                    <div key={`${holder.holderAddress}-v2`} 
                         className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-800">#{holder.holderRank}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <code className="text-sm font-mono">{holder.holderAddress}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(holder.holderAddress)}
                            >
                              {copiedAddress === holder.holderAddress ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              V2
                            </Badge>
                            <Badge className={getCategoryColor(holder.holderCategory)}>
                              {holder.holderCategory}
                            </Badge>
                            {getWalletTypeBadge(holder.holderAddress)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(holder.balanceFormatted)} HKTM
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {holder.percentageOfSupply.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {holder.transactionCount} txs
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 트랜잭션 탭 */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest HKTM token transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.slice(0, 20).map((tx, index) => (
                  <div key={`${tx.transactionHash}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">
                        {tx.tokenVersion.toUpperCase()}
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
                        {formatNumber(tx.quantityFormatted)} HKTM
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(tx.datetimeUtc)}
                      </div>
                      <Badge variant={tx.isSwap ? 'default' : 'secondary'} className="text-xs">
                        {tx.method}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 마이그레이션 탭 */}
        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Migration Status</CardTitle>
              <CardDescription>HKTM v1 to v2 migration progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {migrationStatus.slice(0, 20).map((holder) => (
                  <div key={holder.holderAddress} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">{holder.holderAddress}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(holder.holderAddress)}
                          >
                            {copiedAddress === holder.holderAddress ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getMigrationStatusColor(holder.migrationStatus)}>
                            {getMigrationStatusText(holder.migrationStatus)}
                          </Badge>
                          <Badge className={getCategoryColor(holder.holderCategory)}>
                            {holder.holderCategory}
                          </Badge>
                          {getWalletTypeBadge(holder.holderAddress)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">V1:</span> {formatNumber(holder.v1Balance)} 
                        <span className="text-xs text-muted-foreground ml-1">({holder.v1Percentage.toFixed(2)}%)</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">V2:</span> {formatNumber(holder.v2Balance)}
                        <span className="text-xs text-muted-foreground ml-1">({holder.v2Percentage.toFixed(2)}%)</span>
                      </div>
                      <div className="font-semibold text-sm">
                        Total: {formatNumber(holder.totalBalance)} HKTM
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
              <CardTitle>Holder Search</CardTitle>
              <CardDescription>Search for specific wallet address details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter wallet address (0x...)"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchHolder()}
                />
                <Button onClick={searchHolder} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {holderDetails.length > 0 && (
                <div className="space-y-4">
                  {holderDetails.map((detail, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline">
                          HKTM {detail.tokenVersion.toUpperCase()}
                        </Badge>
                        <Badge className={getCategoryColor(detail.holderCategory)}>
                          {detail.holderCategory}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p className="font-medium">{formatNumber(detail.balanceFormatted)} HKTM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rank</p>
                          <p className="font-medium">#{detail.holderRank}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Percentage</p>
                          <p className="font-medium">{detail.percentageOfSupply.toFixed(4)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transactions</p>
                          <p className="font-medium">{detail.transactionCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Received</p>
                          <p className="font-medium">{formatNumber(detail.totalReceived)} HKTM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Sent</p>
                          <p className="font-medium">{formatNumber(detail.totalSent)} HKTM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">First Acquisition</p>
                          <p className="font-medium">{detail.firstAcquisitionDate}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Activity</p>
                          <p className="font-medium">{detail.lastActivityDate}</p>
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
