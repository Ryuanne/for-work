import { Direction, Profile } from './types'

// 用户默认档案（基于简历）
export const DEFAULT_PROFILE: Profile = {
  name: '黄丹',
  school: '西南财经大学',
  major: '金融科技',
  degree: '硕士（2025 级）',
  directions: ['institution', 'brokerage'],
  interests: ['AI / 人工智能', '半导体', '金融科技'],
  skills: ['Python', 'C++', 'SQL', 'NLP 与金融', '区块链', '机器学习', 'Wind / Choice', '财务分析', '行业研究'],
  note: '目标：泛体制内（央国企投资 / 财务、银行非柜台岗）与券商（债承 / 卖方研究 / 直投）。',
}

// 默认简历（取自用户简历，作为简历优化起点）
export const DEFAULT_RESUME = `黄丹
电话：181xxxxxxx | 邮箱：xxxx@163.com

【教育背景】
西南财经大学（211） | 金融科技 硕士        2025.9 - 2028.6
课程：金融科技模式与监管、中级宏观/计量经济学、区块链泛金融基础设施、自然语言处理与金融应用
西南财经大学（211） | 金融学（智能金融与区块链金融） 学士  2021.9 - 2025.6
荣誉：国家励志奖学金、校级三好学生、优秀共青团员

【实习经历】
五矿证券 | 债券承销部实习生              2024.10 - 2025.01
- 参与城投债、公司债等 10+ 债券承销项目，协助撰写立项报告、搭建工作底稿
- 独立梳理发行人三大财务报表，测算资产负债率、流动性等核心指标
- 参与存续期债券风险排查，编制定期风险监测报告

华创证券 | 研究所计算机组实习生          2023.10 - 2024.01
- 跟踪计算机行业政策与市场动态，参与 10+ 场上市公司交流会
- 运用 Wind/Choice 收集深信服、用友网络等公司数据，参与完成 1 份行业深度报告
- 搭建计算机行业重点公司跟踪表，交叉验证估值与盈利指标

恒丰银行 | 对公业务部实习生              2023.01 - 2023.03
- 协助企业授信调查，分析三大报表与偿债能力
- 参与信贷业务资料收集、合规核验与流程跟进

华发股份西南分公司 | 财务部实习生       2025.03 - 2025.06
- 审核 100+ 份费用报销单据，整理归档 3000+ 份凭证
- 运用 Excel 处理 300+ 条合同台账与资金流水数据

【校园项目】
花旗杯金融创新应用大赛 | 区块链农产品期货平台（核心成员）
- 设计区块链期货交易平台，开发核心智能合约（交易撮合、资金结算）
- 引入公私钥加密与链上身份验证机制

【个人技能】
语言：CET-6，良好英文阅读与书面表达
办公：Word / PPT / Excel 熟练
专业：Python、C++、SQL；机器学习、NLP 与金融、区块链`

// 方向标签
export const DIRECTION_LABEL: Record<Direction, string> = {
  institution: '泛体制内',
  brokerage: '券商',
  other: '其他',
}

// 内置实习推荐库（方向性参考，具体以官方公告为准）
export interface RecItem {
  title: string
  company: string
  direction: Direction
  description: string
  requirements: string
  howToApply: string
  tags: string[]
}

