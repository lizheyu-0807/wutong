import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  Home,
  LogIn,
  MessageSquareText,
  PencilLine,
  PhoneCall,
  RefreshCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  UserCheck,
  UserRound,
  UsersRound,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react'

import bowelPrepImage from './assets/demo/education-bowel-prep.svg'
import fastingImage from './assets/demo/education-fasting.svg'
import postOpImage from './assets/demo/post-op.svg'
import receptionImage from './assets/demo/department-reception.svg'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { TooltipProvider } from '@/components/ui/tooltip'
import AnesthesiaAssessment from '@/components/AnesthesiaAssessment'
import { AssessmentReportView } from '@/components/assessment-summary'
import {
  buildEmptyAssessment,
  emptyCardiovascularData,
  emptyDiabetesMedData,
  exportableRows,
  getAsaTone,
  getLocalDateString,
  getRiskSummary,
  normalizeAssessmentForStorage,
  recordMatchesAssessmentDate,
} from '@/lib/assessment'
import type { AssessmentRecord } from '@/lib/assessment'

type RouteView = 'mini' | 'admin' | 'assessment'
type MiniRootPage = 'home' | 'assessment' | 'profile'
type HomeMode = 'flow' | 'detail'
type ProfileMode = 'info' | 'assessmentReport'
type AdminPage = 'overview' | 'users' | 'assessmentAdmin' | 'assessmentRecords' | 'templates' | 'content' | 'touch' | 'account'
type NodeStatus = 'done' | 'current' | 'late' | 'pending'

type FlowNode = {
  id: string
  stage: '居家准备' | '到院后' | '后续'
  time: string
  title: string
  summary: string
  why: string
  steps: string[]
  notices: string[]
  action: string
  image: string
  status: NodeStatus
  completedAt?: string
  keyNode?: boolean
  location?: {
    place: string
    route: string
    materials: string[]
  }
}

type Visitor = {
  id: string
  name: string
  phone: string
  project: string
  examTime: string
  template: string
  status: '准备中' | '待到院' | '已到院' | '已完成' | '需处理'
  progress: string
  latestCompletedAt: string
  exception: string
  handling: string
  assessmentStatus: '待填写评估' | '已完成评估'
  assessmentReminder: string
  assessmentLastTouch: string
}

type TemplateRow = {
  name: string
  project: string
  surgeryTime: string
  nodeCount: string
  rule: string
  keyNodes: string
}

type PatientFilters = {
  date: string
  project: string
  surgeryTime: string
  status: string
  handling: string
  keyword: string
}

const flowNodes: FlowNode[] = [
  {
    id: 'diet',
    stage: '居家准备',
    time: '前一天 22:00',
    title: '饮食注意',
    summary: '今晚保持清淡饮食，帮助明天安排顺利进行。',
    why: '提前控制饮食，能让第二天准备更稳定。',
    steps: ['晚餐选择清淡、易消化食物。', '不要饮酒，不吃油腻或难消化食物。', '睡前确认明天预计手术时间和到院时间。'],
    notices: ['如医生有单独交代，以单独交代为准。', '长期服药人群按工作人员说明执行。'],
    action: '我已确认饮食要求',
    image: bowelPrepImage,
    status: 'done',
    completedAt: '昨天 22:18',
  },
  {
    id: 'fasting',
    stage: '居家准备',
    time: '今天 04:00',
    title: '严格禁食禁水',
    summary: '从这个节点开始，不再进食或饮水。',
    why: '禁食禁水是否达标，会直接影响当天检查能否顺利进行。',
    steps: ['不要吃任何食物。', '不要喝水、牛奶、饮料或含糖液体。', '如需服药，请按工作人员单独说明执行。'],
    notices: ['不要嚼口香糖或含服糖果。', '如已误食误饮，记录时间并联系工作人员。'],
    action: '我已开始禁食禁水',
    image: fastingImage,
    status: 'current',
    keyNode: true,
  },
  {
    id: 'arrival',
    stage: '居家准备',
    time: '今天 09:30',
    title: '按时到院报到',
    summary: '带好材料，到内镜中心护士站报到。',
    why: '准点报到能减少现场等待，也方便工作人员核对信息。',
    steps: ['带好身份证、预约凭证和既往检查资料。', '到门诊 3 楼内镜中心护士站报到。', '完成报到后进入到院后流程。'],
    notices: ['无痛检查建议由家属陪同。', '检查当天不要驾车、骑车或高空作业。'],
    action: '我已到院报到',
    image: receptionImage,
    status: 'pending',
    keyNode: true,
    location: {
      place: '内镜中心护士站',
      route: '门诊 3 楼电梯出门右转，沿蓝色地贴前行约 30 米。',
      materials: ['身份证', '预约凭证', '既往检查资料'],
    },
  },
  {
    id: 'checkin',
    stage: '到院后',
    time: '今天 09:35',
    title: '报到核对',
    summary: '工作人员核对姓名、检查项目和预约信息。',
    why: '信息核对完成后，后续环节才能继续推进。',
    steps: ['出示姓名和联系电话。', '核对检查项目和预计手术时间。', '领取后续现场指引。'],
    notices: ['信息不一致时不要进入下一步，请马上告知工作人员。'],
    action: '我已完成核对',
    image: receptionImage,
    status: 'pending',
    location: {
      place: '内镜中心护士站',
      route: '按护士站现场指引排队核对。',
      materials: ['身份证', '预约凭证'],
    },
  },
  {
    id: 'waiting',
    stage: '到院后',
    time: '今天 09:45',
    title: '候诊区等候',
    summary: '在候诊区等待叫号，保持手机畅通。',
    why: '等待期间保持可联系，方便工作人员安排下一步。',
    steps: ['坐在候诊区等待叫号。', '保持禁食禁水。', '如需离开，请先告知工作人员。'],
    notices: ['候诊期间仍需严格禁食禁水。'],
    action: '我已进入候诊区',
    image: receptionImage,
    status: 'pending',
    location: {
      place: '候诊区',
      route: '护士站右侧蓝色座椅区域。',
      materials: ['随身物品袋'],
    },
  },
  {
    id: 'leave',
    stage: '后续',
    time: '检查完成后',
    title: '查看后续说明',
    summary: '关注饮食、活动、异常情况和报告领取。',
    why: '后续事项清楚，今天的检查安排才算完整收尾。',
    steps: ['按说明休息。', '查看报告领取方式。', '如有持续不适，及时联系工作人员。'],
    notices: ['当天不要驾车、骑车或高空作业。', '持续剧烈腹痛、黑便、发热或头晕明显时及时联系。'],
    action: '我已查看后续说明',
    image: postOpImage,
    status: 'pending',
  },
]

const visitors: Visitor[] = [
  {
    id: 'v1',
    name: '李女士',
    phone: '138****6201',
    project: '单独胃镜',
    examTime: '10:00',
    template: '单独胃镜 · 10:00',
    status: '准备中',
    progress: '2/6',
    latestCompletedAt: '昨天 22:18',
    exception: '无',
    handling: '小程序已读',
    assessmentStatus: '待填写评估',
    assessmentReminder: '院前已推送 2 次',
    assessmentLastTouch: '今天 07:30 小程序提醒已读',
  },
  {
    id: 'v2',
    name: '陈先生',
    phone: '136****4908',
    project: '无痛胃肠镜',
    examTime: '09:00',
    template: '无痛胃肠镜 · 09:00',
    status: '需处理',
    progress: '1/7',
    latestCompletedAt: '昨天 20:12',
    exception: '禁食节点未确认',
    handling: '建议电话问询',
    assessmentStatus: '待填写评估',
    assessmentReminder: '院前已推送 3 次，建议电话兜底',
    assessmentLastTouch: '今天 08:00 评估链接未读',
  },
  {
    id: 'v3',
    name: '王女士',
    phone: '135****7732',
    project: '单独肠镜',
    examTime: '13:30',
    template: '单独肠镜 · 下午场',
    status: '待到院',
    progress: '4/6',
    latestCompletedAt: '今天 08:10',
    exception: '无',
    handling: '短信已发送',
    assessmentStatus: '已完成评估',
    assessmentReminder: '停止推送',
    assessmentLastTouch: '昨天 21:18 已提交评估表',
  },
  {
    id: 'v4',
    name: '赵先生',
    phone: '159****3145',
    project: '单独胃镜',
    examTime: '09:00',
    template: '单独胃镜 · 09:00',
    status: '已到院',
    progress: '5/6',
    latestCompletedAt: '今天 08:42',
    exception: '材料待补录',
    handling: '现场人工处理',
    assessmentStatus: '已完成评估',
    assessmentReminder: '停止推送',
    assessmentLastTouch: '今天 08:05 护士已查看重点风险',
  },
]

