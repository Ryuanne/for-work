import { useState, useEffect, type ReactNode } from 'react'
import { Sparkles, Download, Upload, RotateCcw, Save } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { DIRECTION_META } from '@/lib/constants'
import { saveAgentKey, checkAgentLogin } from '@/lib/agent-client'
import { Direction } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function Settings() {
  const { profile, setProfile, resetAll } = useAppStore()
  const [aiKey, setAiKey] = useState('')
  const [aiOk, setAiOk] = useState<boolean | null>(null)
  const [savingKey, setSavingKey] = useState(false)

  useEffect(() => {
    checkAgentLogin().then((d) => setAiOk(d.isLoggedIn))
  }, [])

  const toggleDir = (d: Direction) => {
    const has = profile.directions.includes(d)
    setProfile({
      directions: has ? profile.directions.filter((x) => x !== d) : [...profile.directions, d],
    })
  }

  const saveKey = async () => {
    if (!aiKey.trim()) {
      toast.error('请输入 API Key')
      return
    }
    setSavingKey(true)
    try {
      const r = await saveAgentKey(aiKey.trim())
      if (r.success) {
        toast.success('已保存（当前进程有效）')
        setAiKey('')
        setAiOk(true)
      } else {
        toast.error(r.message || '保存失败')
      }
    } catch {
      toast.error('保存失败')
    } finally {
      setSavingKey(false)
    }
  }

  const exportData = () => {
    const s = useAppStore.getState()
    const data = {
      profile: s.profile,
      internships: s.internships,
      capabilities: s.capabilities,
      resumes: s.resumes,
      sessions: s.sessions,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '实习领航数据备份.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('已导出备份')
  }

  const importData = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        localStorage.setItem('intern-pilot-store', JSON.stringify({ state: data, version: 0 }))
        toast.success('已导入，即将刷新页面')
        setTimeout(() => location.reload(), 800)
      } catch {
        toast.error('文件解析失败')
      }
    }
    reader.readAsText(file)
  }

  const doReset = () => {
    if (!confirm('确定要清空所有本地数据（实习、能力、简历、对话）吗？此操作不可恢复。')) return
    resetAll()
    toast.success('已重置')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* 个人档案 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">个人档案</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Field label="姓名">
            <Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
          </Field>
          <Field label="学校">
            <Input value={profile.school} onChange={(e) => setProfile({ school: e.target.value })} />
          </Field>
          <Field label="专业">
            <Input value={profile.major} onChange={(e) => setProfile({ major: e.target.value })} />
          </Field>
          <Field label="学历">
            <Input value={profile.degree} onChange={(e) => setProfile({ degree: e.target.value })} />
          </Field>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">求职方向（可多选）</Label>
            <div className="mt-1 flex gap-2">
              {(['institution', 'brokerage'] as Direction[]).map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDir(d)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium',
                    profile.directions.includes(d)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted/50'
                  )}
                >
                  {DIRECTION_META[d].label}
                </button>
              ))}
            </div>
          </div>
          <Field label="感兴趣行业（逗号分隔）" className="col-span-2">
            <Input
              value={profile.interests.join('、')}
              onChange={(e) =>
                setProfile({
                  interests: e.target.value
                    .split(/[，,、]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label="技能（逗号分隔）" className="col-span-2">
            <Input
              value={profile.skills.join('、')}
              onChange={(e) =>
                setProfile({
                  skills: e.target.value
                    .split(/[，,、]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>
          <Field label="备注" className="col-span-2">
            <Textarea
              rows={2}
              value={profile.note || ''}
              onChange={(e) => setProfile({ note: e.target.value })}
            />
          </Field>
        </CardContent>
      </Card>

      {/* AI 配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            CodeBuddy AI 配置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            本应用的 AI 求职助手由 CodeBuddy SDK 驱动。填入你的 API Key 后，能力匹配、学习推送、简历优化与对话即可启用。
            也可在后端 <code className="rounded bg-muted px-1">.env</code> 中配置 <code className="rounded bg-muted px-1">CODEBUDDY_API_KEY</code>。
            获取地址：codebuddy.cn
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="password"
              placeholder="粘贴 CodeBuddy API Key"
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
            />
            <Button onClick={saveKey} disabled={savingKey}>
              <Save className="mr-1 h-4 w-4" />
              {savingKey ? '保存中…' : '保存'}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>当前状态：</span>
            {aiOk === null ? (
              <span className="text-muted-foreground">检测中…</span>
            ) : aiOk ? (
              <span className="text-emerald-600">已就绪 ✓</span>
            ) : (
              <span className="text-amber-600">未配置</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 数据管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">数据管理</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            导出备份
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('importFile')?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            导入备份
          </Button>
          <input
            id="importFile"
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importData(f)
            }}
          />
          <Button variant="destructive" onClick={doReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            清空重置
          </Button>
        </CardContent>
      </Card>
    </div>
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
