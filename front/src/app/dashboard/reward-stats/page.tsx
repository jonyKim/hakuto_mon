"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { rewardStatsApi } from '@/lib/api/reward-stats'

export default function RewardStatsPage() {
  const [summary, setSummary] = useState({
    total_rewards: 0,
    by_user: [] as { own_waletaddress: string; total_rewards: number }[],
    by_date: [] as { date: string; total_rewards: number }[],
    by_month: [] as { month: string; total_rewards: number }[],
    by_nft: { pusa: 0, hakuto_half: 0, hakuto: 0 }
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await rewardStatsApi.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching reward summary:', error);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reward Statistics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Rewards */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Total Rewards</h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(summary.total_rewards ?? 0).toLocaleString()} HKTM</div>
          </CardContent>
        </Card>

        {/* Top Reward Recipients */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Reward Recipients</h3>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Address</th>
                    <th className="text-right">Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_user.slice(0, 5).map(row => (
                    <tr key={row.own_waletaddress}>
                      <td className="truncate">{row.own_waletaddress}</td>
                      <td className="text-right">
                        {Math.floor(row.total_rewards).toLocaleString()} HKTM
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <button
                className="px-3 py-1 text-xs rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold"
                onClick={() => setShowModal(true)}
              >
                More
              </button>
            </div>
          </CardContent>
        </Card>

        {/* NFT Type Rewards */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Rewards by NFT Type</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>PUSA</span>
                <span>{(summary.by_nft?.pusa ?? 0).toLocaleString()} HKTM</span>
              </div>
              <div className="flex justify-between">
                <span>HAKUTO HALF</span>
                <span>{(summary.by_nft?.hakuto_half ?? 0).toLocaleString()} HKTM</span>
              </div>
              <div className="flex justify-between">
                <span>HAKUTO</span>
                <span>{(summary.by_nft?.hakuto ?? 0).toLocaleString()} HKTM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Reward Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily Reward Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y">
              {[...summary.by_date].slice(0, 14).map(row => {
                const localDate = new Date(row.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                return (
                  <li key={row.date} className="flex justify-between py-2">
                    <span className="font-mono">{localDate}</span>
                    <span className="font-bold text-indigo-600">
                      {Math.floor(row.total_rewards).toLocaleString()} HKTM
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Reward Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Monthly Reward Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <ul className="divide-y">
              {summary.by_month.map(row => (
                <li key={row.month} className="flex justify-between py-2">
                  <span className="font-mono">{row.month}</span>
                  <span className="font-bold text-indigo-600">
                    {Math.floor(row.total_rewards).toLocaleString()} HKTM
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Top 100 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-bold">Top 100 Reward Recipients</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowModal(false)}
              >×</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Rank</th>
                    <th className="text-left">Address</th>
                    <th className="text-right">Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_user.slice(0, 100).map((row, idx) => (
                    <tr key={row.own_waletaddress}>
                      <td>{idx + 1}</td>
                      <td className="truncate">{row.own_waletaddress}</td>
                      <td className="text-right">
                        {Math.floor(row.total_rewards).toLocaleString()} HKTM
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end px-6 py-3 border-t">
              <button
                className="px-4 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 