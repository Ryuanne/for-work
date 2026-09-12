import { Request, Response, Router } from 'express'
import { query } from '@tencent-ai/agent-sdk'
import { v4 as uuidv4 } from 'uuid'

export const agentRouter: Router = Router()

// 客户端会话ID -> SDK 会话ID（用于多轮对话 resume）
const sessionMap = new Map<string, string>()
const defaultModel = 'claude-sonnet-4'

/**
 * 领域 Agent 系统提示词
 * 针对用户的求职场景（西南财经大学 金融科技 本硕，目标：泛体制内 / 券商）
 */
export const AGENTS: Record<string, { name: string; systemPrompt: string }> = {
  coach: {
    name: '求职总教练',
    systemPrompt: `你是一位资深的求职与职业规划教练，服务一位西南财经大学金融科技本硕（2025级硕士）的同学。

用户的两大职业方向：
1. 泛体制内：央国企投资部 / 财务部、银行（偏好总行/分行非柜台岗，如投行部、金融市场部、资管部、同业部）。
2. 券商：优先券商直投（门槛高），前期倾向头部券商的债券承销（债承）、卖方研究岗；卖方研究或投资部偏好垂直行业深度（如 AI、半导体、金融科技），需要有针对性的行业研究实习。

用户的既有实习：五矿证券债券承销部、华创证券研究所计算机组（卖方研究）、恒丰银行对公业务部、华发股份财务部。技能：Python、C++、SQL、NLP与金融、区块链、机器学习；英语六级。

你的职责：
- 用简洁、专业、鼓励的语气，结合用户的背景给出可执行的求职建议。
- 优先给结构化建议（分点、清单、时间线）。
- 涉及行业研究时，强调"选一个行业做深"（如 AI/半导体/金融科技），并给出研究框架。
- 不要编造具体的招聘链接或内部信息，可提示官方渠道（公司官网招聘页、国聘/国资小新、券商官网、校园宣讲会、猎聘/实习僧等）。
- 回答使用中文，适当使用 Markdown。`,
  },
  recommend: {
    name: '实习推荐官',
    systemPrompt: `你是一位实习机会挖掘助手，服务西南财经大学金融科技本硕、目标为"泛体制内（央国企投资/财务、银行非柜台）"与"券商（债承/卖方研究/直投）"的同学。

当收到"帮我找/推荐实习"类请求时，请：
1. 先明确用户当前阶段（本学期/寒暑假/远程）与偏好方向。
2. 给出 5-8 个高度匹配的实习/项目机会（标注：机构类型、岗位、匹配方向、核心价值、投递渠道提示、时间节点）。
3. 对券商方向，强调"头部券商 + 垂直行业研究"的组合；对泛体制内，提示国央企总部/一级分行、校园招聘与暑期实习窗口。
4. 提醒用户：具体岗位以官方招聘公告为准，本助手提供方向与渠道建议，不直接代投。
用中文、结构化（表格或分点）输出，避免编造不存在的具体岗位编号。`,
  },
  capability: {
    name: '能力匹配与学习规划师',
    systemPrompt: `你是一位能力差距分析与学习规划师，服务对象如上（金融科技本硕，目标泛体制内与券商）。

工作流程：
1. 根据用户"已投递/已规划的实习岗位"，识别该岗位需要的核心能力（硬技能 + 软技能）。
2. 对照用户现有背景（Python/C++/SQL、NLP与金融、区块链、机器学习、债券承销、卖方研究、对公信贷、财务核算），标记"已具备 / 待提升 / 缺口"。
3. 针对"待提升/缺口"能力，给出 3-5 条可落地的学习资料或路径（公开课程、经典教材、实战项目、行业报告来源），并说明为什么对该岗位有用。
4. 给出一份 4-8 周的阶段性学习节奏建议。

输出用中文、结构化（能力清单 + 学习路径表），不要编造付费资源，优先推荐公开/权威来源（如 Coursera/edX、Wind/Choice 研报、证监会/交易所投资者教育、高校公开课）。`,
  },
  resume: {
    name: '简历优化师',
    systemPrompt: `你是一位简历优化专家，服务对象是西南财经大学金融科技本硕、目标泛体制内（央国企投资/财务、银行非柜台）与券商（债承/卖方研究/直投）的同学。

优化原则：
1. 遵循"STAR + 量化"原则重写经历，突出与金融/科技岗位相关的硬成果（如处理单据数、搭建模型、产出报告份数、覆盖公司数）。
2. 针对不同方向给出差异化重点：
   - 券商债承/研究：突出财务分析、行业研究、Wind/Choice 数据、报告撰写、建模。
   - 银行非柜台/央国企：突出合规、流程、风控、跨部门协作、对公业务理解。
3. 指出简历中的问题（空泛动词、缺少量化、与岗位不匹配），并给出可直接替换的改写示例。
4. 提供针对该方向简历的"一句话定位"与"3 条核心卖点"。

输出用中文，给出"问题诊断 + 改写示例 + 方向化建议"三段式，可直接复制使用。`,
  },
}

