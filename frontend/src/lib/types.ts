// 领域数据模型

export type Direction = 'institution' | 'brokerage' | 'other'

export type InternshipStatus =
  | 'wishlist' // 想投
  | 'applied' // 已投递
  | 'written' // 笔试
  | 'interview' // 面试
  | 'offer' // offer
  | 'rejected' // 拒信

export interface Internship {
  id: string
  title: string
  company: string
  direction: Direction
  description: string
  requirements: string
  howToApply: string
  source: 'manual' | 'recommend' | 'parse'
  status: InternshipStatus
  deadline?: string
  appliedDate?: string
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type ResourceType = 'course' | 'book' | 'article' | 'tool' | 'report'

export interface LearningResource {
  id: string
  title: string
  type: ResourceType
  url?: string
  description: string
  done: boolean
}

export type CapabilityLevel = 'gap' | 'learning' | 'mastered'

export interface Capability {
  id: string
  name: string
  relatedInternshipIds: string[]
  level: CapabilityLevel
  reason: string
  resources: LearningResource[]
  createdAt: string
  updatedAt: string
}

export interface ResumeVersion {
  id: string
  name: string
  content: string
  target?: string
  suggestions?: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface ChatSession {
  id: string
  title: string
  agentType: string
  messages: ChatMessage[]
  createdAt: number
}

export interface Profile {
  name: string
  school: string
  major: string
  degree: string
  directions: Direction[]
  interests: string[]
  skills: string[]
  note?: string
}
