import { useMemo, useState, type ReactNode } from 'react'
import {
  Plus,
  Sparkles,
  Library,
  Search,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { DIRECTION_META, STATUS_META, STATUS_ORDER } from '@/lib/constants'
import { RECOMMENDED_INTERNSHIPS } from '@/lib/recommendations'
import { streamAgentChat } from '@/lib/agent-client'
import { Direction, Internship, InternshipStatus } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const PARSE_PROMPT = `请把下面这段招聘信息解析为 JSON 对象，仅输出 JSON，不要解释。字段：
{
  "title": "岗位名称",
  "company": "公司/机构",
  "direction": "institution 或 brokerage 或 other",
  "description": "工作内容简介",
  "requirements": "任职要求",
  "howToApply": "投递方式/渠道",
  "tags": ["标签1","标签2"],
  "deadline": "截止日期（如有，否则空字符串）"
}
招聘信息：`

export default function InternshipTracker() {
  const { internships, updateInternship, deleteInternship } = useAppStore()
  const [search, setSearch] = useState('')
  const [dirFilter, setDirFilter] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [parseOpen, setParseOpen] = useState(false)
  const [recOpen, setRecOpen] = useState(false)
  const [detail, setDetail] = useState<Internship | null>(null)

  const filtered = useMemo(() => {
    return internships.filter((i) => {
      const matchSearch =
        !search ||
        i.title.includes(search) ||
        i.company.includes(search) ||
        i.tags.some((t) => t.includes(search))
      const matchDir = dirFilter === 'all' || i.direction === dirFilter
      return matchSearch && matchDir
    })
  }, [internships, search, dirFilter])

  const byStatus = (s: InternshipStatus) => filtered.filter((i) => i.status === s)

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索岗位 / 公司 / 标签"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={dirFilter} onValueChange={setDirFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部方向</SelectItem>
            <SelectItem value="institution">泛体制内</SelectItem>
            <SelectItem value="brokerage">券商</SelectItem>
            <SelectItem value="other">其他</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setRecOpen(true)}>
          <Library className="mr-2 h-4 w-4" />
          推荐库
        </Button>
        <Button variant="outline" onClick={() => setParseOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          JD 解析
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          添加实习
        </Button>
      </div>

      {/* 流水线看板 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATUS_ORDER.map((s) => {
          const items = byStatus(s)
          return (
            <div key={s} className="flex flex-col rounded-xl bg-muted/40 p-2">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-semibold">{STATUS_META[s].label}</span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setDetail(i)}
                    className="w-full rounded-lg border bg-card p-2.5 text-left shadow-sm transition hover:shadow-md"
                  >
                    <div className="text-xs font-medium leading-snug">{i.title}</div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {i.company}
                    </div>
                    <span
                      className={cn(
                        'mt-1.5 inline-block rounded-full border px-1.5 py-0.5 text-[10px]',
                        DIRECTION_META[i.direction].className
                      )}
                    >
                      {DIRECTION_META[i.direction].label}
                    </span>
                  </button>
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed py-4 text-center text-[11px] text-muted-foreground">
                    空
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          还没有匹配的实习记录。试试「推荐库」一键添加，或「JD 解析」粘贴招聘信息。
        </p>
      )}

      {/* 添加 / 编辑 弹窗 */}
      <AddDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* JD 解析弹窗 */}
      <ParseDialog open={parseOpen} onOpenChange={setParseOpen} />

      {/* 推荐库弹窗 */}
      <RecommendDialog open={recOpen} onOpenChange={setRecOpen} />

      {/* 详情弹窗 */}
      {detail && (
        <DetailDialog
          internship={detail}
          onClose={() => setDetail(null)}
          onUpdate={(patch) => {
            updateInternship(detail.id, patch)
            setDetail({ ...detail, ...patch })
          }}
          onDelete={() => {
            deleteInternship(detail.id)
            setDetail(null)
          }}
        />
      )}
    </div>
  )
}

// ===== 表单字段 =====
const emptyForm = {
  title: '',
  company: '',
  direction: 'brokerage' as Direction,
  description: '',
  requirements: '',
  howToApply: '',
  deadline: '',
  status: 'wishlist' as InternshipStatus,
  tags: '',
}

function AddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addInternship = useAppStore((s) => s.addInternship)
  const [form, setForm] = useState(emptyForm)

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.title || !form.company) {
      toast.error('请填写岗位名称与公司')
      return
    }
    addInternship({
      title: form.title,
      company: form.company,
      direction: form.direction,
      description: form.description,
      requirements: form.requirements,
      howToApply: form.howToApply,
      deadline: form.deadline || undefined,
      status: form.status,
      source: 'manual',
      tags: form.tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      notes: '',
    })
    toast.success('已添加')
    setForm(emptyForm)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>添加实习机会</DialogTitle>
          <DialogDescription>手动记录一个实习 / 项目机会</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="岗位名称 *">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="公司 / 机构 *">
            <Input value={form.company} onChange={(e) => set('company', e.target.value)} />
          </Field>
          <Field label="方向">
            <Select value={form.direction} onValueChange={(v) => set('direction', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="institution">泛体制内</SelectItem>
                <SelectItem value="brokerage">券商</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="当前状态">
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="截止日期" className="col-span-2">
            <Input
              placeholder="如 2025-06-30（可选）"
              value={form.deadline}
              onChange={(e) => set('deadline', e.target.value)}
            />
          </Field>
          <Field label="工作内容简介" className="col-span-2">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <Field label="任职要求" className="col-span-2">
            <Textarea
              rows={2}
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
            />
          </Field>
          <Field label="投递方式 / 渠道" className="col-span-2">
            <Textarea
              rows={2}
              value={form.howToApply}
              onChange={(e) => set('howToApply', e.target.value)}
            />
          </Field>
          <Field label="标签（逗号分隔）" className="col-span-2">
            <Input
              placeholder="如 债承, 头部券商"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={submit}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ParseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addInternship = useAppStore((s) => s.addInternship)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<any>(null)

  const run = async () => {
    if (!text.trim()) {
      toast.error('请先粘贴招聘信息')
      return
    }
    setLoading(true)
    setParsed(null)
    try {
      const chunks: string[] = []
      await streamAgentChat({
        sessionId: 'parse-' + Date.now(),
        message: PARSE_PROMPT + '\n' + text,
        agentType: 'coach',
        onEvent: (e) => {
          if (e.type === 'text') chunks.push(e.content)
          if (e.type === 'error') throw new Error(e.message)
        },
      })
      const full = chunks.join('')
      const m = full.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('AI 未返回可解析的结构，请手动添加')
      const obj = JSON.parse(m[0])
      const dir: Direction =
        obj.direction === 'institution' || obj.direction === 'brokerage' ? obj.direction : 'other'
      setParsed({
        title: obj.title || '',
        company: obj.company || '',
        direction: dir,
        description: obj.description || '',
        requirements: obj.requirements || '',
        howToApply: obj.howToApply || '',
        tags: Array.isArray(obj.tags) ? obj.tags : [],
        deadline: obj.deadline || '',
      })
      toast.success('解析完成，请确认后保存')
    } catch (err: any) {
      toast.error(err?.message || '解析失败')
    } finally {
      setLoading(false)
    }
  }

  const save = () => {
    if (!parsed?.title || !parsed?.company) {
      toast.error('岗位或公司缺失')
      return
    }
    addInternship({
      ...parsed,
      status: 'wishlist',
      source: 'parse',
      notes: '',
    })
    toast.success('已保存到「想投」')
    setText('')
    setParsed(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>从招聘 JD 智能解析</DialogTitle>
          <DialogDescription>
            粘贴招聘信息，AI 会自动提取岗位、要求、投递方式等结构化字段
          </DialogDescription>
        </DialogHeader>
        {!parsed ? (
          <>
            <Textarea
              rows={8}
              placeholder="在此粘贴招聘信息原文…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={run} disabled={loading}>
                {loading ? '解析中…' : 'AI 解析'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
            <Line label="岗位" value={parsed.title} />
            <Line label="公司" value={parsed.company} />
            <Line label="方向" value={DIRECTION_META[parsed.direction as Direction].label} />
            <Line label="简介" value={parsed.description} />
            <Line label="要求" value={parsed.requirements} />
            <Line label="投递" value={parsed.howToApply} />
            <Line label="标签" value={(parsed.tags || []).join('、')} />
          </div>
        )}
        {parsed && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setParsed(null)}>
              重新解析
            </Button>
            <Button onClick={save}>保存为实习</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function RecommendDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const addInternship = useAppStore((s) => s.addInternship)
  const [added, setAdded] = useState<Set<number>>(new Set())

  const add = (idx: number, item: any) => {
    addInternship({
      title: item.title,
      company: item.company,
      direction: item.direction,
      description: item.description,
      requirements: item.requirements,
      howToApply: item.howToApply,
      tags: item.tags,
      status: 'wishlist',
      source: 'recommend',
      notes: '',
    })
    setAdded((prev) => new Set(prev).add(idx))
    toast.success('已添加到「想投」')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>实习推荐库（方向性参考）</DialogTitle>
          <DialogDescription>
            以下为结合你两个方向整理的示例机会，具体以官方招聘公告为准。点击即可加入你的投递列表。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {RECOMMENDED_INTERNSHIPS.map((item, idx) => (
            <Card key={idx}>
              <CardContent className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{item.title}</span>
                    <span
                      className={cn(
                        'rounded-full border px-1.5 py-0.5 text-[10px]',
                        DIRECTION_META[item.direction].className
                      )}
                    >
                      {DIRECTION_META[item.direction].label}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.company}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-xs">
                    <span className="text-muted-foreground">要求：</span>
                    {item.requirements}
                  </p>
                  <p className="text-xs">
                    <span className="text-muted-foreground">投递：</span>
                    {item.howToApply}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={added.has(idx) ? 'secondary' : 'default'}
                  disabled={added.has(idx)}
                  onClick={() => add(idx, item)}
                >
                  {added.has(idx) ? '已添加' : '添加'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailDialog({
  internship,
  onClose,
  onUpdate,
  onDelete,
}: {
  internship: Internship
  onClose: () => void
  onUpdate: (patch: Partial<Internship>) => void
  onDelete: () => void
}) {
  const nextStatus: Record<InternshipStatus, InternshipStatus | null> = {
    wishlist: 'applied',
    applied: 'written',
    written: 'interview',
    interview: 'offer',
    offer: null,
    rejected: null,
  }
  const next = nextStatus[internship.status]

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{internship.title}</DialogTitle>
          <DialogDescription>{internship.company}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={cn('border', DIRECTION_META[internship.direction].className)}>
              {DIRECTION_META[internship.direction].label}
            </Badge>
            <Badge className={cn('border', STATUS_META[internship.status].className)}>
              {STATUS_META[internship.status].label}
            </Badge>
            {internship.deadline && (
              <span className="text-xs text-muted-foreground">截止 {internship.deadline}</span>
            )}
          </div>
          {internship.description && (
            <p>
              <span className="font-medium">简介：</span>
              {internship.description}
            </p>
          )}
          {internship.requirements && (
            <p>
              <span className="font-medium">要求：</span>
              {internship.requirements}
            </p>
          )}
          {internship.howToApply && (
            <p>
              <span className="font-medium">投递方式：</span>
              {internship.howToApply}
            </p>
          )}
          {internship.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {internship.tags.map((t, i) => (
                <Badge key={i} variant="outline">
                  {t}
                </Badge>
              ))}
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">更新状态</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {STATUS_ORDER.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={internship.status === s ? 'default' : 'outline'}
                  onClick={() => onUpdate({ status: s })}
                >
                  {STATUS_META[s].label}
                </Button>
              ))}
            </div>
          </div>

          {next && (
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => onUpdate({ status: next, appliedDate: internship.appliedDate || new Date().toISOString().slice(0, 10) })}
            >
              推进到「{STATUS_META[next].label}」
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">备注</Label>
            <Textarea
              rows={3}
              className="mt-1"
              value={internship.notes || ''}
              placeholder="记录面试准备、联系人、进展…"
              onChange={(e) => onUpdate({ notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="justify-between">
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-1 h-4 w-4" />
            删除
          </Button>
          <Button onClick={onClose}>完成</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}：</span>
      <span>{value || '—'}</span>
    </div>
  )
}