const assessmentReminderPlan = [
  {
    time: '预约后 10 分钟',
    channel: '微信订阅消息',
    message: '为什么要填麻醉评估：提前识别过敏、用药、基础病和禁食禁水风险。打开 /#assessment 填写。',
    status: 'done' as const,
  },
  {
    time: '检查前一天 20:30',
    channel: '微信订阅消息',
    message: '您尚未完成麻醉评估，请点击评估链接 /#assessment，填写后将停止后续同类提醒。',
    status: 'current' as const,
  },
  {
    time: '检查当天到院前 2 小时',
    channel: '短信兜底',
    message: '若仍未填写，短信发送评估链接和填写原因，避免到院后重复排队补填。',
    status: 'pending' as const,
  },
]

type AssessmentBackendTab = 'daily' | 'stats' | 'manage'

type AssessmentStatistics = {
  total: number
  dailyTrend: Array<{ date: string; count: number }>
  asaDistribution: Array<{ name: string; value: number }>
  preAssessment: number
  normalAssessment: number
  abnormalCount: number
  normalCount: number
}

const assessmentStorageKey = 'assessmentRecords'

function createDemoAssessmentRecord(overrides: Partial<AssessmentRecord>, submittedAt: string): AssessmentRecord {
  return normalizeAssessmentForStorage(buildEmptyAssessment(overrides), new Date(submittedAt))
}

const demoAssessmentRecords: AssessmentRecord[] = [
  createDemoAssessmentRecord(
    {
      id: 'demo-assessment-1',
      name: '李女士',
      age: '42',
      gender: 'female',
      height: '162',
      weight: '58',
      assessment_date: getLocalDateString(),
      current_condition_normal: true,
      medical_history_normal: true,
      lifestyle_normal: true,
      surgery_allergy_normal: true,
      medication_normal: true,
      fasting_hours: '8',
      drinking_hours: '4',
      drink_type: 'water',
    },
    '2026-06-07T08:18:00',
  ),
  createDemoAssessmentRecord(
    {
      id: 'demo-assessment-2',
      name: '陈先生',
      age: '56',
      gender: 'male',
      height: '170',
      weight: '81',
      assessment_date: getLocalDateString(),
      chest_pain: false,
      current_condition_normal: true,
      cardiovascular_data: { ...emptyCardiovascularData, hypertension: true },
      smoking: 'daily',
      smoking_amount: '15',
      drinking: 'occasionally',
      surgery_allergy_normal: true,
      blood_pressure_med: true,
      fasting_hours: '6',
      drinking_hours: '2',
      drink_type: 'water',
    },
    '2026-06-07T08:36:00',
  ),
  createDemoAssessmentRecord(
    {
      id: 'demo-assessment-3',
      name: '王女士',
      age: '63',
      gender: 'female',
      height: '158',
      weight: '64',
      assessment_date: getLocalDateString(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      current_condition_normal: true,
      endocrine_data: { diabetes: true },
      smoking: 'never',
      drinking: 'never',
      surgery_allergy_normal: true,
      diabetes_med_data: { ...emptyDiabetesMedData, metformin: true },
      medication_normal: false,
    },
    '2026-06-06T21:10:00',
  ),
  createDemoAssessmentRecord(
    {
      id: 'demo-assessment-4',
      name: '赵先生',
      age: '48',
      gender: 'male',
      height: '176',
      weight: '92',
      assessment_date: getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000)),
      fever: true,
      medical_history_normal: true,
      lifestyle_normal: true,
      surgery_allergy_normal: true,
      medication_normal: true,
      fasting_hours: '5',
      drinking_hours: '1',
      drink_type: 'beverage',
    },
    '2026-06-06T16:24:00',
  ),
]

function readAssessmentRecordsFromStorage(): AssessmentRecord[] {
  if (typeof window === 'undefined') return demoAssessmentRecords

  try {
    const raw = window.localStorage.getItem(assessmentStorageKey)
    const parsed = raw ? JSON.parse(raw) : []
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as AssessmentRecord[]
    }
  } catch {
    return demoAssessmentRecords
  }

  return demoAssessmentRecords
}

function readLatestPatientAssessment(): AssessmentRecord | null {
  if (typeof window === 'undefined') return null

  try {
    const rawRecords = window.localStorage.getItem(assessmentStorageKey)
    const parsedRecords = rawRecords ? JSON.parse(rawRecords) : []
    if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
      return parsedRecords[0] as AssessmentRecord
    }

    const rawReport = window.localStorage.getItem('assessmentData')
    return rawReport ? (JSON.parse(rawReport) as AssessmentRecord) : null
  } catch {
    return null
  }
}

function buildAssessmentStatistics(records: AssessmentRecord[]): AssessmentStatistics {
  const asaDistribution = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'].map((name) => ({
    name,
    value: records.filter((record) => record.asa_class === `ASA ${name}`).length,
  }))
  const dailyCounts = records.reduce<Record<string, number>>((result, record) => {
    const date = record.assessment_date || record.created_at?.slice(0, 10) || getLocalDateString()
    result[date] = (result[date] ?? 0) + 1
    return result
  }, {})
  const abnormalCount = records.filter((record) => {
    const summary = getRiskSummary(record)
    return summary.critical.length > 0 || summary.important.length > 0 || record.asa_class === 'ASA Ⅲ' || record.asa_class === 'ASA Ⅳ'
  }).length

  return {
    total: records.length,
    dailyTrend: Object.entries(dailyCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, count]) => ({ date, count })),
    asaDistribution,
    preAssessment: records.filter((record) => record.is_pre_assessment).length,
    normalAssessment: records.filter((record) => !record.is_pre_assessment).length,
    abnormalCount,
    normalCount: Math.max(0, records.length - abnormalCount),
  }
}

function getAssessmentIssues(record: AssessmentRecord, limit = 3): string[] {
  const summary = getRiskSummary(record)
  return [...summary.critical, ...summary.important, ...summary.notes].slice(0, limit)
}

