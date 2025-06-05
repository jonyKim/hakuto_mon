"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { dashboardApi } from '@/lib/api/dashboard'

export default function DashboardPage() {
  const [overview, setOverview] = useState({
    stats: {
      total_nfts: 0,
      total_nfts_change: 0,
      total_staked: 0,
      total_staked_change: 0,
      total_rewards: 0,
      total_rewards_change: 0,
      staking_stats: [],
      today_withdrawn: 0
    },
    staking_trends: [],
    reward_trends: []
  });

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await dashboardApi.getDashboardOverview();
        setOverview(data);
      } catch (error) {
        console.error('Error fetching dashboard overview:', error);
      }
    };
    fetchOverview();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* NFT Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">NFT Stats</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total NFTs</span>
                <span>{overview.stats.total_nfts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Change Percentage</span>
                <span>{overview.stats.total_nfts_change.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staking Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Staking Stats</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Staked</span>
                <span>{overview.stats.total_staked.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Change Percentage</span>
                <span>{overview.stats.total_staked_change.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reward Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Reward Stats</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Rewards</span>
                <span>{overview.stats.total_rewards.toLocaleString()} HKTM</span>
              </div>
              <div className="flex justify-between">
                <span>Change Percentage</span>
                <span>{overview.stats.total_rewards_change.toFixed(2)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdraw Stats */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Today Withdrawn</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Today Withdrawn</span>
                <span>{overview.stats.today_withdrawn?.toLocaleString()} HKTM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 