export const RECOMMENDED_INTERNSHIPS: RecItem[] = [
  {
    title: '投资部 / 研究部实习生',
    company: '中投公司 / 中央汇金',
    direction: 'institution',
    description: '参与境内外资产配置、宏观经济与行业研究，协助投资标的分析与报告撰写。',
    requirements: '金融 / 经济 / 理工硕博；扎实的财务建模与研报写作；英语优秀优先。',
    howToApply: '官网招聘页 + 校园宣讲（秋季校招 / 暑期实习），关注"中投公司招聘"公众号。',
    tags: ['主权财富', '资产配置', '校招'],
  },
  {
    title: '财务部实习生',
    company: '国新资本 / 央企金控平台',
    direction: 'institution',
    description: '参与集团资金管理、合并报表、投融资测算与财务分析。',
    requirements: '财务 / 会计 / 金融背景；Excel 与财务系统熟练；细致严谨。',
    howToApply: '国聘网、国资小新、各央企官网招聘频道；注意暑期实习窗口。',
    tags: ['央企', '财务', '资金管理'],
  },
  {
    title: '投行部 / 金融市场部 / 资管部 暑期实习生',
    company: '工农中建总行',
    direction: 'institution',    requirements: '金融 / 经济 / 理工；非柜台岗，偏好总行部门；综合素质与实习经历。',
    description: '参与投行业务承做、资金交易、资管产品设计或同业业务支持。',
    howToApply: '各大行官网"校园招聘 - 实习生 / 暑期实习生"通道，通常每年 3-5 月开放。',
    tags: ['银行总行', '非柜台', '暑期实习'],
  },
  {
    title: '信贷 / 风险管理部门实习生',
    company: '政策性银行（国开行 / 进出口行 / 农发行）',
    direction: 'institution',
    description: '参与项目评审、信贷风险审查、行业研究与政策分析。',
    requirements: '经济 / 金融 / 公共管理；政策理解与文字功底；稳定性与合规意识。',
    howToApply: '官网校园招聘（政策性银行校招规模较小，建议提前关注）。',
    tags: ['政策性银行', '风控', '政策研究'],
  },
  {
    title: '债务融资委（债承）实习生',
    company: '中信证券',
    direction: 'brokerage',
    description: '参与城投债 / 公司债 / 金融债等承销项目，协助底稿、立项报告与发行材料。',
    requirements: '财务分析扎实；Excel/Wind 熟练；抗压与执行力；有债承经历优先。',
    howToApply: '中信证券官网招聘 - 投资银行委员会实习生；暑期实习竞争极激烈，提前准备。',
    tags: ['债承', '债券', '头部券商'],
  },
  {
    title: '投资银行部 / 研究部实习生',
    company: '中金公司',
    direction: 'brokerage',
    description: 'IBD 项目承做或行业研究，参与尽职调查、估值建模与研报撰写。',
    requirements: '顶尖院校金融 / 经济；建模与英语；有相关实习者优先。',
    howToApply: '中金公司官网 - 校园招聘 / 实习生；关注目标院校宣讲。',
    tags: ['中金', 'IBD', '研究'],
  },
  {
    title: '研究所行业研究实习生（AI / 半导体 / TMT）',
    company: '华泰证券',
    direction: 'brokerage',
    description: '深耕一个行业（建议 AI / 半导体 / 金融科技），撰写深度报告、搭建财务模型与跟踪表。',
    requirements: '财务基础 + 行业兴趣；Wind/Choice 数据能力；能产出完整研报。',
    howToApply: '华泰证券研究所实习生招聘（官网 / 内推为主），强调"垂直行业深度"。',
    tags: ['卖方研究', '行业深度', 'AI/半导体'],
  },
  {
    title: '债券承销 / 固定收益实习生',
    company: '国泰君安证券',
    direction: 'brokerage',
    description: '固定收益条线承销与销售交易支持，参与发行材料与定价分析。',
    requirements: '财务 / 金融；对固收市场有基本认知；细心负责。',
    howToApply: '国泰君安官网招聘 - 固定收益相关岗位实习生。',
    tags: ['固收', '债承', '头部券商'],
  },
  {
    title: '投资岗实习生（直投 / 私募股权）',
    company: '券商直投子公司（中信证券投资 / 中金资本等）',
    direction: 'brokerage',
    description: '参与一级市场项目筛选、行业研究与投决材料；门槛高，建议先积累研究与承做经验。',
    requirements: ' strong 财务与行业研究能力；有券商研究 / 承做实习背景优先。',
    howToApply: '先冲击头部券商研究 / 债承实习作为跳板，再通过内推进入直投。',
    tags: ['直投', '一级市场', '高门槛'],
  },
  {
    title: '行业研究员（垂直行业）',
    company: '任意头部券商研究所',
    direction: 'brokerage',
    description: '选择 AI / 半导体 / 金融科技中的一个行业做深，建立研究框架与标的池。',
    requirements: '选定行业并持续跟踪；能独立产出深度报告；数据工具熟练。',
    howToApply: '各券商研究所实习生招聘；强调"把一个行业弄明白"的长期主义。',
    tags: ['卖方研究', '垂直行业', '长期主义'],
  },
  {
    title: '监管 / 交易所实习',
    company: '沪深交易所 / 证监会派出机构',
    direction: 'institution',
    description: '参与市场监管、规则研究、上市审核支持等，强泛体制内属性。',
    requirements: '法学 / 金融 / 会计复合背景优先；严谨守规。',
    howToApply: '交易所官网实习招聘 + 校企合作通道，名额少需尽早准备。',
    tags: ['监管', '交易所', '体制内'],
  },
]