function downloadAssessmentCsv(records: AssessmentRecord[], startDate: string, endDate: string) {
  const rows = exportableRows(
    records.filter((record) => {
      if (startDate && record.assessment_date < startDate) return false
      if (endDate && record.assessment_date > endDate) return false
      return true
    }),
  )
  const headers = Object.keys(rows[0] ?? {
    姓名: '',
    年龄: '',
    性别: '',
    检查日期: '',
    是否预评估: '',
    ASA分级: '',
    身高cm: '',
    体重kg: '',
    BMI: '',
    关键问题: '',
    重要问题: '',
    注意事项: '',
    填写时间: '',
  })
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => formatCsvValue(row[header as keyof typeof row])).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `疼痛医学科术前评估_${startDate || '全部'}_${endDate || '全部'}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}

function formatCsvValue(value: unknown): string {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

const templateRows: TemplateRow[] = [
  {
    name: '单独胃镜 · 09:00',
    project: '单独胃镜',
    surgeryTime: '09:00',
    nodeCount: '5 个节点',
    rule: '禁食禁水 = 检查前 6 小时',
    keyNodes: '禁食禁水、到院报到',
  },
  {
    name: '单独胃镜 · 10:00',
    project: '单独胃镜',
    surgeryTime: '10:00',
    nodeCount: '5 个节点',
    rule: '禁食禁水 = 检查前 6 小时',
    keyNodes: '禁食禁水、到院报到',
  },
  {
    name: '无痛胃肠镜 · 09:00',
    project: '无痛胃肠镜',
    surgeryTime: '09:00',
    nodeCount: '7 个节点',
    rule: '前一天 20:00 + 检查前 6 小时',
    keyNodes: '服泻药、禁食禁水、到院报到',
  },
  {
    name: '单独肠镜 · 下午场',
    project: '单独肠镜',
    surgeryTime: '13:30',
    nodeCount: '6 个节点',
    rule: '第二次准备 = 当天 08:00',
    keyNodes: '第二次准备、禁食禁水',
  },
]

function App() {
  const [route, setRoute] = useState<RouteView>(() => readRoute())

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) {
      window.location.hash = route
    }
    return () => window.removeEventListener('hashchange', onHash)
  }, [route])

  return (
    <TooltipProvider>
      {route === 'mini' && <MiniDemo />}
      {route === 'admin' && <AdminDemo />}
      {route === 'assessment' && <AnesthesiaAssessment onBack={() => { window.location.hash = 'mini' }} />}
    </TooltipProvider>
  )
}

function MiniDemo() {
  const [page, setPage] = useState<MiniRootPage>('home')
  const [homeMode, setHomeMode] = useState<HomeMode>('flow')
  const [profileMode, setProfileMode] = useState<ProfileMode>('info')
  const [selectedNodeId, setSelectedNodeId] = useState('fasting')
  const [completed, setCompleted] = useState<string[]>(['diet'])
  const [reminderOn, setReminderOn] = useState(true)
  const [latestAssessment, setLatestAssessment] = useState<AssessmentRecord | null>(() => readLatestPatientAssessment())

  const nodes = useMemo(
    () =>
      flowNodes.map((node) => ({
        ...node,
        status: completed.includes(node.id)
          ? ('done' as const)
          : node.id === 'fasting'
            ? ('current' as const)
            : node.status === 'late'
              ? ('late' as const)
              : ('pending' as const),
        completedAt: completed.includes(node.id) ? node.completedAt ?? '刚刚' : node.completedAt,
      })),
    [completed],
  )
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[1]
  const nextNode = nodes.find((node) => node.status === 'current') ?? nodes.find((node) => node.status === 'pending') ?? nodes[0]
  const progressValue = Math.round((nodes.filter((node) => node.status === 'done').length / nodes.length) * 100)

  const openNode = (id: string) => {
    setSelectedNodeId(id)
    setHomeMode('detail')
    setPage('home')
  }

  const returnToFlow = () => {
    setHomeMode('flow')
    setPage('home')
  }

  const openAssessment = () => {
    setPage('assessment')
  }

  const openProfile = () => {
    setLatestAssessment(readLatestPatientAssessment())
    setProfileMode('info')
    setPage('profile')
  }

  const openAssessmentReport = () => {
    setLatestAssessment(readLatestPatientAssessment())
    setProfileMode('assessmentReport')
    setPage('profile')
  }

  const completeNode = (id: string) => {
    setCompleted((items) => (items.includes(id) ? items : [...items, id]))
    returnToFlow()
  }

  return (
    <main className="mini-immersive">
      <div className="mini-device">
        <MiniStatusBar />
        <MiniTitleBar
          page={page}
          homeMode={homeMode}
          profileMode={profileMode}
          setPage={setPage}
          setHomeMode={setHomeMode}
          openProfile={openProfile}
        />
        <div className="mini-content">
          <AnimatePresence mode="wait">
            {page === 'home' && homeMode === 'flow' && (
              <MotionPage key="home-flow">
                <MiniHome
                  nodes={nodes}
                  nextNode={nextNode}
                  progressValue={progressValue}
                  reminderOn={reminderOn}
                  openNode={openNode}
                  openAssessment={openAssessment}
                />
              </MotionPage>
            )}
            {page === 'home' && homeMode === 'detail' && (
              <MotionPage key={`detail-${selectedNode.id}`}>
                <MiniNodeDetail
                  node={selectedNode}
                  nodes={nodes}
                  reminderOn={reminderOn}
                  setReminderOn={setReminderOn}
                  completeNode={completeNode}
                  openAssessment={openAssessment}
                  returnToFlow={returnToFlow}
                  openNode={openNode}
                />
              </MotionPage>
            )}
            {page === 'assessment' && (
              <MotionPage key="assessment">
                <AnesthesiaAssessment embedded onBack={returnToFlow} />
              </MotionPage>
            )}
            {page === 'profile' && profileMode === 'info' && (
              <MotionPage key="profile">
                <MiniProfile assessment={latestAssessment} openAssessmentReport={openAssessmentReport} />
              </MotionPage>
            )}
            {page === 'profile' && profileMode === 'assessmentReport' && (
              <MotionPage key="profile-assessment-report">
                <MiniAssessmentReport assessment={latestAssessment} back={openProfile} openAssessment={openAssessment} />
              </MotionPage>
            )}
          </AnimatePresence>
        </div>
        <MiniBottomNav
          page={page}
          setPage={setPage}
          setHomeMode={setHomeMode}
          openAssessment={openAssessment}
          openProfile={openProfile}
        />
      </div>
    </main>
  )
}

function MotionPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="mini-page"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function MiniStatusBar() {
  return (
    <div className="mini-statusbar">
      <strong>09:41</strong>
      <span className="mini-capsule">
        <i />
        <i />
      </span>
    </div>
  )
}

function MiniTitleBar({
  page,
  homeMode,
  profileMode,
  setPage,
  setHomeMode,
  openProfile,
}: {
  page: MiniRootPage
  homeMode: HomeMode
  profileMode: ProfileMode
  setPage: (page: MiniRootPage) => void
  setHomeMode: (mode: HomeMode) => void
  openProfile: () => void
}) {
  const canGoBack = page === 'assessment' || (page === 'home' && homeMode === 'detail') || (page === 'profile' && profileMode === 'assessmentReport')
  const goBack = () => {
    if (page === 'home' && homeMode === 'detail') {
      setHomeMode('flow')
      return
    }
    if (page === 'profile' && profileMode === 'assessmentReport') {
      openProfile()
      return
    }
    setPage('home')
    setHomeMode('flow')
  }

  return (
    <div className="mini-titlebar">
      {canGoBack ? (
        <Button variant="ghost" size="icon-sm" onClick={goBack} aria-label="返回">
          <ArrowLeft />
        </Button>
      ) : (
        <span />
      )}
      <strong>{miniTitle(page, homeMode, profileMode)}</strong>
      <Button variant="ghost" size="icon-sm" onClick={() => setPage('profile')} aria-label="我的信息">
        <UserRound />
      </Button>
    </div>
  )
}

function MiniHome({
  nodes,
  nextNode,
  progressValue,
  reminderOn,
  openNode,
  openAssessment,
}: {
  nodes: FlowNode[]
  nextNode: FlowNode
  progressValue: number
  reminderOn: boolean
  openNode: (id: string) => void
  openAssessment: () => void
}) {
  return (
    <>
      <section className="identity-card home-clean-card">
        <div>
          <span>微信已登录</span>
          <h1>李女士的检查准备</h1>
          <p>单独胃镜 · 今天 10:00 · 内镜中心</p>
        </div>
        <Badge variant="secondary">准备中</Badge>
      </section>

      <section className="home-dashboard">
        <div className="home-dashboard-main">
          <span>当前关键节点</span>
          <strong>{nextNode.title}</strong>
          <em>{nextNode.time} · {nextNode.summary}</em>
        </div>
        <div className="home-progress-ring" aria-label={`准备进度 ${progressValue}%`}>
          <strong>{progressValue}%</strong>
          <span>进度</span>
        </div>
      </section>

      <FlowCardCarousel nodes={nodes} openNode={openNode} />

      <section className="home-assessment-strip">
        <div>
          <span>院前麻醉评估</span>
          <strong>待填写 · 填写后停止同类提醒</strong>
          <p>请在到院前填写，方便提前识别用药、过敏、禁食禁水和基础病风险。</p>
          <div className="reason-note">
            <Stethoscope />
            <span>未填写前会在院前多次提醒，并附上评估链接和填写原因；填写后自动停止推送。</span>
          </div>
        </div>
        <Button size="lg" onClick={openAssessment}>
            现在填写评估表
          <ChevronRight data-icon="inline-end" />
        </Button>
      </section>

      <Card className="flow-card reminder-plan-card compact-home-reminder">
        <CardHeader>
          <CardTitle>院前评估提醒</CardTitle>
          <CardDescription>{reminderOn ? '节点提醒已开启' : '节点提醒未开启'} · 待填写评估会继续提醒。</CardDescription>
        </CardHeader>
        <CardContent className="reminder-plan-list">
          {assessmentReminderPlan.slice(0, 2).map((item) => (
            <div key={item.time}>
              <span className={`mini-dot is-${item.status}`} />
              <span>
                <strong>{item.time} · {item.channel}</strong>
                <em>{item.message}</em>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

function FlowCardCarousel({ nodes, openNode }: { nodes: FlowNode[]; openNode: (id: string) => void }) {
  return (
    <section className="flow-card-carousel" aria-label="今日流程卡片流">
      <div className="mini-section-title flow-carousel-title">
        <h2>今日流程</h2>
        <span>上下滑动查看每个节点</span>
      </div>
      <div className="flow-card-rail">
        {nodes.map((node, index) => (
          <motion.button
            key={node.id}
            type="button"
            className={`flow-node-card is-${node.status} ${node.status === 'current' ? 'is-featured' : ''}`}
            onClick={() => openNode(node.id)}
            initial={{ opacity: 0, y: 34, scale: 0.94 }}
            animate={{
              opacity: node.status === 'current' ? 1 : 0.82,
              y: 0,
              scale: node.status === 'current' ? 1 : 0.88,
            }}
            transition={{ delay: index * 0.045, duration: 0.32, ease: 'easeOut' }}
          >
            <span className="flow-node-line" />
            <span className="flow-node-body">
              <span className="flow-node-meta">
                <em>{statusLabel(node.status)}</em>
                <strong>{node.time}</strong>
              </span>
              <span className="flow-node-title">{node.title}</span>
              <span className="flow-node-summary">{node.summary}</span>
            </span>
            <img src={node.image} alt="" />
          </motion.button>
        ))}
      </div>
    </section>
  )
}

function MiniNodeDetail({
  node,
  nodes,
  reminderOn,
  setReminderOn,
  completeNode,
  openAssessment,
  returnToFlow,
  openNode,
}: {
  node: FlowNode
  nodes: FlowNode[]
  reminderOn: boolean
  setReminderOn: (checked: boolean) => void
  completeNode: (id: string) => void
  openAssessment: () => void
  returnToFlow: () => void
  openNode: (id: string) => void
}) {
  return (
    <section className="node-detail-shell">
      <FlowBraceletButton nodes={nodes} currentNodeId={node.id} returnToFlow={returnToFlow} openNode={openNode} />

      <section className="node-hero node-detail-hero">
        <div>
          <Badge variant={node.status === 'done' ? 'secondary' : 'default'}>{statusLabel(node.status)}</Badge>
          <h1>{node.title}</h1>
          <p>{node.time} · {node.summary}</p>
        </div>
        <img src={node.image} alt="" />
      </section>

      <Card className="flow-card">
        <CardHeader>
          <CardTitle>操作步骤</CardTitle>
          <CardDescription>{node.why}</CardDescription>
        </CardHeader>
        <CardContent className="step-list">
          {node.steps.map((step, index) => (
            <div key={step} className="step-row">
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {node.location && (
        <Card className="flow-card">
          <CardHeader>
            <CardTitle>到院指引</CardTitle>
            <CardDescription>{node.location.place}</CardDescription>
          </CardHeader>
          <CardContent className="location-list">
            <InfoLine label="路线" value={node.location.route} />
            <InfoLine label="材料" value={node.location.materials.join('、')} />
          </CardContent>
        </Card>
      )}

      {node.id === 'arrival' && (
        <Card className="flow-card anesthesia-entry-card">
          <CardHeader>
            <CardTitle>麻醉评估</CardTitle>
            <CardDescription>建议到院前完成；如果未填写，系统会继续发送包含链接和原因的提醒。</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" onClick={openAssessment}>
                <Stethoscope data-icon="inline-start" />
                填写麻醉评估
              </Button>
            </CardAction>
          </CardHeader>
        </Card>
      )}

      <Card className="flow-card">
        <CardHeader>
          <CardTitle>注意事项</CardTitle>
          <CardDescription>当前节点需要特别留意的内容。</CardDescription>
        </CardHeader>
        <CardContent className="detail-notice-list">
          {node.notices.map((notice, index) => (
            <div key={notice} className="notice-row">
              <span>{index + 1}</span>
              <p>{notice}</p>
            </div>
          ))}
          <Alert className="mini-action-alert">
            <PhoneCall />
            <AlertTitle>未按要求完成怎么办</AlertTitle>
            <AlertDescription>先记录发生时间，再按页面说明或电话联系工作人员。</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="flow-card subtle-card">
        <CardHeader>
          <CardTitle>节点提醒</CardTitle>
          <CardDescription>按节点接收重要事项提醒。</CardDescription>
          <CardAction>
            <Switch checked={reminderOn} onCheckedChange={setReminderOn} />
          </CardAction>
        </CardHeader>
      </Card>

      <Button size="lg" onClick={() => completeNode(node.id)} disabled={node.status === 'done'}>
        <Check data-icon="inline-start" />
        {node.status === 'done' ? `已完成：${node.completedAt}` : node.action}
      </Button>
    </section>
  )
}

function FlowBraceletButton({
  nodes,
  currentNodeId,
  returnToFlow,
  openNode,
}: {
  nodes: FlowNode[]
  currentNodeId: string
  returnToFlow: () => void
  openNode: (id: string) => void
}) {
  return (
    <motion.div
      className="flow-bracelet-wrap"
      initial={{ opacity: 0, scale: 0.72, x: 18, y: -12 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <button type="button" className="flow-bracelet-button" onClick={returnToFlow} aria-label="回到卡片流">
        <span>卡片手链</span>
        <strong>回到卡片流</strong>
        <div className="flow-bracelet-stack" aria-hidden="true">
          {nodes.slice(0, 5).map((node, index) => (
            <i key={node.id} className={node.id === currentNodeId ? 'active' : ''} style={{ transform: `translateY(${index * 5}px) scale(${1 - index * 0.055})` }} />
          ))}
        </div>
      </button>
      <div className="flow-bracelet-dots" aria-label="切换流程节点">
        {nodes.map((node) => (
          <button
            key={node.id}
            type="button"
            className={node.id === currentNodeId ? 'active' : ''}
            onClick={() => openNode(node.id)}
            aria-label={`查看${node.title}`}
          />
        ))}
      </div>
    </motion.div>
  )
}

function MiniProfile({
  assessment,
  openAssessmentReport,
}: {
  assessment: AssessmentRecord | null
  openAssessmentReport: () => void
}) {
  return (
    <>
      <section className="identity-card profile-card">
        <div>
          <span>登录信息</span>
          <h1>李女士</h1>
          <p>微信授权登录 · 手机号 138****6201</p>
        </div>
        <UserCheck />
      </section>
      <Card className="flow-card">
        <CardHeader>
          <CardTitle>当前检查人</CardTitle>
          <CardDescription>单独胃镜 · 今天 10:00</CardDescription>
        </CardHeader>
        <CardContent className="location-list">
          <InfoLine label="检查地点" value="内镜中心" />
          <InfoLine label="流程模板" value="单独胃镜 · 10:00" />
          <InfoLine label="准备状态" value="准备中" />
        </CardContent>
      </Card>
      {assessment ? (
        <button type="button" className="profile-assessment-card" onClick={openAssessmentReport}>
          <div className="profile-assessment-icon">
            <FileCheck2 />
          </div>
          <div className="min-w-0">
            <span>已完成</span>
            <strong>麻醉评估报告</strong>
            <em>
              {assessment.asa_class || 'ASA 待评估'} · {assessment.is_pre_assessment ? '预约预评估' : '当天评估'}
            </em>
          </div>
          <ChevronRight />
        </button>
      ) : null}
    </>
  )
}

function MiniAssessmentReport({
  assessment,
  back,
  openAssessment,
}: {
  assessment: AssessmentRecord | null
  back: () => void
  openAssessment: () => void
}) {
  if (!assessment) {
    return (
      <>
        <section className="plain-title">
          <span>麻醉评估报告</span>
          <h1>还没有评估记录</h1>
          <p>完成麻醉评估后，这里会显示患者端报告。</p>
        </section>
        <div className="profile-empty-report">
          <FileCheck2 />
          <strong>暂无麻醉评估报告</strong>
          <em>请先填写并提交麻醉术前评估。</em>
          <Button onClick={openAssessment}>
            <PencilLine data-icon="inline-start" />
            去填写评估
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <section className="plain-title">
        <span>麻醉评估报告</span>
        <h1>{assessment.name || '患者'}的评估结果</h1>
        <p>患者端展示版，后台可查看完整记录和风险汇总。</p>
      </section>
      <button type="button" className="report-back-row" onClick={back}>
        <ArrowLeft />
        返回我的信息
      </button>
      <div className="mini-assessment-report">
        <AssessmentReportView assessment={assessment} compact />
      </div>
    </>
  )
}

function MiniBottomNav({
  page,
  setPage,
  setHomeMode,
  openAssessment,
  openProfile,
}: {
  page: MiniRootPage
  setPage: (page: MiniRootPage) => void
  setHomeMode: (mode: HomeMode) => void
  openAssessment: () => void
  openProfile: () => void
}) {
  const miniNavItems: Array<{ page: MiniRootPage; label: string; icon: LucideIcon; action: () => void }> = [
    {
      page: 'home',
      label: '首页',
      icon: Home,
      action: () => {
        setHomeMode('flow')
        setPage('home')
      },
    },
    {
      page: 'assessment',
      label: '评估',
      icon: Stethoscope,
      action: openAssessment,
    },
    {
      page: 'profile',
      label: '我的',
      icon: UserRound,
      action: openProfile,
    },
  ]

  return (
    <nav className="mini-nav">
      {miniNavItems.map((item) => {
        const Icon = item.icon
        return (
          <button key={item.page} className={page === item.page ? 'active' : ''} onClick={item.action}>
            <Icon />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

function AdminDemo() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [page, setPage] = useState<AdminPage>('overview')
  const [filters, setFilters] = useState<PatientFilters>({
    date: '2026-06-04',
    project: '',
    surgeryTime: '',
    status: '',
    handling: '',
    keyword: '',
  })
  const [selectedVisitorId, setSelectedVisitorId] = useState('v2')
  const [note, setNote] = useState('04:20 电话问询，已确认未进食，提醒继续保持禁食禁水。')

  const selectedVisitor = visitors.find((visitor) => visitor.id === selectedVisitorId) ?? visitors[0]
  const filteredVisitors = visitors.filter((visitor) => {
    const text = `${visitor.name} ${visitor.phone} ${visitor.project} ${visitor.status} ${visitor.exception} ${visitor.handling}`
    if (filters.project && visitor.project !== filters.project) return false
    if (filters.surgeryTime && visitor.examTime !== filters.surgeryTime) return false
    if (filters.status && visitor.status !== filters.status) return false
    if (filters.handling && !visitor.handling.includes(filters.handling)) return false
    if (filters.keyword && !text.includes(filters.keyword)) return false
    return true
  })

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />
  }

  return (
    <main className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <WandSparkles />
          <span>
            <strong>接诊管理台</strong>
            <em>内镜中心 · 运营账号</em>
          </span>
        </div>
        <nav>
          <AdminNavButton page="overview" current={page} setPage={setPage} icon={CalendarClock} label="接诊总览" />
          <AdminNavButton page="users" current={page} setPage={setPage} icon={UsersRound} label="患者列表" />
          <AdminNavButton page="assessmentAdmin" current={page} setPage={setPage} icon={Stethoscope} label="麻醉评估推送管理" />
          <AdminNavButton page="assessmentRecords" current={page} setPage={setPage} icon={FileCheck2} label="麻醉评估后台" />
          <AdminNavButton page="templates" current={page} setPage={setPage} icon={Settings2} label="流程模板配置" />
          <AdminNavButton page="content" current={page} setPage={setPage} icon={PencilLine} label="内容与引导配置" />
          <AdminNavButton page="touch" current={page} setPage={setPage} icon={MessageSquareText} label="触达与处理记录" />
          <AdminNavButton page="account" current={page} setPage={setPage} icon={UserCheck} label="账号与权限" />
        </nav>
      </aside>
      <section className="admin-main">
        <AdminTopbar />
        <AnimatePresence mode="wait">
          {page === 'overview' && (
            <AdminMotion key="overview">
              <AdminOverview setPage={setPage} setSelectedVisitorId={setSelectedVisitorId} />
            </AdminMotion>
          )}
          {page === 'users' && (
            <AdminMotion key="users">
              <AdminUsers
                filters={filters}
                setFilters={setFilters}
                visitors={filteredVisitors}
                selectedVisitor={selectedVisitor}
                setSelectedVisitorId={setSelectedVisitorId}
                note={note}
                setNote={setNote}
              />
            </AdminMotion>
          )}
          {page === 'assessmentAdmin' && (
            <AdminMotion key="assessmentAdmin">
              <AdminAssessmentManagement />
            </AdminMotion>
          )}
          {page === 'assessmentRecords' && (
            <AdminMotion key="assessmentRecords">
              <AdminAssessmentRecords />
            </AdminMotion>
          )}
          {page === 'templates' && (
            <AdminMotion key="templates">
              <AdminTemplates />
            </AdminMotion>
          )}
          {page === 'content' && (
            <AdminMotion key="content">
              <AdminContent />
            </AdminMotion>
          )}
          {page === 'touch' && (
            <AdminMotion key="touch">
              <AdminTouch />
            </AdminMotion>
          )}
          {page === 'account' && (
            <AdminMotion key="account">
              <AdminAccount />
            </AdminMotion>
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="admin-login-screen">
      <Card className="login-card">
        <CardHeader>
          <CardTitle>管理端登录</CardTitle>
          <CardDescription>请输入账号和密码进入接诊管理台。</CardDescription>
        </CardHeader>
        <CardContent className="login-form">
          <Input value="operator@hospital.cn" readOnly aria-label="账号" />
          <Input value="123456" readOnly type="password" aria-label="密码" />
          <Button size="lg" onClick={onLogin}>
            <LogIn data-icon="inline-start" />
            登录接诊管理台
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

function AdminMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="admin-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      {children}
    </motion.div>
  )
}

function AdminTopbar() {
  return (
    <header className="admin-topbar">
      <div>
        <strong>XX医院 · 内镜中心</strong>
        <span>当前账号：运营管理员 · 当日 128 位患者</span>
      </div>
      <div className="admin-topbar-actions">
        <Button variant="outline" onClick={() => { window.location.hash = 'mini' }}>
          <Smartphone data-icon="inline-start" />
          小程序入口
        </Button>
        <Button variant="outline" onClick={() => { window.location.hash = 'assessment' }}>
          <Stethoscope data-icon="inline-start" />
          填写评估表
        </Button>
        <Button>
          <RefreshCcw data-icon="inline-start" />
          刷新数据
        </Button>
      </div>
    </header>
  )
}

function AdminOverview({
  setPage,
  setSelectedVisitorId,
}: {
  setPage: (page: AdminPage) => void
  setSelectedVisitorId: (id: string) => void
}) {
  return (
    <>
      <AdminHeader title="接诊总览" desc="关注当日患者接诊、准备完成情况，以及未按要求时的处理对策。" />
      <Card className="ops-card">
        <CardContent className="overview-filter">
          <label className="field-control">
            <span>接诊日期</span>
            <Input type="date" value="2026-06-04" readOnly />
          </label>
          <label className="field-control">
            <span>科室</span>
            <Input value="内镜中心" readOnly />
          </label>
          <label className="field-control">
            <span>统计范围</span>
            <Input value="全部预计手术时间" readOnly />
          </label>
        </CardContent>
      </Card>
      <div className="metric-grid">
        <MetricCard label="接诊患者数" value="128" tone="cream" icon={UsersRound} />
        <MetricCard label="已完成准备" value="76" tone="mint" icon={CheckCircle2} />
        <MetricCard label="待确认" value="31" tone="blue" icon={Clock3} />
        <MetricCard label="待填麻醉评估" value="24" tone="amber" icon={Stethoscope} />
        <MetricCard label="需人工处理" value="9" tone="rose" icon={PhoneCall} />
      </div>

      <div className="admin-two-col">
        <Card className="ops-card">
          <CardHeader>
            <CardTitle>未按要求处理队列</CardTitle>
            <CardDescription>优先处理未填写麻醉评估、禁食未确认和材料异常。</CardDescription>
          </CardHeader>
          <CardContent className="action-queue">
            {visitors.filter((visitor) => visitor.exception !== '无' || visitor.assessmentStatus === '待填写评估').map((visitor) => (
              <button
                key={visitor.id}
                onClick={() => {
                  setSelectedVisitorId(visitor.id)
                  setPage('users')
                }}
              >
                <span>
                  <strong>{visitor.name} · {visitor.project}</strong>
                  <em>预计手术时间 {visitor.examTime} · {visitor.assessmentStatus === '待填写评估' ? visitor.assessmentReminder : visitor.exception}</em>
                </span>
                <StatusPill label={visitor.handling} />
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="ops-card">
          <CardHeader>
            <CardTitle>接诊名单概览</CardTitle>
            <CardDescription>从患者列表进入完成度详情。</CardDescription>
          </CardHeader>
          <CardContent className="compact-list">
            {visitors.map((visitor) => (
              <div key={visitor.id}>
                <span>
                  <strong>{visitor.name}</strong>
                  <em>{visitor.project} · 预计手术时间 {visitor.examTime}</em>
                </span>
                <span>{visitor.progress}</span>
                <StatusPill label={visitor.status} />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={() => setPage('users')}>
              查看患者列表
              <ChevronRight data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}

function AdminUsers({
  filters,
  setFilters,
  visitors,
  selectedVisitor,
  setSelectedVisitorId,
  note,
  setNote,
}: {
  filters: PatientFilters
  setFilters: (filters: PatientFilters) => void
  visitors: Visitor[]
  selectedVisitor: Visitor
  setSelectedVisitorId: (id: string) => void
  note: string
  setNote: (note: string) => void
}) {
  const [pageIndex, setPageIndex] = useState(1)
  const pageSize = 3
  const totalPages = Math.max(1, Math.ceil(visitors.length / pageSize))
  const currentPage = Math.min(pageIndex, totalPages)
  const pageVisitors = visitors.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const updateFilter = (key: keyof PatientFilters, value: string) => {
    setFilters({ ...filters, [key]: value })
    setPageIndex(1)
  }

  return (
    <>
      <AdminHeader title="患者列表" desc="多条件检索，并在详情里查看每位患者的完成度和完成时间。" />
      <Card className="ops-card">
        <CardHeader>
          <CardTitle>多条件检索</CardTitle>
          <CardDescription>按日期、项目、预计手术时间、状态、处理方式和关键词组合筛选。</CardDescription>
        </CardHeader>
        <CardContent className="filter-area">
          <div className="condition-grid">
            <label className="field-control">
              <span>接诊日期</span>
              <Input type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} />
            </label>
            <label className="field-control">
              <span>检查项目</span>
              <select className="select-input" value={filters.project} onChange={(event) => updateFilter('project', event.target.value)}>
                <option value="">全部项目</option>
                <option value="单独胃镜">单独胃镜</option>
                <option value="单独肠镜">单独肠镜</option>
                <option value="无痛胃肠镜">无痛胃肠镜</option>
              </select>
            </label>
            <label className="field-control">
              <span>预计手术时间</span>
              <select className="select-input" value={filters.surgeryTime} onChange={(event) => updateFilter('surgeryTime', event.target.value)}>
                <option value="">全部预计手术时间</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="13:30">13:30</option>
              </select>
            </label>
            <label className="field-control">
              <span>处理状态</span>
              <select className="select-input" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                <option value="">全部状态</option>
                <option value="准备中">准备中</option>
                <option value="待到院">待到院</option>
                <option value="已到院">已到院</option>
                <option value="需处理">需处理</option>
              </select>
            </label>
            <label className="field-control">
              <span>联系处理方式</span>
              <select className="select-input" value={filters.handling} onChange={(event) => updateFilter('handling', event.target.value)}>
                <option value="">全部方式</option>
                <option value="电话">电话问询</option>
                <option value="短信">短信引导</option>
                <option value="小程序">小程序已读</option>
                <option value="现场">现场人工处理</option>
              </select>
            </label>
            <label className="field-control keyword-field">
              <span>关键词</span>
              <span className="input-with-icon">
                <Search />
                <Input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="姓名 / 手机 / 异常状态" />
              </span>
            </label>
          </div>
          <div className="filter-chips">
            <Button variant="outline" size="sm" onClick={() => setFilters({ date: '2026-06-04', project: '单独胃镜', surgeryTime: '10:00', status: '', handling: '', keyword: '' })}>单独胃镜 · 10:00</Button>
            <Button variant="outline" size="sm" onClick={() => setFilters({ date: '2026-06-04', project: '', surgeryTime: '', status: '需处理', handling: '电话', keyword: '' })}>需电话问询</Button>
            <Button variant="outline" size="sm" onClick={() => setFilters({ date: '2026-06-04', project: '', surgeryTime: '', status: '已到院', handling: '', keyword: '' })}>已到院</Button>
            <Button variant="ghost" size="sm" onClick={() => setFilters({ date: '2026-06-04', project: '', surgeryTime: '', status: '', handling: '', keyword: '' })}>清空条件</Button>
          </div>
        </CardContent>
      </Card>

      <div className="admin-split">
        <Card className="ops-card">
          <CardHeader>
            <CardTitle>患者</CardTitle>
            <CardDescription>{visitors.length} 条结果 · 第 {currentPage} / {totalPages} 页</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>患者</TableHead>
                  <TableHead>项目</TableHead>
                  <TableHead>预计手术时间</TableHead>
                  <TableHead>完成度</TableHead>
                  <TableHead>麻醉评估</TableHead>
                  <TableHead>最近完成</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>处理</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageVisitors.map((visitor) => (
                  <TableRow key={visitor.id} onClick={() => setSelectedVisitorId(visitor.id)}>
                    <TableCell>
                      <strong>{visitor.name}</strong>
                      <small>{visitor.phone}</small>
                    </TableCell>
                    <TableCell>{visitor.project}</TableCell>
                    <TableCell>{visitor.examTime}</TableCell>
                    <TableCell>{visitor.progress}</TableCell>
                    <TableCell><StatusPill label={visitor.assessmentStatus} /></TableCell>
                    <TableCell>{visitor.latestCompletedAt}</TableCell>
                    <TableCell><StatusPill label={visitor.status} /></TableCell>
                    <TableCell><StatusPill label={visitor.handling} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="pagination-bar">
              <span>共 128 条，每页 20 条</span>
              <div>
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPageIndex(currentPage - 1)}>上一页</Button>
                {[1, 2, 3].map((page) => (
                  <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setPageIndex(page)}>
                    {page}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPageIndex(currentPage + 1)}>下一页</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ops-card detail-panel">
          <CardHeader>
            <CardTitle>{selectedVisitor.name}的完成详情</CardTitle>
            <CardDescription>{selectedVisitor.template} · {selectedVisitor.phone}</CardDescription>
            <CardAction><StatusPill label={selectedVisitor.status} /></CardAction>
          </CardHeader>
          <CardContent className="detail-stack">
            <InfoLine label="完成度" value={selectedVisitor.progress} />
            <InfoLine label="最近完成时间" value={selectedVisitor.latestCompletedAt} />
            <InfoLine label="预计手术时间" value={selectedVisitor.examTime} />
            <InfoLine label="麻醉评估" value={`${selectedVisitor.assessmentStatus} · ${selectedVisitor.assessmentReminder}`} />
            <InfoLine label="最近评估触达" value={selectedVisitor.assessmentLastTouch} />
            <InfoLine label="异常状态" value={selectedVisitor.exception} />
            <InfoLine label="建议对策" value={selectedVisitor.handling} />
            <div className="node-check-list">
              {flowNodes.slice(0, 5).map((node) => (
                <div key={node.id}>
                  <span className={`mini-dot is-${node.status}`} />
                  <span>
                    <strong>{node.title}</strong>
                    <em>应完成：{node.time} · 实际：{node.completedAt ?? '未确认'}</em>
                  </span>
                </div>
              ))}
            </div>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
            <div className="detail-actions">
              <Button>
                <PhoneCall data-icon="inline-start" />
                电话问询
              </Button>
              <Button variant="outline">
                <Send data-icon="inline-start" />
                发送评估链接
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AdminAssessmentManagement() {
  const pending = visitors.filter((visitor) => visitor.assessmentStatus === '待填写评估')
  const completed = visitors.filter((visitor) => visitor.assessmentStatus === '已完成评估')

  return (
    <>
      <AdminHeader title="麻醉评估推送管理" desc="管理院前评估链接的触达节奏，跟踪待填写、已完成和推送停止状态。" />
      <div className="metric-grid four">
        <MetricCard label="待填写评估" value="24" tone="amber" icon={Clock3} />
        <MetricCard label="已完成评估" value="104" tone="mint" icon={CheckCircle2} />
        <MetricCard label="今日评估链接推送" value="37" tone="blue" icon={Send} />
        <MetricCard label="停止推送" value="104" tone="cream" icon={BadgeCheck} />
      </div>

      <div className="admin-two-col">
        <Card className="ops-card">
          <CardHeader>
            <CardTitle>院前未填写提醒策略</CardTitle>
            <CardDescription>未填写前会在院前多次提醒；患者提交后自动停止推送。</CardDescription>
          </CardHeader>
          <CardContent className="reminder-plan-list">
            {assessmentReminderPlan.map((item) => (
              <div key={item.time}>
                <span className={`mini-dot is-${item.status}`} />
                <span>
                  <strong>{item.time} · {item.channel}</strong>
                  <em>{item.message}</em>
                </span>
                <StatusPill label={item.status === 'done' ? '已发送' : item.status === 'current' ? '待发送' : '兜底'} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="ops-card">
          <CardHeader>
            <CardTitle>提醒消息示例</CardTitle>
            <CardDescription>正式上线时可接微信订阅消息和短信模板。</CardDescription>
          </CardHeader>
          <CardContent className="assessment-message-preview">
            <strong>【XX医院内镜中心提醒】请完成院前麻醉评估</strong>
            <p>为什么要填麻醉评估：麻醉医生需要提前了解您的基础病、用药、过敏史和禁食禁水情况，减少到院后重复问询。</p>
            <p>评估链接：https://web-views.catjiujiu.cn/push/dist/#assessment</p>
            <Badge variant="secondary">患者填写后自动停止推送</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="ops-card">
        <CardHeader>
          <CardTitle>评估跟进名单</CardTitle>
          <CardDescription>演示字段：评估状态、最近触达、当前处理建议。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>患者</TableHead>
                <TableHead>项目</TableHead>
                <TableHead>预计手术时间</TableHead>
                <TableHead>评估状态</TableHead>
                <TableHead>最近触达</TableHead>
                <TableHead>推送策略</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...pending, ...completed].map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell>
                    <strong>{visitor.name}</strong>
                    <small>{visitor.phone}</small>
                  </TableCell>
                  <TableCell>{visitor.project}</TableCell>
                  <TableCell>{visitor.examTime}</TableCell>
                  <TableCell><StatusPill label={visitor.assessmentStatus} /></TableCell>
                  <TableCell>{visitor.assessmentLastTouch}</TableCell>
                  <TableCell><StatusPill label={visitor.assessmentReminder} /></TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={visitor.assessmentStatus === '待填写评估' ? 'default' : 'outline'}
                      onClick={() => { window.location.hash = 'assessment' }}
                    >
                      {visitor.assessmentStatus === '待填写评估' ? '补发链接' : '查看评估'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function AdminAssessmentRecords() {
  const [activeTab, setActiveTab] = useState<AssessmentBackendTab>('daily')
  const [selectedDate, setSelectedDate] = useState(getLocalDateString())
  const [records, setRecords] = useState<AssessmentRecord[]>(() => readAssessmentRecordsFromStorage())
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState(() =>
    getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
  )
  const [endDate, setEndDate] = useState(getLocalDateString())

  const statistics = useMemo(() => buildAssessmentStatistics(records), [records])
  const dailyRecords = useMemo(
    () => records.filter((record) => recordMatchesAssessmentDate(record, selectedDate)),
    [records, selectedDate],
  )
  const searchResults = useMemo(() => {
    const keyword = search.trim()
    if (!keyword) return []
    return records.filter((record) => `${record.name} ${record.age} ${record.gender} ${record.assessment_date}`.includes(keyword))
  }, [records, search])

  function reloadRecords() {
    setRecords(readAssessmentRecordsFromStorage())
  }

  function moveDate(days: number) {
    const next = new Date(`${selectedDate}T00:00:00`)
    next.setDate(next.getDate() + days)
    setSelectedDate(getLocalDateString(next))
  }

  return (
    <>
      <AdminHeader title="麻醉评估后台" desc="从压缩包后台迁入的评估结果工作台，可查看每日评估、风险统计、搜索和导出记录。" />

      <Card className="admin-hero-card">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Badge variant="secondary">静态演示版</Badge>
            <h2 className="mt-2 text-2xl font-black text-[#2f2825]">术前评估记录工作台</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#74655d]">
              正式上线时接医院数据库；当前 Demo 读取患者提交后的本地记录，没有记录时展示演示数据。
            </p>
          </div>
          <div className="admin-topbar-actions">
            <Button variant="outline" onClick={() => { window.location.hash = 'assessment' }}>
              <Stethoscope data-icon="inline-start" />
              填写评估表
            </Button>
            <Button onClick={reloadRecords}>
              <RefreshCcw data-icon="inline-start" />
              刷新记录
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="admin-tabs grid grid-cols-3 rounded-lg border border-[#ead9cb] bg-white p-1 shadow-sm">
        <AssessmentTabButton active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} label="每日评估" />
        <AssessmentTabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="数据统计" />
        <AssessmentTabButton active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} label="数据管理" />
      </div>

      {activeTab === 'daily' ? (
        <div className="admin-page">
          <Card className="ops-card">
            <CardContent className="admin-date-toolbar grid gap-3 p-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <Button className="admin-square-button" variant="outline" onClick={() => moveDate(-1)}>←</Button>
                <div className="min-w-0 text-center">
                  <p className="text-lg font-black text-[#2f2825]">{formatAssessmentDateTitle(selectedDate)}</p>
                  <p className="text-xs font-bold text-[#817269]">{selectedDate}</p>
                </div>
                <Button className="admin-square-button" variant="outline" onClick={() => moveDate(1)}>→</Button>
              </div>
              <Button variant="outline" onClick={() => setSelectedDate(getLocalDateString())}>今天</Button>
            </CardContent>
          </Card>

          {dailyRecords.length === 0 ? (
            <Card className="ops-card">
              <CardContent className="p-6 text-center text-sm font-bold text-[#817269]">
                当天暂无评估记录。可以切换日期，或先从患者端提交一条评估。
              </CardContent>
            </Card>
          ) : (
            <div className="assessment-record-grid">
              {dailyRecords.map((record) => (
                <AssessmentPatientCard key={record.id} record={record} onClick={() => setSelectedRecord(record)} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'stats' ? (
        <div className="admin-page">
          <StatsSummary statistics={statistics} />
          <div className="admin-stats-mobile-grid grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
            <AssessmentMetric label="总评估数" value={statistics.total} hint="全部记录" tone="total" />
            <AssessmentMetric label="预评估数" value={statistics.preAssessment} hint="非当天预约" tone="pre" />
            <AssessmentMetric label="异常评估数" value={statistics.abnormalCount} hint="需重点查看" tone="abnormal" />
            <AssessmentMetric label="正常评估数" value={statistics.normalCount} hint="未见明显异常" tone="normal" />
          </div>

          <div className="admin-two-col">
            <Card className="admin-chart-card">
              <CardHeader>
                <CardTitle>ASA 分级分布</CardTitle>
                <CardDescription>按风险等级快速查看患者结构。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                {statistics.asaDistribution.map((item) => {
                  const percent = Math.round((item.value / Math.max(1, statistics.total)) * 100)
                  return (
                    <div key={item.name} className="admin-asa-row">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm font-bold">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${getAsaChartTone(item.name).badge}`}>
                          ASA {item.name}
                        </span>
                        <span className="text-xs font-black text-[#74655d]">{item.value} 人 · {percent}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#f2e4d8]">
                        <div className={`h-full rounded-full ${getAsaChartTone(item.name).bar}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="admin-chart-card">
              <CardHeader>
                <CardTitle>每日评估趋势</CardTitle>
                <CardDescription>按检查日期统计提交数量。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2.5">
                {statistics.dailyTrend.map((item) => (
                  <div key={item.date} className="admin-trend-row grid grid-cols-[5.2rem_1fr_1.6rem] items-center gap-2">
                    <span className="truncate text-xs font-black text-[#74655d]">{item.date.slice(5)}</span>
                    <div className="h-7 overflow-hidden rounded-md bg-[#f2e4d8]">
                      <div
                        className="h-full rounded-md bg-[#2d8974]"
                        style={{ width: `${Math.min(100, Math.max(12, item.count * 22))}%` }}
                      />
                    </div>
                    <span className="text-right text-sm font-black text-[#2f2825]">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === 'manage' ? (
        <div className="admin-page">
          <Card className="ops-card">
            <CardHeader>
              <CardTitle>搜索患者</CardTitle>
              <CardDescription>输入姓名、日期或性别筛选评估记录。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="admin-search-row grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="例如 李女士 / 2026-06-07" />
                <Button variant="outline">
                  <Search data-icon="inline-start" />
                  搜索
                </Button>
              </div>
              {searchResults.length ? (
                <div className="assessment-record-grid mt-4">
                  {searchResults.map((record) => (
                    <AssessmentPatientCard key={record.id} record={record} onClick={() => setSelectedRecord(record)} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm font-bold text-[#817269]">输入关键词后显示搜索结果。</p>
              )}
            </CardContent>
          </Card>

          <Card className="ops-card">
            <CardHeader>
              <CardTitle>导出数据</CardTitle>
              <CardDescription>静态 Demo 使用 CSV，电脑可用 Excel/WPS 打开。</CardDescription>
            </CardHeader>
            <CardContent className="admin-export-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-2 text-sm font-black text-[#5f514c]">
                开始日期
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#5f514c]">
                结束日期
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
              <div className="flex items-end">
                <Button className="w-full" onClick={() => downloadAssessmentCsv(records, startDate, endDate)}>
                  <Download data-icon="inline-start" />
                  导出 CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedRecord ? (
        <div className="assessment-record-modal">
          <div className="assessment-record-dialog">
            <div className="assessment-record-dialog-head">
              <div>
                <p>患者详情</p>
                <h2>{selectedRecord.name || '未命名患者'}的麻醉评估报告</h2>
              </div>
              <button type="button" onClick={() => setSelectedRecord(null)} aria-label="关闭详情">
                <X />
              </button>
            </div>
            <AssessmentReportView assessment={selectedRecord} compact />
          </div>
        </div>
      ) : null}
    </>
  )
}

function AssessmentTabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-md text-sm font-black transition ${
        active ? 'bg-[#ef705c] text-white shadow' : 'text-[#74655d] hover:bg-[#fff4ef]'
      }`}
    >
      {label}
    </button>
  )
}

