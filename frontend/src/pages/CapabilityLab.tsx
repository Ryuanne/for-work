import { useState } from 'react'
import { Sparkles, BookOpen, GraduationCap, CheckCircle2, Circle, Trash2, Plus } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { LEVEL_META } from '@/lib/constants'
import { streamAgentChat } from '@/lib/agent-client'
import { Capability, CapabilityLevel, LearningResource, ResourceType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const TYPE_LABEL: Record<ResourceType, string> = {
  course: '课程',
  book: '书籍',
  article: '文章',
  tool: '工具',
  report: '报告',
}

export default function CapabilityLab() {
  const { profile, internships, capabilities, addCapability } = useAppStore()
  const [focusId, setFocusId] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const runAnalysis = async () => {
    const focus = focusId === 'all' ? null : internships.find((i) => i.id === focusId)
    const ctx = focus
      ? `目标岗位：${focus.title} @ ${focus.company}（方向：${focus.direction}）\n岗位要求：${focus.requirements || focus.description || '见岗位描述'}`
      : `综合求职方向：${profile.directions.join('、')}；感兴趣行业：${profile.interests.join('、')}`
    const prompt = `你是能力差距分析师。基于以下背景，列出该方向/岗位需要的 5-8 个核心能力（含硬技能与软技能），并判断与现有背景的差距。
仅输出一个 JSON 数组，不要其他文字。每个元素字段：
{"name":"能力名称","level":"gap 或 learning 或 mastered","reason":"为什么需要 / 与现有背景的差距说明"}
其中 gap=明显缺口，learning=可提升，mastered=已具备。
求职者背景：
- 学校/专业：${profile.school} ${profile.major} ${profile.degree}
- 现有技能：${profile.skills.join('、')}
- 既有实习：${internships.map((i) => `${i.title}@${i.company}`).join('；') || '暂无'}
${ctx}`

    setLoading(true)
    try {
      const chunks: string[] = []
      await streamAgentChat({
        sessionId: 'cap-' + Date.now(),
        message: prompt,
        agentType: 'capability',
        onEvent: (e) => {
          if (e.type === 'text') chunks.push(e.content)
          if (e.type === 'error') throw new Error(e.message)
        },
      })
      const full = chunks.join('')
      const m = full.match(/\[[\s\S]*\]/)
      if (!m) throw new Error('AI 未返回可解析的能力清单')
      const arr = JSON.parse(m[0]) as Array<{
        name: string
        level: CapabilityLevel
        reason: string
      }>
      const validLevels: CapabilityLevel[] = ['gap', 'learning', 'mastered']
      let added = 0
      arr.forEach((c) => {
        if (!c?.name) return
        addCapability({
          name: c.name,
          level: validLevels.includes(c.level) ? c.level : 'learning',
          reason: c.reason || '',
          relatedInternshipIds: focus ? [focus.id] : [],
        })
        added++
      })
      if (added === 0) throw new Error('未解析到能力项')
      toast.success(`已生成 ${added} 项能力清单`)
    } catch (err: any) {
      toast.error(err?.message || '分析失败')
    } finally {
      setLoading(false)
    }
  }

  const mastered = capabilities.filter((c) => c.level === 'mastered').length
  const learning = capabilities.filter((c) => c.level === 'learning').length
  const gaps = capabilities.filter((c) => c.level === 'gap').length

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* 顶部操作 */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">分析基于（可选）</Label>
            <Select value={focusId} onValueChange={setFocusId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">综合求职方向（全部）</SelectItem>
                {internships.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.title} @ {i.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runAnalysis} disabled={loading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {loading ? '分析中…' : 'AI 能力匹配分析'}
          </Button>
        </CardContent>
      </Card>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-4">
        <MiniStat icon={GraduationCap} label="已掌握" value={mastered} className="text-emerald-600" />
        <MiniStat icon={BookOpen} label="学习中" value={learning} className="text-amber-600" />
        <MiniStat icon={Circle} label="能力缺口" value={gaps} className="text-rose-600" />
      </div>

      {/* 能力清单 */}
      {capabilities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            还没有能力清单。先在「实习投递」里添加目标岗位，再点上方「AI 能力匹配分析」，
            系统会结合你的背景给出能力差距与学习建议。
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {capabilities.map((cap) => (
            <CapabilityCard key={cap.id} cap={cap} />
          ))}
        </div>
      )}
    </div>
  )
}

function CapabilityCard({ cap }: { cap: Capability }) {
  const { updateCapability, deleteCapability, toggleResource, addResource } = useAppStore()
  const [loadingRes, setLoadingRes] = useState(false)

  const pushResources = async () => {
    setLoadingRes(true)
    try {
      const prompt = `针对能力"${cap.name}"，为一位目标为${useAppStore.getState().profile.directions.join('、')}的金融科技求职者，推荐 3-5 条可落地的学习资料或路径。
仅输出 JSON 数组，不要其他文字。每个元素字段：
{"title":"资料名","type":"course 或 book 或 article 或 tool 或 report","description":"为什么对该能力有用","url":"可选链接"}
优先推荐公开/权威来源（Coursera/edX、Wind/Choice 研报、证监会/交易所投教、高校公开课、经典教材）。`
      const chunks: string[] = []
      await streamAgentChat({
        sessionId: 'res-' + Date.now(),
        message: prompt,
        agentType: 'capability',
        onEvent: (e) => {
          if (e.type === 'text') chunks.push(e.content)
          if (e.type === 'error') throw new Error(e.message)
        },
      })
      const m = chunks.join('').match(/\[[\s\S]*\]/)
      if (!m) throw new Error('未解析到学习资料')
      const arr = JSON.parse(m[0]) as Array<{
        title: string
        type: ResourceType
        description: string
        url?: string
      }>
      let n = 0
      arr.forEach((r) => {
        if (!r?.title) return
        const t: ResourceType = (['course', 'book', 'article', 'tool', 'report'] as ResourceType[]).includes(
          r.type
        )
          ? r.type
          : 'article'
        addResource(cap.id, {
          title: r.title,
          type: t,
          description: r.description || '',
          url: r.url,
          done: false,
        })
        n++
      })
      if (n === 0) throw new Error('未解析到资料')
      toast.success(`已推送 ${n} 条学习资料`)
    } catch (err: any) {
      toast.error(err?.message || '推送失败')
    } finally {
      setLoadingRes(false)
    }
  }

  const doneCount = cap.resources.filter((r) => r.done).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm">{cap.name}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{cap.reason}</p>
        </div>
        <Trash2
          className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-rose-600"
          onClick={() => deleteCapability(cap.id)}
        />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">掌握程度</Label>
          <Select
            value={cap.level}
            onValueChange={(v) => updateCapability(cap.id, { level: v as CapabilityLevel })}
          >
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gap">能力缺口</SelectItem>
              <SelectItem value="learning">学习中</SelectItem>
              <SelectItem value="mastered">已掌握</SelectItem>
            </SelectContent>
          </Select>
          <Badge className={cn('border', LEVEL_META[cap.level].className)}>
            {LEVEL_META[cap.level].label}
          </Badge>
        </div>

        {/* 学习资料 */}
        <div className="rounded-lg bg-muted/40 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium">
              学习资料 {cap.resources.length > 0 && `(${doneCount}/${cap.resources.length})`}
            </span>
            <Button size="sm" variant="ghost" onClick={pushResources} disabled={loadingRes}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {loadingRes ? '推送中…' : 'AI 推送'}
            </Button>
          </div>
          {cap.resources.length === 0 ? (
            <p className="py-2 text-center text-[11px] text-muted-foreground">
              还没有资料，点「AI 推送」获取学习路径
            </p>
          ) : (
            <div className="space-y-1.5">
              {cap.resources.map((r) => (
                <ResourceRow
                  key={r.id}
                  r={r}
                  onToggle={() => toggleResource(cap.id, r.id)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ResourceRow({ r, onToggle }: { r: LearningResource; onToggle: () => void }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-card p-2">
      <button onClick={onToggle} className="mt-0.5">
        {r.done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-xs font-medium', r.done && 'line-through text-muted-foreground')}>
            {r.title}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {TYPE_LABEL[r.type]}
          </Badge>
        </div>
        {r.description && (
          <p className="text-[11px] text-muted-foreground">{r.description}</p>
        )}
        {r.url && (
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-primary underline"
          >
            打开链接
          </a>
        )}
      </div>
    </div>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any
  label: string
  value: number
  className?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className={cn('h-6 w-6', className)} />
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  )
}
