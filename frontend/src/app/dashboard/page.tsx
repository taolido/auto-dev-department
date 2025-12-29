'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import {
  BarChart3,
  PieChartIcon,
  ArrowUpDown,
  Filter,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Activity,
  Zap,
  FileText,
  Target,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { issuesAPI, requirementsAPI, sourcesAPI, Issue, Requirement, Source } from '@/lib/api'

// カラーパレット（モダンなグラデーション対応）
const COLORS = {
  category: ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F97316', '#EAB308'],
  painLevel: { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' },
  status: {
    new: '#94A3B8',
    selected: '#6366F1',
    in_progress: '#F59E0B',
    done: '#22C55E',
    archived: '#64748B',
    draft: '#94A3B8',
    review: '#F59E0B',
    approved: '#22C55E',
    rejected: '#EF4444',
  },
  gradient: {
    primary: ['#6366F1', '#8B5CF6'],
    success: ['#22C55E', '#16A34A'],
    warning: ['#F59E0B', '#D97706'],
    danger: ['#EF4444', '#DC2626'],
  },
}

type SortKey = 'title' | 'category' | 'pain_level' | 'status' | 'created_at'
type SortOrder = 'asc' | 'desc'

export default function DashboardPage() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // ソート状態
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // フィルター状態
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPainLevel, setFilterPainLevel] = useState<string>('all')

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setError(null)
    try {
      const [issuesData, requirementsData, sourcesData] = await Promise.all([
        issuesAPI.list(),
        requirementsAPI.list(),
        sourcesAPI.list(),
      ])
      setIssues(issuesData)
      setRequirements(requirementsData)
      setSources(sourcesData)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初回ロード
  useEffect(() => {
    loadData()
  }, [loadData])

  // リアルタイム更新（10秒ごと）
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      loadData(false)
    }, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadData])

  // カテゴリ別集計
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {}
    issues.forEach((issue) => {
      counts[issue.category] = (counts[issue.category] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [issues])

  // 重要度別集計
  const painLevelData = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }
    issues.forEach((issue) => {
      counts[issue.pain_level]++
    })
    return [
      { name: '高優先', value: counts.high, color: COLORS.painLevel.high },
      { name: '中優先', value: counts.medium, color: COLORS.painLevel.medium },
      { name: '低優先', value: counts.low, color: COLORS.painLevel.low },
    ].filter((d) => d.value > 0)
  }, [issues])

  // ソース別集計
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {}
    issues.forEach((issue) => {
      const label = issue.source_label || 'Unknown'
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value, fullName: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [issues])

  // 時系列データ（直近7日間）
  const timeSeriesData = useMemo(() => {
    const days = 7
    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const issueCount = issues.filter((issue) => {
        const issueDate = new Date(issue.created_at).toISOString().split('T')[0]
        return issueDate === dateStr
      }).length

      const reqCount = requirements.filter((req) => {
        const reqDate = new Date(req.created_at).toISOString().split('T')[0]
        return reqDate === dateStr
      }).length

      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        課題: issueCount,
        要件定義: reqCount,
      })
    }
    return data
  }, [issues, requirements])

  // 課題ステータス別集計
  const issueStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    issues.forEach((issue) => {
      counts[issue.status] = (counts[issue.status] || 0) + 1
    })
    const statusLabels: Record<string, string> = {
      new: '新規',
      selected: '選択済',
      in_progress: '進行中',
      done: '完了',
      archived: 'アーカイブ',
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: statusLabels[key] || key,
      value,
      color: COLORS.status[key as keyof typeof COLORS.status] || '#94A3B8',
    }))
  }, [issues])

  // 要件定義ステータス別集計
  const requirementStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    requirements.forEach((req) => {
      counts[req.status] = (counts[req.status] || 0) + 1
    })
    const statusLabels: Record<string, string> = {
      draft: 'ドラフト',
      review: 'レビュー中',
      approved: '承認済み',
      rejected: '却下',
    }
    return Object.entries(counts).map(([key, value]) => ({
      name: statusLabels[key] || key,
      value,
      color: COLORS.status[key as keyof typeof COLORS.status] || '#94A3B8',
    }))
  }, [requirements])

  // カテゴリ一覧
  const categories = useMemo(() => {
    const cats = new Set(issues.map((i) => i.category))
    return Array.from(cats)
  }, [issues])

  // フィルタリング・ソート済み課題
  const filteredIssues = useMemo(() => {
    let result = [...issues]

    if (filterCategory !== 'all') {
      result = result.filter((i) => i.category === filterCategory)
    }
    if (filterPainLevel !== 'all') {
      result = result.filter((i) => i.pain_level === filterPainLevel)
    }

    result.sort((a, b) => {
      let comparison = 0
      switch (sortKey) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'pain_level':
          const painOrder = { high: 0, medium: 1, low: 2 }
          comparison = painOrder[a.pain_level] - painOrder[b.pain_level]
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [issues, filterCategory, filterPainLevel, sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  // CSVエクスポート
  const exportToCSV = () => {
    const headers = ['タイトル', 'カテゴリ', '重要度', 'ステータス', 'ソース', '作成日']
    const rows = filteredIssues.map((issue) => [
      issue.title,
      issue.category,
      issue.pain_level,
      issue.status,
      issue.source_label,
      new Date(issue.created_at).toLocaleDateString('ja-JP'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `issues_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const painLevelLabel = { high: '高', medium: '中', low: '低' }
  const painLevelClass = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
  }

  // 前日比計算
  const todayIssues = issues.filter((i) => {
    const today = new Date().toISOString().split('T')[0]
    return new Date(i.created_at).toISOString().split('T')[0] === today
  }).length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <Zap className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground">データを読み込んでいます...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <BarChart3 className="h-6 w-6" />
            </div>
            ダッシュボード
          </h1>
          <p className="text-muted-foreground mt-1">
            課題と要件定義のリアルタイム分析
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span>
                {autoRefresh ? 'リアルタイム更新中' : '更新停止中'}
              </span>
            </div>
          )}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              autoRefresh
                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Activity className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            更新
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-500">
          {error}
        </div>
      )}

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="総課題数"
          value={issues.length}
          trend={todayIssues > 0 ? `+${todayIssues} 今日` : undefined}
          trendUp={todayIssues > 0}
          gradient="from-indigo-500 to-purple-600"
        />
        <GlassCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="高優先度"
          value={issues.filter((i) => i.pain_level === 'high').length}
          subValue={`${issues.length > 0 ? Math.round((issues.filter((i) => i.pain_level === 'high').length / issues.length) * 100) : 0}%`}
          gradient="from-red-500 to-orange-600"
        />
        <GlassCard
          icon={<Clock className="h-5 w-5" />}
          label="要件定義中"
          value={requirements.filter((r) => r.status === 'draft' || r.status === 'review').length}
          gradient="from-amber-500 to-yellow-600"
        />
        <GlassCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="承認済み"
          value={requirements.filter((r) => r.status === 'approved').length}
          subValue={`${requirements.length > 0 ? Math.round((requirements.filter((r) => r.status === 'approved').length / requirements.length) * 100) : 0}%`}
          gradient="from-green-500 to-emerald-600"
        />
      </div>

      {/* グラフセクション - 上段 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 時系列グラフ */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-xl">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            直近7日間の推移
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.9)',
                  border: '1px solid rgba(75, 85, 99, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
              />
              <Area
                type="monotone"
                dataKey="課題"
                stroke="#6366F1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIssues)"
              />
              <Area
                type="monotone"
                dataKey="要件定義"
                stroke="#22C55E"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorReqs)"
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ソース別分析 */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-xl">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
            ソース別課題数 TOP5
          </h3>
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sourceData} layout="vertical">
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis type="category" dataKey="name" width={100} stroke="#9CA3AF" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    borderRadius: '12px',
                  }}
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              データがありません
            </div>
          )}
        </div>
      </div>

      {/* グラフセクション - 下段 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* カテゴリ別円グラフ */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-xl">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-pink-500/10">
              <PieChartIcon className="h-4 w-4 text-pink-500" />
            </div>
            カテゴリ別
          </h3>
          {categoryData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.category[index % COLORS.category.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS.category[index % COLORS.category.length] }}
                    />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground">
              データがありません
            </div>
          )}
        </div>

        {/* 重要度別円グラフ */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-xl">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            重要度別
          </h3>
          {painLevelData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={painLevelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {painLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {painLevelData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground">
              データがありません
            </div>
          )}
        </div>

        {/* ステータス別 */}
        <div className="rounded-2xl border bg-card/50 backdrop-blur-sm p-6 shadow-xl">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            ステータス別
          </h3>
          {issueStatusData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={issueStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {issueStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                {issueStatusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground">
              データがありません
            </div>
          )}
        </div>
      </div>

      {/* 課題一覧テーブル */}
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </div>
            課題一覧
            <span className="ml-2 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-500">
              {filteredIssues.length}件
            </span>
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">全カテゴリ</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filterPainLevel}
                onChange={(e) => setFilterPainLevel(e.target.value)}
                className="rounded-lg border bg-background px-3 py-1.5 text-sm"
              >
                <option value="all">全重要度</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all"
            >
              <Download className="h-4 w-4" />
              CSV出力
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                {[
                  { key: 'title', label: 'タイトル' },
                  { key: 'category', label: 'カテゴリ' },
                  { key: 'pain_level', label: '重要度' },
                  { key: 'status', label: 'ステータス' },
                  { key: 'created_at', label: '作成日' },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="cursor-pointer px-4 py-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort(col.key as SortKey)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className={`h-4 w-4 ${sortKey === col.key ? 'text-indigo-500' : 'text-muted-foreground'}`} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Target className="h-8 w-8 opacity-50" />
                      <p>課題がありません</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIssues.slice(0, 10).map((issue, index) => (
                  <tr
                    key={issue.id}
                    className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push('/issues')}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{issue.title}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                        {issue.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${painLevelClass[issue.pain_level]}`}
                      >
                        {painLevelLabel[issue.pain_level]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {issue.status}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(issue.created_at).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredIssues.length > 10 && (
          <div className="border-t p-4 text-center">
            <button
              onClick={() => router.push('/issues')}
              className="text-sm text-indigo-500 hover:text-indigo-600 font-medium"
            >
              すべての課題を表示 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function GlassCard({
  icon,
  label,
  value,
  subValue,
  trend,
  trendUp,
  gradient,
}: {
  icon: React.ReactNode
  label: string
  value: number
  subValue?: string
  trend?: string
  trendUp?: boolean
  gradient: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/50 backdrop-blur-sm p-5 shadow-xl group hover:shadow-2xl transition-all duration-300">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {trend}
            </div>
          )}
          {subValue && !trend && (
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
              {subValue}
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold">{value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground mt-1">{label}</p>
        </div>
      </div>
    </div>
  )
}