function StatsSummary({ statistics }: { statistics: AssessmentStatistics }) {
  const total = Math.max(1, statistics.total)
  const abnormalRate = Math.round((statistics.abnormalCount / total) * 100)
  const preRate = Math.round((statistics.preAssessment / total) * 100)
  const normalRate = Math.round((statistics.normalCount / total) * 100)

  return (
    <section className="admin-stats-summary">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black text-[#2d8974]">数据统计</p>
          <h2 className="mt-1 text-xl font-black leading-7 text-[#2f2825]">评估概览</h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#817269]">用于快速判断当天和近期评估压力。</p>
        </div>
        <div className="admin-risk-ring shrink-0">
          <span>异常占比</span>
          <strong>{abnormalRate}%</strong>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <SummaryPill label="预评估" value={`${preRate}%`} />
        <SummaryPill label="正常" value={`${normalRate}%`} />
        <SummaryPill label="总量" value={`${statistics.total}`} />
      </div>
    </section>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#f0ded0] bg-white/80 px-2.5 py-2 text-center">
      <p className="text-[11px] font-black text-[#817269]">{label}</p>
      <p className="mt-0.5 text-base font-black text-[#2f2825]">{value}</p>
    </div>
  )
}

function AssessmentMetric({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint: string
  tone: 'total' | 'pre' | 'abnormal' | 'normal'
}) {
  const toneClass = {
    total: 'admin-stat-card-total',
    pre: 'admin-stat-card-pre',
    abnormal: 'admin-stat-card-abnormal',
    normal: 'admin-stat-card-normal',
  }[tone]

  return (
    <section className={`admin-stat-card ${toneClass}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-black leading-4 text-[#5f514c]">{label}</p>
        <span className="admin-stat-dot" aria-hidden="true" />
      </div>
      <p className="mt-1 text-[26px] font-black leading-none text-[#111827]">{value}</p>
      <p className="mt-2 truncate text-[11px] font-bold text-[#817269]">{hint}</p>
    </section>
  )
}

function AssessmentPatientCard({ record, onClick }: { record: AssessmentRecord; onClick: () => void }) {
  const tone = getAsaTone(record.asa_class)
  const issues = getAssessmentIssues(record)

  return (
    <button type="button" onClick={onClick} className={`assessment-record-card ${tone.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3>{record.name || '未命名患者'} · {record.age || '-'}岁</h3>
          <p>{record.gender === 'male' ? '男' : record.gender === 'female' ? '女' : '-'} · {record.assessment_date}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge className={tone.badge}>{record.asa_class || '-'}</Badge>
          {record.is_pre_assessment ? <Badge className="border-sky-300 bg-sky-100 text-sky-800">预评估</Badge> : null}
        </div>
      </div>
      <p className="assessment-record-issues">{issues.length ? issues.join('，') : '未见明显异常'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline">BMI {record.bmi || '-'}</Badge>
        <Badge variant="outline">填写 {record.created_at || '-'}</Badge>
      </div>
    </button>
  )
}

function formatAssessmentDateTitle(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
}

function getAsaChartTone(name: string) {
  switch (name) {
    case 'Ⅰ':
      return { badge: 'border-emerald-200 bg-emerald-50 text-emerald-800', bar: 'bg-emerald-500' }
    case 'Ⅱ':
      return { badge: 'border-amber-200 bg-amber-50 text-amber-800', bar: 'bg-amber-500' }
    case 'Ⅲ':
      return { badge: 'border-orange-200 bg-orange-50 text-orange-800', bar: 'bg-orange-500' }
    case 'Ⅳ':
      return { badge: 'border-red-200 bg-red-50 text-red-800', bar: 'bg-red-500' }
    default:
      return { badge: 'border-slate-200 bg-slate-50 text-slate-800', bar: 'bg-slate-500' }
  }
}

function AdminTemplates() {
  return (
    <>
      <AdminHeader title="流程模板配置" desc="节点进度是模板配置项，与单个用户无关；按检查项目和预计手术时间自动生成。" />
      <Card className="ops-card">
        <CardHeader>
          <CardTitle>检查项目模板</CardTitle>
          <CardDescription>支持单独胃镜、单独肠镜、胃肠镜、无痛胃肠镜等不同规则。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模板名称</TableHead>
                <TableHead>检查项目</TableHead>
                <TableHead>预计手术时间</TableHead>
                <TableHead>节点数</TableHead>
                <TableHead>节点时间规则</TableHead>
                <TableHead>关键节点</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templateRows.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.project}</TableCell>
                  <TableCell>{row.surgeryTime}</TableCell>
                  <TableCell>{row.nodeCount}</TableCell>
                  <TableCell>{row.rule}</TableCell>
                  <TableCell>{row.keyNodes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="admin-two-col">
        <Card className="ops-card">
          <CardHeader>
            <CardTitle>单独胃镜 · 09:00</CardTitle>
            <CardDescription>按 09:00 检查生成</CardDescription>
          </CardHeader>
          <CardContent className="template-preview">
            <InfoLine label="前一天 22:00" value="饮食注意" />
            <InfoLine label="当天 03:00" value="严格禁食禁水" />
            <InfoLine label="当天 08:30" value="到院报到" />
          </CardContent>
        </Card>
        <Card className="ops-card">
          <CardHeader>
            <CardTitle>单独胃镜 · 10:00</CardTitle>
            <CardDescription>同一项目，不同预计手术时间</CardDescription>
          </CardHeader>
          <CardContent className="template-preview">
            <InfoLine label="前一天 22:00" value="饮食注意" />
            <InfoLine label="当天 04:00" value="严格禁食禁水" />
            <InfoLine label="当天 09:30" value="到院报到" />
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AdminContent() {
  return (
    <>
      <AdminHeader title="内容与引导配置" desc="配置每个模板节点的小程序步骤、注意事项和异常处理建议。" />
      <div className="admin-two-col">
        <Card className="ops-card">
          <CardHeader>
            <CardTitle>节点内容</CardTitle>
            <CardDescription>以“严格禁食禁水”为例。</CardDescription>
          </CardHeader>
          <CardContent className="config-form">
            <InfoLine label="节点标题" value="严格禁食禁水" />
            <InfoLine label="节点类型" value="关键准备事项" />
            <InfoLine label="是否需确认" value="需要用户确认完成" />
            <Textarea value={'1. 不吃任何食物\n2. 不喝水、牛奶、饮料或含糖液体\n3. 如需服药，按工作人员单独说明执行'} readOnly />
            <Button>
              <FileCheck2 data-icon="inline-start" />
              保存节点内容
            </Button>
          </CardContent>
        </Card>
        <Card className="ops-card">
          <CardHeader>
            <CardTitle>小程序预览</CardTitle>
            <CardDescription>配置后同步到节点详情页。</CardDescription>
          </CardHeader>
          <CardContent className="content-preview">
            <img src={fastingImage} alt="" />
            <strong>严格禁食禁水</strong>
            <p>从这个节点开始，不再进食或饮水。</p>
            <Badge variant="secondary">关键节点</Badge>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function AdminTouch() {
  return (
    <>
      <AdminHeader title="触达与处理记录" desc="提醒只是辅助亮点，同时支持电话问询、短信引导和现场人工处理。" />
      <div className="metric-grid four">
        <MetricCard label="电话问询" value="9" tone="rose" icon={PhoneCall} />
        <MetricCard label="短信引导" value="24" tone="blue" icon={MessageSquareText} />
        <MetricCard label="小程序已读" value="91" tone="mint" icon={BadgeCheck} />
        <MetricCard label="评估链接推送" value="37" tone="cream" icon={Bell} />
      </div>
      <Card className="ops-card">
        <CardHeader>
          <CardTitle>处理记录</CardTitle>
          <CardDescription>评估未提交前持续推送链接和原因；提交后自动停止推送。</CardDescription>
        </CardHeader>
        <CardContent className="compact-list">
          {[
            ['陈先生', '04:20 电话问询', '确认禁食状态，继续观察'],
            ['王女士', '08:10 短信引导', '提醒 13:30 预计到院安排'],
            ['李女士', '07:30 麻醉评估提醒', '为什么要填麻醉评估 · /#assessment'],
            ['赵先生', '08:42 现场处理', '材料人工补录'],
          ].map(([name, time, result]) => (
            <div key={`${name}-${time}`}>
              <span>
                <strong>{name}</strong>
                <em>{time}</em>
              </span>
              <StatusPill label={result} />
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  )
}

function AdminAccount() {
  return (
    <>
      <AdminHeader title="账号与权限" desc="管理账号、角色权限和所属机构。" />
      <Card className="ops-card account-card">
        <CardHeader>
          <CardTitle>当前登录账号</CardTitle>
          <CardDescription>operator@hospital.cn · 运营管理员</CardDescription>
        </CardHeader>
        <CardContent className="detail-stack">
          <InfoLine label="所属机构" value="XX医院 · 内镜中心" />
          <InfoLine label="角色权限" value="接诊管理、模板配置、内容配置、触达记录" />
          <InfoLine label="最近登录" value="今天 09:12" />
          <Button>
            <ShieldCheck data-icon="inline-start" />
            保存权限设置
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

function AdminHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <header className="admin-section-head">
      <div>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
    </header>
  )
}

function AdminNavButton({
  page,
  current,
  setPage,
  icon: Icon,
  label,
}: {
  page: AdminPage
  current: AdminPage
  setPage: (page: AdminPage) => void
  icon: LucideIcon
  label: string
}) {
  return (
    <button className={current === page ? 'active' : ''} onClick={() => setPage(page)}>
      <Icon />
      <span>{label}</span>
    </button>
  )
}

function MetricCard({ label, value, tone, icon: Icon }: { label: string; value: string; tone: string; icon: LucideIcon }) {
  return (
    <Card className={`metric-card tone-${tone}`}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardAction><Icon /></CardAction>
      </CardHeader>
      <CardContent>
        <strong>{value}</strong>
      </CardContent>
    </Card>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  const tone = label.includes('需') || label.includes('未') || label.includes('电话')
    ? 'rose'
    : label.includes('短信') || label.includes('待')
      ? 'blue'
      : label.includes('无') || label.includes('已') || label.includes('完成')
        ? 'mint'
        : 'amber'
  return <span className={`status-pill tone-${tone}`}>{label}</span>
}

function statusLabel(status: NodeStatus) {
  if (status === 'done') return '已完成'
  if (status === 'current') return '进行中'
  if (status === 'late') return '需处理'
  return '待开始'
}

function miniTitle(page: MiniRootPage, homeMode: HomeMode, profileMode: ProfileMode) {
  if (page === 'home' && homeMode === 'detail') return '事项详情'
  if (page === 'profile' && profileMode === 'assessmentReport') return '麻醉评估报告'
  const titles: Record<MiniRootPage, string> = {
    home: '我的检查准备',
    assessment: '麻醉评估',
    profile: '我的信息',
  }
  return titles[page]
}

function readRoute(): RouteView {
  const raw = window.location.hash.replace('#/', '').replace('#', '')
  if (raw === 'admin') return 'admin'
  if (raw === 'mini') return 'mini'
  if (raw === 'assessment') return 'assessment'
  return window.innerWidth < 760 ? 'mini' : 'admin'
}

export default App
