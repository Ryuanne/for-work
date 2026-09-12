import { Link } from 'react-router-dom'
import {
  Briefcase,
  GraduationCap,
  FileText,
  MessageSquare,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { STATUS_META, STATUS_ORDER, DIRECTION_META } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { profile, internships, capabilities } = useAppStore()

  const total = internships.length
  const active = internships.filter((i) =>
    ['applied', 'written', 'interview'].includes(i.status)
  ).length
  const offers = internships.filter((i) => i.status === 'offer').length
  const resources = capabilities.flatMap((c) => c.resources)
  const doneResources = resources.filter((r) => r.done).length
  const resourcePct = resources.length ? Math.round((doneResources / resources.length) * 100) : 0

  const statusCounts = STATUS_ORDER.map((s) => ({
    status: s,
    count: internships.filter((i) => i.status === s).length,
  }))
  const maxCount = Math.max(1, ...statusCounts.map((c) => c.count))

  const recent = [...internships]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 欢迎 */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">欢迎回来</p>
            <h2 className="text-2xl font-bold">{profile.name || '同学'}，求职进行时</h2>
            <p className="mt-1 text-sm opacity-90">
              {profile.school} · {profile.major} ·{' '}
              {profile.directions.map((d) => DIRECTION_META[d].label).join(' / ')}
            </p>
          </div>
          <Sparkles className="h-10 w-10 opacity-80" />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Briefcase} label="实习机会" value={total} hint="已记录" />
        <StatCard icon={TrendingUp} label="进行中" value={active} hint="投递/笔试/面试" />
        <StatCard icon={CheckCircle2} label="Offer" value={offers} hint="已拿 offer" />
        <StatCard icon={GraduationCap} label="学习完成度" value={`${resourcePct}%`} hint={`${doneResources}/${resources.length} 资料`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 投递进度分布 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">投递进度分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs text-muted-foreground">
                  {STATUS_META[status].label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', 'bg-primary')}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs font-medium">{count}</span>
              </div>
            ))}
            {total === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                还没有记录，去「实习投递」添加第一个机会吧。
              </p>
            )}
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">快捷入口</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink to="/internships" icon={Briefcase} label="记录 / 追踪实习投递" />
            <QuickLink to="/capability" icon={GraduationCap} label="能力匹配与学习" />
            <QuickLink to="/resume" icon={FileText} label="AI 简历优化" />
            <QuickLink to="/assistant" icon={MessageSquare} label="向 AI 助手提问" />
          </CardContent>
        </Card>
      </div>

      {/* 最近记录 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">最近记录的实习</CardTitle>
          <Link to="/internships" className="text-xs text-primary hover:underline">
            查看全部
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">暂无记录</p>
          ) : (
            <div className="divide-y">
              {recent.map((i) => (
                <Link
                  key={i.id}
                  to="/internships"
                  className="flex items-center justify-between py-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{i.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{i.company}</div>
                  </div>
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs',
                      STATUS_META[i.status].className
                    )}
                  >
                    {STATUS_META[i.status].label}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any
  label: string
  value: number | string
  hint: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold leading-none">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{label}</div>
          <div className="text-[10px] text-muted-foreground/70">{hint}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Button asChild variant="outline" className="w-full justify-start">
      <Link to={to}>
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}
