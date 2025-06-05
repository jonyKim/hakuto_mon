"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { stakeStatsApi } from '@/lib/api/withdraw-stats'

export default function WithdrawStatsPage() {
  const [summary, setSummary] = useState({
    total_withdrawn: 0,
    by_date: [] as { date: string; total_withdrawn: number }[],
    by_month: [] as { month: string; total_withdrawn: number }[],
    by_user: [] as { waletaddress: string; total_withdrawn: number }[],
    by_user_date: [] as { waletaddress: string; date: string; total_withdrawn: number }[]
  });
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await stakeStatsApi.getSummary();
        setSummary(data);
      } catch (error) {
        console.error('Error fetching withdraw summary:', error);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdraw Statistics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Withdrawn */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Total Withdrawn</h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.floor(summary.total_withdrawn).toLocaleString()} HKTM</div>
          </CardContent>
        </Card>

        {/* Top Withdraw Users */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top Withdraw Users</h3>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Address</th>
                    <th className="text-right">Withdrawn</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_user.slice(0, 5).map(row => (
                    <tr key={row.waletaddress}>
                      <td className="truncate">{row.waletaddress}</td>
                      <td className="text-right">{Math.floor(row.total_withdrawn).toLocaleString()} HKTM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <button
                className="px-3 py-1 text-xs rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold"
                onClick={() => setShowUserModal(true)}
              >
                More
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Withdraw Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily Withdraw Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y">
              {[...summary.by_date].slice(0, 14).map(row => {
                const localDate = new Date(row.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                return (
                  <li key={row.date} className="flex justify-between py-2">
                    <span className="font-mono">{localDate}</span>
                    <span className="font-bold text-indigo-600">{Math.floor(row.total_withdrawn).toLocaleString()} HKTM</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Withdraw Stats */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Monthly Withdraw Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <ul className="divide-y">
              {summary.by_month.map(row => (
                <li key={row.month} className="flex justify-between py-2">
                  <span className="font-mono">{row.month}</span>
                  <span className="font-bold text-indigo-600">{Math.floor(row.total_withdrawn).toLocaleString()} HKTM</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* User Withdraw Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h2 className="text-lg font-bold">Top 100 Withdraw Users</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowUserModal(false)}
              >×</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Rank</th>
                    <th className="text-left">Address</th>
                    <th className="text-right">Withdrawn</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_user.slice(0, 100).map((row, idx) => (
                    <tr key={row.waletaddress}>
                      <td>{idx + 1}</td>
                      <td className="truncate">{row.waletaddress}</td>
                      <td className="text-right">{Math.floor(row.total_withdrawn).toLocaleString()} HKTM</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end px-6 py-3 border-t">
              <button
                className="px-4 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold"
                onClick={() => setShowUserModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User-Date Withdraw Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">User-Date Withdraw Details</h3>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Address</th>
                  <th className="text-left">Date</th>
                  <th className="text-right">Withdrawn</th>
                </tr>
              </thead>
              <tbody>
                {summary.by_user_date.slice(0, 100).map(row => {
                  const localDate = new Date(row.date).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
                  return (
                    <tr key={row.waletaddress + row.date}>
                      <td className="truncate">{row.waletaddress}</td>
                      <td>{localDate}</td>
                      <td className="text-right">{Math.floor(row.total_withdrawn).toLocaleString()} HKTM</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