// 健康检查
agentRouter.get('/agent/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', agent: 'codebuddy', timestamp: new Date().toISOString() })
})

// 登录状态（基于环境变量中的 API Key）
agentRouter.get('/agent/check-login', (_req: Request, res: Response) => {
  const apiKey = process.env.CODEBUDDY_API_KEY
  const authToken = process.env.CODEBUDDY_AUTH_TOKEN
  const masked = apiKey ? apiKey.slice(0, 6) + '****' + apiKey.slice(-4) : undefined
  res.json({
    isLoggedIn: !!(apiKey || authToken),
    method: apiKey ? 'env' : 'none',
    apiKeyMasked: masked,
  })
})

// 运行时保存 API Key（仅当前进程有效）
agentRouter.post('/agent/save-env-config', (req: Request, res: Response) => {
  const { apiKey } = req.body || {}
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ error: '请提供有效的 API Key' })
    return
  }
  process.env.CODEBUDDY_API_KEY = apiKey.trim()
  res.json({ success: true, message: '已保存 API Key（仅当前服务进程有效，重启后需重新填写）' })
})

// 可用模型（静态列表，避免额外会话开销）
agentRouter.get('/agent/models', (_req: Request, res: Response) => {
  res.json({
    models: [
      { modelId: 'claude-sonnet-4', name: 'Claude Sonnet 4（推荐，均衡）' },
      { modelId: 'claude-opus-4', name: 'Claude Opus 4（更强，慢）' },
    ],
    defaultModel,
  })
})

/**
 * 流式聊天（SSE）
 * body: { sessionId?, message, agentType?, model? }
 */
agentRouter.post('/agent/chat', async (req: Request, res: Response) => {
  const { sessionId, message, agentType = 'coach', model } = req.body || {}

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: '消息不能为空' })
    return
  }

  const agent = AGENTS[agentType] || AGENTS.coach
  const selectedModel = model || defaultModel
  const clientSession = sessionId || uuidv4()
  const existingSdk = sessionMap.get(clientSession)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders()

  res.write(`data: ${JSON.stringify({ type: 'init', sessionId: clientSession, agent: agent.name, model: selectedModel })}\n\n`)

  try {
    const stream = query({
      prompt: message,
      options: {
        cwd: process.cwd(),
        model: selectedModel,
        maxTurns: 8,
        systemPrompt: agent.systemPrompt,
        permissionMode: 'default',
        // 求职助手为纯对话，禁用工具执行，保证安全
        allowedTools: [],
        canUseTool: async () => ({ behavior: 'deny', message: '已禁用工具调用' }),
        ...(existingSdk ? { resume: existingSdk } : {}),
      },
    })

    let fullResponse = ''
    let newSdkSessionId: string | null = null

    for await (const msg of stream) {
      const m = msg as any
      if (m.type === 'system' && m.subtype === 'init') {
        newSdkSessionId = m.session_id
        if (newSdkSessionId && newSdkSessionId !== existingSdk) {
          sessionMap.set(clientSession, newSdkSessionId)
        }
      } else if (m.type === 'assistant') {
        const content = m.message?.content
        if (typeof content === 'string') {
          fullResponse += content
          res.write(`data: ${JSON.stringify({ type: 'text', content })}\n\n`)
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text') {
              fullResponse += block.text
              res.write(`data: ${JSON.stringify({ type: 'text', content: block.text })}\n\n`)
            }
          }
        }
      } else if (m.type === 'result') {
        res.write(`data: ${JSON.stringify({ type: 'done', duration: m.duration })}\n\n`)
      }
    }

    if (!newSdkSessionId && existingSdk) {
      // 保持已有映射
    }
    res.end()
  } catch (error: any) {
    console.error('[Agent Chat] Error:', error?.message || error)
    res.write(`data: ${JSON.stringify({ type: 'error', message: error?.message || '处理请求时发生错误' })}\n\n`)
    res.end()
  }
})
