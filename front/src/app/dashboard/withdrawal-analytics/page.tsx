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
  Copy, Check, Coins, TrendingUp, Users, Calendar, 
  Wallet, RefreshCw, Search, ExternalLink, AlertTriangle, Gift
} from 'lucide-react';

import { 
  stakingRewardsAPI, 
  StakingRewardSummary, 
  StakerRewardDetails, 
  RewardTransaction, 
  RewardDistribution
} from '@/lib/api/staking-rewards';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function WithdrawalAnalyticsPage() {
  // 상태 관리
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [stakerRewardDetails, setStakerRewardDetails] = useState<StakerRewardDetails | null>(null);
  
  // 데이터 상태
  const [rewardSummary, setRewardSummary] = useState<StakingRewardSummary | null>(null);
  const [topRecipients, setTopRecipients] = useState<StakerRewardDetails[]>([]);
  const [rewardDistribution, setRewardDistribution] = useState<RewardDistribution[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RewardTransaction[]>([]);

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
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M HKTM`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K HKTM`;
    }
    return `${amount.toLocaleString()} HKTM`;
  };

  // 스테이커 검색
  const searchStaker = async () => {
    if (!searchAddress.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const details = await stakingRewardsAPI.getStakerRewardDetails(searchAddress.trim());
      setStakerRewardDetails(details);
    } catch (err) {
      setError('스테이커 보상 정보를 찾을 수 없습니다.');
      setStakerRewardDetails(null);
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
        recipientsData,
        distributionData,
        transactionsData
      ] = await Promise.all([
        stakingRewardsAPI.getStakingRewardSummary(),
        stakingRewardsAPI.getTopRewardRecipients(20),
        stakingRewardsAPI.getRewardDistribution(30),
        stakingRewardsAPI.getRecentRewardTransactions(50)
      ]);

      setRewardSummary(summaryData);
      setTopRecipients(recipientsData);
      setRewardDistribution(distributionData);
      setRecentTransactions(transactionsData);

    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('스테이킹 보상 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);

  // 로딩 상태
  if (loading && !rewardSummary) {
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
  if (error && !rewardSummary) {
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
          <h1 className="text-3xl font-bold">NFT Staking Withdrawal Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Analysis of HKTM v1 withdrawal distributed to NFT stakers
          </p>
        </div>
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* 요약 통계 카드 */}
      {rewardSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHKTM(rewardSummary.totalRewardAmount)}</div>
              <p className="text-xs text-muted-foreground">
                {rewardSummary.totalRewardTransactions} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewarded Stakers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewardSummary.totalRewardedStakers}</div>
              <p className="text-xs text-muted-foreground">
                Unique reward recipients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Reward</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHKTM(rewardSummary.avgRewardPerStaker)}</div>
              <p className="text-xs text-muted-foreground">
                Per staker average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reward Period</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rewardSummary.totalStakingDays}</div>
              <p className="text-xs text-muted-foreground">
                Days of rewards
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 탭 컨테이너 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Top Recipients</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Overview</CardTitle>
              <CardDescription>
                Complete analysis of HKTM v1 withdrawals distributed to NFT stakers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {rewardSummary ? formatHKTM(rewardSummary.totalRewardAmount) : '0 HKTM'}
                </div>
                <p className="text-lg text-muted-foreground mb-4">Total Withdrawals</p>
                
                {rewardSummary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-semibold">{rewardSummary.totalRewardTransactions}</div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold">{rewardSummary.totalRewardedStakers}</div>
                      <p className="text-sm text-muted-foreground">Unique Recipients</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold">{formatHKTM(rewardSummary.avgRewardPerStaker)}</div>
                      <p className="text-sm text-muted-foreground">Average per Staker</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Collection-specific reward distribution analysis is not available 
                    as withdrawal transactions don't contain NFT collection information. 
                    This shows the complete withdrawal activity from the reward distributor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상위 수령자 탭 */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Reward Recipients</CardTitle>
              <CardDescription>Stakers with highest reward amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topRecipients.slice(0, 20).map((recipient, index) => (
                  <div key={recipient.stakerAddress} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">{recipient.stakerAddress}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(recipient.stakerAddress)}
                          >
                            {copiedAddress === recipient.stakerAddress ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {recipient.rewardTransactionCount} rewards
                          </Badge>
                          <Badge variant="outline">
                            {recipient.stakedNFTs} NFTs staked
                          </Badge>
                          <Badge variant="outline">
                            {recipient.stakedCollections.length} collections
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        {formatHKTM(recipient.totalRewardAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {formatHKTM(recipient.avgRewardAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {recipient.firstRewardDate} ~ {recipient.lastRewardDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* 트랜잭션 탭 */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reward Transactions</CardTitle>
              <CardDescription>Latest HKTM v1 reward distributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.slice(0, 20).map((tx, index) => (
                  <div key={`${tx.transactionHash}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-green-100 text-green-800">
                        Reward
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
                          <div>To: <code className="font-mono">{shortenAddress(tx.toAddress)}</code></div>
                          <div>Amount: <span className="font-medium text-green-600">{formatHKTM(tx.rewardAmount)}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        Block #{tx.blockNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(tx.datetimeUtc)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {tx.tokenVersion.toUpperCase()}
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
              <CardTitle>Reward Distribution Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily reward distribution patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={[...rewardDistribution].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => {
                    if (name === 'totalRewardAmount') return formatHKTM(value);
                    return value;
                  }} />
                  <Area type="monotone" dataKey="totalRewardAmount" stroke="#82ca9d" fill="#82ca9d" name="Daily Rewards" />
                  <Area type="monotone" dataKey="rewardedStakers" stroke="#8884d8" fill="#8884d8" name="Rewarded Stakers" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 검색 탭 */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staker Reward Search</CardTitle>
              <CardDescription>Search for specific wallet address reward details</CardDescription>
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

              {stakerRewardDetails && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Reward Summary</h3>
                      <Badge variant="outline">
                        {formatHKTM(stakerRewardDetails.totalRewardAmount)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-muted-foreground">Total Rewards</p>
                        <p className="font-medium text-green-600">{formatHKTM(stakerRewardDetails.totalRewardAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reward Count</p>
                        <p className="font-medium">{stakerRewardDetails.rewardTransactionCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Reward</p>
                        <p className="font-medium">{formatHKTM(stakerRewardDetails.avgRewardAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Staked NFTs</p>
                        <p className="font-medium">{stakerRewardDetails.stakedNFTs}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">First Reward</p>
                        <p className="font-medium">{stakerRewardDetails.firstRewardDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Reward</p>
                        <p className="font-medium">{stakerRewardDetails.lastRewardDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Collections</p>
                        <p className="font-medium">{stakerRewardDetails.stakedCollections.join(', ')}</p>
                      </div>
                    </div>

                    {stakerRewardDetails.rewardTransactions.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recent Reward Transactions</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {stakerRewardDetails.rewardTransactions.slice(0, 10).map((tx, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <code className="text-xs font-mono">{shortenAddress(tx.transactionHash)}</code>
                                <div className="text-xs text-muted-foreground">{formatDateTime(tx.datetimeUtc)}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-600">{formatHKTM(tx.rewardAmount)}</div>
                                <div className="text-xs text-muted-foreground">Block #{tx.blockNumber}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
