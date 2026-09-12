import { ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  FileText,
  MessageSquare,
  Settings,
  Sparkles,
  GraduationCap as GradIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { checkAgentLogin } from '@/lib/agent-client'

const nav = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard, end: true },
  { to: '/internships', label: '实习投递', icon: Briefcase, end: false },
  { to: '/capability', label: '能力培养', icon: GraduationCap, end: false },
  { to: '/resume', label: '简历优化', icon: FileText, end: false },
  { to: '/assistant', label: 'AI 助手', icon: MessageSquare, end: false },
  { to: '/settings', label: '设置', icon: Settings, end: false },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [aiOk, setAiOk] = useState<boolean | null>(null)

  useEffect(() => {
    checkAgentLogin().then((d) => setAiOk(d.isLoggedIn))
  }, [])

  const current = nav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))
  const title = current?.label || '求职中台'

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 侧边栏（中等屏以上） */}
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GradIcon className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">实习领航</div>
            <div className="text-[11px] text-muted-foreground">一站式求职中台</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )
              }
            >
              <n.icon className="h-4.5 w-4.5" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
              aiOk === null
                ? 'border-border bg-muted text-muted-foreground'
                : aiOk
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {aiOk === null ? 'AI 状态检测中…' : aiOk ? 'AI 助手已就绪' : 'AI Key 未配置'}
          </div>
        </div>
      </aside>

      {/* 主区域 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 顶栏 */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GradIcon className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">实习领航</span>
          </div>
          <h1 className="text-base font-semibold md:text-lg">{title}</h1>
          <NavLink
            to="/assistant"
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 助手
          </NavLink>
        </header>

        {/* 移动端底部导航 */}
        <nav className="sticky bottom-0 z-20 flex border-t bg-background/95 backdrop-blur md:hidden">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              <n.icon className="h-5 w-5" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
