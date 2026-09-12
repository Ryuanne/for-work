// CodeBuddy Agent SSE 流式客户端

export interface AgentChatOptions {
  sessionId: string
  message: string
  agentType?: string
  model?: string
  onEvent: (event: any) => void
  signal?: AbortSignal
}

export async function streamAgentChat({
  sessionId,
  message,
  agentType = 'coach',
  model,
  onEvent,
  signal,
}: AgentChatOptions): Promise<void> {
  const res = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, agentType, model }),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error('AI 服务请求失败，请确认已配置 CodeBuddy API Key')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''

    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trim()
      if (!json) continue
      try {
        onEvent(JSON.parse(json))
      } catch {
        // 忽略非法分片
      }
    }
  }
}

export async function checkAgentLogin(): Promise<{ isLoggedIn: boolean; apiKeyMasked?: string }> {
  try {
    const res = await fetch('/api/agent/check-login')
    return await res.json()
  } catch {
    return { isLoggedIn: false }
  }
}

export async function saveAgentKey(apiKey: string): Promise<{ success: boolean; message?: string }> {
  const res = await fetch('/api/agent/save-env-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  })
  return await res.json()
}
