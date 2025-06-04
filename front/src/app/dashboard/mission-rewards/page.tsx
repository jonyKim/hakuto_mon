"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MissionReward } from '@/types/rewards'
import { missionRewardsApi } from '@/lib/api/mission-rewards'
import { toast } from 'sonner'
import { AddRewardDialog } from './add-reward-dialog'
import { isEqual } from 'lodash'

export default function MissionRewardsPage() {
  const [rewards, setRewards] = useState<MissionReward[]>([])
  const [originalRewards, setOriginalRewards] = useState<MissionReward[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      const response = await missionRewardsApi.getAllMissionRewards()
      // 걸음 수 기준으로 정렬
      const sortedRewards = response.data.sort((a, b) => a.steps - b.steps)
      setRewards(sortedRewards)
      setOriginalRewards(sortedRewards)
    } catch (error) {
      console.error('미션 보상 조회 실패:', error)
      toast.error('미션 보상 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRewardChange = (id: string, field: keyof MissionReward, value: number | boolean) => {
    const newRewards = rewards.map(reward => 
      reward.id === id ? { ...reward, [field]: value } : reward
    )
    setRewards(newRewards)
  }

  const handleSave = async () => {
    try {
      // 변경된 보상만 업데이트
      const changedRewards = rewards.filter(reward => {
        const original = originalRewards.find(r => r.id === reward.id)
        return !isEqual(reward, original)
      })

      if (changedRewards.length === 0) return

      await Promise.all(
        changedRewards.map(reward => 
          missionRewardsApi.updateMissionReward(reward.id, {
            steps: reward.steps,
            reward: reward.reward,
            is_active: reward.is_active
          })
        )
      )
      
      // 성공 알림에 변경된 항목 수와 상세 정보 포함
      toast.success(
        <div className="space-y-2">
          <p>{changedRewards.length}개의 미션 보상이 업데이트되었습니다.</p>
          <ul className="text-sm">
            {changedRewards.map(reward => (
              <li key={reward.id}>
                • {reward.steps.toLocaleString()}걸음: {reward.reward} LFIT 
                ({reward.is_active ? '활성화' : '비활성화'})
              </li>
            ))}
          </ul>
        </div>,
        {
          duration: 5000, // 5초 동안 표시
        }
      )

      // 저장 후 최신 데이터로 갱신
      fetchRewards()
    } catch (error) {
      console.error('보상 설정 저장 실패:', error)
      toast.error('보상 설정 저장에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const hasChanges = !isEqual(rewards, originalRewards)

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">미션 보상 설정</h1>
        <div className="flex gap-3">
          <AddRewardDialog onRewardAdded={fetchRewards} />
          <Button onClick={handleSave} disabled={!hasChanges}>
            저장
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">No.</TableHead>
              <TableHead className="w-[200px]">걸음 수</TableHead>
              <TableHead className="w-[200px]">보상 (LFIT)</TableHead>
              <TableHead className="w-[200px]">상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((reward, index) => (
              <TableRow key={reward.id}>
                <TableCell className="text-center font-medium">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={reward.steps}
                      onChange={(e) => handleRewardChange(reward.id, 'steps', parseInt(e.target.value))}
                      min="1"
                      step="1000"
                      className="w-40"
                    />
                    <span className="text-gray-500">걸음</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={reward.reward}
                    onChange={(e) => handleRewardChange(reward.id, 'reward', parseFloat(e.target.value))}
                    step="0.001"
                    min="0"
                    className="w-40"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reward.is_active}
                      onCheckedChange={(checked) => handleRewardChange(reward.id, 'is_active', checked)}
                    />
                    <span className="min-w-[60px]">{reward.is_active ? '활성화' : '비활성화'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 