'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { missionRewardsApi } from '@/lib/api/mission-rewards'
import { toast } from 'sonner'

interface AddRewardDialogProps {
  onRewardAdded: () => void
}

export function AddRewardDialog({ onRewardAdded }: AddRewardDialogProps) {
  const [open, setOpen] = useState(false)
  const [steps, setSteps] = useState('')
  const [reward, setReward] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!steps || !reward) {
      toast.error('모든 필드를 입력해주세요.')
      return
    }

    try {
      setIsSubmitting(true)
      await missionRewardsApi.createMissionReward({
        steps: parseInt(steps),
        reward: parseFloat(reward)
      })
      
      toast.success('미션 보상이 추가되었습니다.')
      setOpen(false)
      onRewardAdded()
      
      // 입력 필드 초기화
      setSteps('')
      setReward('')
    } catch (error) {
      console.error('미션 보상 추가 실패:', error)
      toast.error('미션 보상 추가에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>미션 보상 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 미션 보상 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="steps">걸음 수</label>
            <Input
              id="steps"
              type="number"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              min="1"
              placeholder="예: 5000"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="reward">보상 (LFIT)</label>
            <Input
              id="reward"
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              step="0.001"
              min="0"
              placeholder="예: 0.005"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '추가 중...' : '추가'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 