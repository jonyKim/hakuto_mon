"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { dashboardApi } from '@/lib/api/dashboard'

export default function DashboardPage() {
  const [missionStats, setMissionStats] = useState({
    total_claims: 0,
    completed_claims: 0,
    failed_claims: 0,
    total_rewards: 0
  });
  const [totalRewards, setTotalRewards] = useState(0);
  const [failedTxCount, setFailedTxCount] = useState(0);
  const [rewardsByAddress, setRewardsByAddress] = useState<{ wallet_address: string, total_reward: number }[]>([]);
  const [dailyStats, setDailyStats] = useState<{ date: string, count: number, total_reward: number }[]>([]);

  useEffect(() => {
    // 오늘의 미션 현황
    const fetchTodayMissionStats = async () => {
      const stats = await dashboardApi.getTodayMissionStats();
      setMissionStats(stats || {
        total_claims: 0,
        completed_claims: 0,
        failed_claims: 0,
        total_rewards: 0
      });
    };

    // 전체 통계
    const fetchTotalRewards = async () => {
      const { total } = await dashboardApi.getTotalRewards();
      setTotalRewards(total);
    };
    const fetchFailedTxCount = async () => {
      const { count } = await dashboardApi.getFailedTransactions();
      setFailedTxCount(count);
    };

    // 주소별 지급
    const fetchRewardsByAddress = async () => {
      const data = await dashboardApi.getRewardsByAddress();
      setRewardsByAddress(data);
    };

    // 날짜별 트랜잭션
    const fetchDailyStats = async () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7); // 최근 7일
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      const data = await dashboardApi.getDailyStats(start.toISOString(), end.toISOString());
      setDailyStats(data);
    };

    fetchTodayMissionStats();
    fetchTotalRewards();
    fetchFailedTxCount();
    fetchRewardsByAddress();
    fetchDailyStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 오늘의 미션 현황 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">오늘의 미션 현황</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>총 신청 건수</span><span>{missionStats.total_claims}건</span></div>
              <div className="flex justify-between"><span>완료된 보상</span><span>{missionStats.completed_claims}건</span></div>
              <div className="flex justify-between"><span>실패한 보상</span><span>{missionStats.failed_claims}건</span></div>
              <div className="flex justify-between"><span>총 지급 LFIT</span><span>{missionStats.total_rewards.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} LFIT</span></div>
            </div>
          </CardContent>
        </Card>
        {/* 전체 통계 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">전체 통계</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>총 리워드 지급</span><span>{totalRewards.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} LFIT</span></div>
              <div className="flex justify-between"><span>실패 트랜잭션 수</span><span>{failedTxCount}건</span></div>
            </div>
          </CardContent>
        </Card>
        {/* 주소별 지급 보상 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">주소별 지급 보상</h3>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr><th className="text-left">주소</th><th className="text-right">지급 LFIT</th></tr>
                </thead>
                <tbody>
                  {rewardsByAddress.map(row => (
                    <tr key={row.wallet_address}>
                      <td className="truncate">{row.wallet_address}</td>
                      <td className="text-right">{row.total_reward.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* 날짜별 트랜잭션 통계 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">최근 7일 트랜잭션 및 보상량</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">날짜</th>
                  <th className="text-right">트랜잭션 수</th>
                  <th className="text-right">총 지급 LFIT</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map(row => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td className="text-right">{row.count}</td>
                    <td className="text-right">{row.total_reward.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 