import { useEffect, useState } from 'react'
import { Sparkles, FileText, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { DIRECTION_META } from '@/lib/constants'
import { streamAgentChat } from '@/lib/agent-client'
import { Direction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Markdown } from '@/components/Markdown'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function ResumeCoach() {
  const { resumes, addResume, updateResume, deleteResume, profile } = useAppStore()
  const [activeId, setActiveId] = useState<string>(resumes[0]?.id || '')
  const [target, setTarget] = useState<string>('brokerage')
  const [loading, setLoading] = useState(false)

  const active = resumes.find((r) => r.id === activeId) || resumes[0]

  useEffect(() => {
    if (!activeId && resumes[0]) setActiveId(resumes[0].id)
  }, [resumes, activeId])

  const optimize = async () => {
    if (!active?.content.trim()) {
      toast.error('请先填写简历内容')
      return
    }
    setLoading(true)
    try {
      const dirLabel = DIRECTION_META[target as Direction].label
      const prompt = `请基于以下简历，针对"${dirLabel}"方向进行优化。
先给出【问题诊断】（空泛动词、缺少量化、与岗位不匹配等），再给出【改写示例】（用 STAR+量化重写 2-3 条关键经历），最后给出【方向化建议】（一句话定位 + 3 条核心卖点）。
用中文、Markdown 输出。

求职者背景：${profile.school} ${profile.major}；技能：${profile.skills.join('、')}

简历内容：
${active.content}`
      const chunks: string[] = []
      await streamAgentChat({
        sessionId: 'resume-' + Date.now(),
        message: prompt,
        agentType: 'resume',
        onEvent: (e) => {
          if (e.type === 'text') chunks.push(e.content)
          if (e.type === 'error') throw new Error(e.message)
        },
      })
      updateResume(active.id, { suggestions: chunks.join(''), target })
      toast.success('已生成优化建议')
    } catch (err: any) {
      toast.error(err?.message || '优化失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[260px_1fr]">
      {/* 版本列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">简历版本</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              addResume({
                name: `新版本 ${resumes.length + 1}`,
                content: active?.content || '',
                target: 'brokerage',
              })
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {resumes.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setActiveId(r.id)
                if (r.target) setTarget(r.target)
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-sm',
                r.id === activeId ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{r.name}</span>
              </span>
              {r.id === activeId && (
                <Trash2
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-rose-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (resumes.length <= 1) {
                      toast.error('至少保留一个版本')
                      return
                    }
                    deleteResume(r.id)
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 编辑器 */}
      {active && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">版本名称</Label>
                  <Input
                    className="mt-1"
                    value={active.name}
                    onChange={(e) => updateResume(active.id, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">目标方向</Label>
                  <Select
                    value={target}
                    onValueChange={(v) => {
                      setTarget(v)
                      updateResume(active.id, { target: v })
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="institution">泛体制内</SelectItem>
                      <SelectItem value="brokerage">券商</SelectItem>
                      <SelectItem value="other">通用 / 其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">简历内容（可编辑）</Label>
                <Textarea
                  className="mt-1 font-mono text-xs"
                  rows={16}
                  value={active.content}
                  onChange={(e) => updateResume(active.id, { content: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={optimize} disabled={loading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loading ? 'AI 优化中…' : 'AI 优化建议'}
                </Button>
                <Badge variant="outline" className="self-center">
                  针对：{DIRECTION_META[target as Direction].label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {active.suggestions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI 优化建议</CardTitle>
              </CardHeader>
              <CardContent>
                <Markdown content={active.suggestions} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
