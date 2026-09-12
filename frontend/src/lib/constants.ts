import { Direction, InternshipStatus } from './types'

export const STATUS_META: Record<
  InternshipStatus,
  { label: string; className: string; order: number }
> = {
  wishlist: { label: '想投', className: 'bg-slate-100 text-slate-700 border-slate-200', order: 0 },
  applied: { label: '已投递', className: 'bg-blue-100 text-blue-700 border-blue-200', order: 1 },
  written: { label: '笔试', className: 'bg-violet-100 text-violet-700 border-violet-200', order: 2 },
  interview: { label: '面试', className: 'bg-amber-100 text-amber-700 border-amber-200', order: 3 },
  offer: { label: 'Offer', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', order: 4 },
  rejected: { label: '拒信', className: 'bg-rose-100 text-rose-700 border-rose-200', order: 5 },
}

export const STATUS_ORDER: InternshipStatus[] = [
  'wishlist',
  'applied',
  'written',
  'interview',
  'offer',
  'rejected',
]

export const DIRECTION_META: Record<Direction, { label: string; className: string }> = {
  institution: { label: '泛体制内', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  brokerage: { label: '券商', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  other: { label: '其他', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export const LEVEL_META: Record<string, { label: string; className: string }> = {
  gap: { label: '能力缺口', className: 'bg-rose-100 text-rose-700 border-rose-200' },
  learning: { label: '学习中', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  mastered: { label: '已掌握', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export const AGENT_OPTIONS = [
  { type: 'coach', label: '求职总教练', desc: '综合规划与答疑' },
  { type: 'recommend', label: '实习推荐官', desc: '挖掘匹配机会' },
  { type: 'capability', label: '能力规划师', desc: '能力差距与学习路径' },
  { type: 'resume', label: '简历优化师', desc: '简历诊断与改写' },
]
