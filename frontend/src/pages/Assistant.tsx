import { useEffect, useRef, useState } from 'react'
import { Send, Plus, Sparkles, MessageSquare, Trash2, Bot, User } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { AGENT_OPTIONS } from '@/lib/constants'
import { streamAgentChat, checkAgentLogin } from '@/lib/agent-client'
import { ChatMessage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/Markdown'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function Assistant() {
  const { sessions, addSession, updateSession, deleteSession } = useAppStore()
  const [activeId, setActiveId] = useState<string>('')
  const [msgs, setMsgs] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [agentType, setAgentType] = useState('coach')
  const [aiOk, setAiOk] = useState<boolean | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    checkAgentLogin().then((d) => setAiOk(d.isLoggedIn))
  }, [])

  // 初始化会话
  useEffect(() => {
    if (sessions.length === 0) {
      const id = addSession({ title: '新对话', agentType, messages: [] })
      setActiveId(id)
    } else if (!activeId || !sessions.find((s) => s.id === activeId)) {
      setActiveId(sessions[0].id)
    }
  }, [sessions]) // eslint-disable-line

  useEffect(() => {
    const s = sessions.find((x) => x.id === activeId)
    if (s) {
      setMsgs(s.messages)
      setAgentType(s.agentType)
    }
  }, [activeId, sessions])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, streaming])

  const ensureSession = (): string => {
    if (activeId && sessions.find((s) => s.id === activeId)) return activeId
    const id = addSession({ title: '新对话', agentType, messages: [] })
    setActiveId(id)
    return id
  }

  const send = async () => {
    if (!input.trim() || streaming) return
    if (aiOk === false) {
      toast.error('请先在「设置」中配置 CodeBuddy API Key')
      return
    }
    const sid = ensureSession()
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'user',
      content: input.trim(),
      ts: Date.now(),
    }
    const asstMsg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      role: 'assistant',
      content: '',
      ts: Date.now(),
    }
    const next = [...msgs, userMsg, asstMsg]
    setMsgs(next)
    setInput('')
    setStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      await streamAgentChat({
        sessionId: sid,
        message: userMsg.content,
        agentType,
        signal: controller.signal,
        onEvent: (e) => {
          if (e.type === 'text') {
            asstMsg.content += e.content
            setMsgs((prev) => {
              const copy = [...prev]
              const idx = copy.findIndex((m) => m.id === asstMsg.id)
              if (idx >= 0) copy[idx] = { ...asstMsg }
              return copy
            })
          } else if (e.type === 'error') {
            asstMsg.content += '\n\n⚠️ ' + (e.message || '出错了')
            setMsgs((prev) => {
              const copy = [...prev]
              const idx = copy.findIndex((m) => m.id === asstMsg.id)
              if (idx >= 0) copy[idx] = { ...asstMsg }
              return copy
            })
          }
        },
      })
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        asstMsg.content += '\n\n⚠️ ' + (err?.message || '请求失败')
        setMsgs((prev) => {
          const copy = [...prev]
          const idx = copy.findIndex((m) => m.id === asstMsg.id)
          if (idx >= 0) copy[idx] = { ...asstMsg }
          return copy
        })
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      setMsgs((prev) => {
        updateSession(sid, {
          messages: prev,
          title: prev[0]?.role === 'user' ? prev[0].content.slice(0, 20) : '新对话',
        })
        return prev
      })
    }
  }

  const newChat = () => {
    const id = addSession({ title: '新对话', agentType, messages: [] })
    setActiveId(id)
    setMsgs([])
  }

  const activeSession = sessions.find((s) => s.id === activeId)

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-6xl overflow-hidden rounded-2xl border">
      {/* 会话列表 */}
      <div className="hidden w-56 shrink-0 flex-col border-r md:flex">
        <div className="p-3">
          <Button className="w-full" size="sm" onClick={newChat}>
            <Plus className="mr-1 h-4 w-4" />
            新对话
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs',
                s.id === activeId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              )}
            >
              <span className="flex items-center gap-1.5 truncate">
                <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{s.title}</span>
              </span>
              <Trash2
                className="h-3.5 w-3.5 shrink-0 opacity-0 hover:text-rose-600 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteSession(s.id)
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 对话区 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Agent 选择 */}
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          {AGENT_OPTIONS.map((a) => (
            <button
              key={a.type}
              onClick={() => {
                setAgentType(a.type)
                if (activeSession) updateSession(activeSession.id, { agentType: a.type })
              }}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition',
                agentType === a.type
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted/50'
              )}
              title={a.desc}
            >
              {a.label}
            </button>
          ))}
          {aiOk === false && (
            <Badge variant="outline" className="ml-auto border-amber-200 text-amber-700">
              <Sparkles className="mr-1 h-3 w-3" />
              AI Key 未配置
            </Badge>
          )}
        </div>

        {aiOk === false && (
          <div className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-700">
            尚未配置 CodeBuddy API Key，AI 回复将不可用。请前往「设置」填写后重试。
          </div>
        )}

        {/* 消息 */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles className="mb-2 h-8 w-8" />
              <p className="text-sm">向 AI 求职助手提问吧</p>
              <p className="mt-1 text-xs">
                例如：「帮我规划券商债承方向的暑期实习准备」「我的简历怎么针对投行修改」
              </p>
            </div>
          )}
          {msgs.map((m) => (
            <div
              key={m.id}
              className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {m.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-3.5 py-2',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                ) : m.content ? (
                  <Markdown content={m.content} />
                ) : (
                  <span className="text-xs text-muted-foreground">思考中…</span>
                )}
              </div>
              {m.role === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 输入 */}
        <div className="border-t p-3">
          <div className="flex gap-2">
            <Textarea
              className="min-h-[44px] flex-1 resize-none"
              placeholder="输入你的问题…（Enter 发送，Shift+Enter 换行）"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
            />
            <Button onClick={send} disabled={streaming || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
