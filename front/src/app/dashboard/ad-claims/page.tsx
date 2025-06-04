"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface AdClaim {
  id: string
  walletAddress: string
  rewardAmount: number
  claimStatus: 'PENDING' | 'COMPLETED' | 'FAILED'
  claimedAt: string
  transactionHash?: string
}

export default function AdClaimsPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [claims, setClaims] = useState<AdClaim[]>([])
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    // TODO: API 연동
    // fetchAdClaims(dateFilter).then(setClaims)
  }, [dateFilter])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">광고 보상 지급 현황</h1>
        <div className="flex gap-4">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40"
          />
          <Button variant="outline">새로고침</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">보상 지급 목록</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">지갑 주소</th>
                  <th className="text-right py-2">보상 (LFIT)</th>
                  <th className="text-center py-2">상태</th>
                  <th className="text-center py-2">시간</th>
                  <th className="text-center py-2">트랜잭션</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-b">
                    <td className="py-2">{claim.walletAddress}</td>
                    <td className="text-right">{claim.rewardAmount}</td>
                    <td className="text-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        claim.claimStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        claim.claimStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {claim.claimStatus}
                      </span>
                    </td>
                    <td className="text-center">
                      {new Date(claim.claimedAt).toLocaleTimeString()}
                    </td>
                    <td className="text-center">
                      {claim.transactionHash ? (
                        <a
                          href={`https://etherscan.io/tx/${claim.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          보기
                        </a>
                      ) : '-'}
                    </td>
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