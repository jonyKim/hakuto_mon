"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { stakeStatsApi } from '@/lib/api/stake-stats'

const NFT_ADDRESS_MAP: Record<string, string> = {
  '0x146A5e6fd1ca56Bc6b4BB54Bf7A577CB71517da6': 'PUSA',
  '0x687F077249c6010BcAdD06E212BfE35bA42a8C41': 'HAKUTO HALF',
  '0xbc557F677fC5b75D7aFdCb7E4F82c1b4843072B1': 'HAKUTO'
};

export default function StakingStatsPage() {
  const [summary, setSummary] = useState({
    total_staked: 0,
    by_admin: [] as { admin_waletaddress: string; staked_count: number }[],
    by_type: { pusa: 0, hakuto_half: 0, hakuto: 0 },
    by_date: [] as { date: string; count: number }[],
    by_user_type: [] as { own_waletaddress: string; contract_address: string; staked_count: number }[]
  });
  const [showAll, setShowAll] = useState(false);

  // 오늘 날짜 (로컬 기준, YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await stakeStatsApi.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching staking summary:', error);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staking Statistics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Staked */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Total Staked NFTs</h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(summary.total_staked ?? 0).toLocaleString()} NFTs</div>
          </CardContent>
        </Card>

        {/* Staked by NFT Type */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Staked by NFT Type</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>PUSA</span>
                <span>{(summary.by_type?.pusa ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>HAKUTO HALF</span>
                <span>{(summary.by_type?.hakuto_half ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>HAKUTO</span>
                <span>{(summary.by_type?.hakuto ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staked by Admin */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Staked by Admin</h3>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Admin Address</th>
                    <th className="text-right">Staked</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_admin.map(row => (
                    <tr key={row.admin_waletaddress}>
                      <td className="truncate">{row.admin_waletaddress}</td>
                      <td className="text-right">{row.staked_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Staking Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily Staking Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y">
              {[...summary.by_date].slice(0, showAll ? summary.by_date.length : 14).map(row => {
                const localDate = new Date(row.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                const isToday = localDate === todayStr;
                return (
                  <li
                    key={row.date}
                    className={`flex justify-between py-2 items-center ${isToday ? 'bg-indigo-50 font-bold text-indigo-700 rounded' : ''}`}
                  >
                    <span className={`font-mono ${isToday ? 'text-indigo-700' : ''}`}>{localDate}</span>
                    <span className={`font-bold ${isToday ? 'text-indigo-700' : 'text-indigo-600'}`}>{row.count.toLocaleString()}</span>
                    {isToday && <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-200 text-indigo-800 rounded">Today</span>}
                  </li>
                );
              })}
            </ul>
            {summary.by_date.length > 14 && (
              <div className="flex justify-center mt-2">
                <button
                  className="px-4 py-1 text-sm rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold"
                  onClick={() => setShowAll(v => !v)}
                >
                  {showAll ? 'Hide' : 'Show More'}
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User + NFT Type Staking Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">User + NFT Type Staking Stats</h3>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">User Address</th>
                  <th className="text-left">NFT Type</th>
                  <th className="text-right">Staked</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_user_type.slice(0, 100).map(row => (
                  <tr key={row.own_waletaddress + row.contract_address}>
                    <td className="truncate">{row.own_waletaddress}</td>
                    <td className="truncate">{NFT_ADDRESS_MAP[row.contract_address] || row.contract_address}</td>
                    <td className="text-right">{row.staked_count.toLocaleString()}</td>
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