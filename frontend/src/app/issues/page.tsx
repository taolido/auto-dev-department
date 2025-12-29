'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lightbulb,
  Filter,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { issuesAPI, requirementsAPI, Issue } from '@/lib/api'

const painLevelConfig = {
  high: {
    label: '高',
    icon: AlertTriangle,
    className: 'bg-red-100 text-red-700',
  },
  medium: {
    label: '中',
    icon: AlertCircle,
    className: 'bg-yellow-100 text-yellow-700',
  },
  low: {
    label: '低',
    icon: Info,
    className: 'bg-blue-100 text-blue-700',
  },
}

export default function IssuesPage() {
  const router = useRouter()
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterPainLevel, setFilterPainLevel] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  const loadIssues = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filters = filterPainLevel !== 'all' ? { pain_level: filterPainLevel } : undefined
      const data = await issuesAPI.list('default', filters)
      setIssues(data)
    } catch (err) {
      console.error('Failed to load issues:', err)
      setError('課題の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [filterPainLevel])

  useEffect(() => {
    loadIssues()
  }, [loadIssues])

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleGenerateRequirements = async () => {
    if (selectedIds.size === 0) return

    setError(null)
    try {
      const ids = Array.from(selectedIds)

      // 選択された課題のステータスを更新
      for (const id of ids) {
        await issuesAPI.select(id)
      }

      // 要件定義を生成
      const result = await requirementsAPI.generate(ids)

      // 要件定義ページへ遷移（生成されたIDを渡す）
      router.push(`/requirements?id=${result.requirement_id}`)
    } catch (err) {
      console.error('Failed to generate requirements:', err)
      setError('要件定義の生成に失敗しました')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">課題リスト</h1>
          <p className="text-muted-foreground">
            AIが抽出した課題から、解決したいものを選択してください
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadIssues}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            更新
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleGenerateRequirements}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              要件定義を生成 ({selectedIds.size}件)
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* フィルター */}
      <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <div className="flex gap-2">
          <button
            onClick={() => setFilterPainLevel('all')}
            className={`rounded-lg px-3 py-1 text-sm ${
              filterPainLevel === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            すべて ({issues.length})
          </button>
          <button
            onClick={() => setFilterPainLevel('high')}
            className={`rounded-lg px-3 py-1 text-sm ${
              filterPainLevel === 'high'
                ? 'bg-red-600 text-white'
                : 'bg-red-100 text-red-700'
            }`}
          >
            高
          </button>
          <button
            onClick={() => setFilterPainLevel('medium')}
            className={`rounded-lg px-3 py-1 text-sm ${
              filterPainLevel === 'medium'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            中
          </button>
          <button
            onClick={() => setFilterPainLevel('low')}
            className={`rounded-lg px-3 py-1 text-sm ${
              filterPainLevel === 'low'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            低
          </button>
        </div>
      </div>

      {/* 課題リスト */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border bg-card p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">課題がありません</p>
          <p className="text-sm text-muted-foreground">
            ログを取り込むと、AIが課題を抽出します
          </p>
          <button
            onClick={() => router.push('/sources')}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            ログ取込ページへ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const painConfig = painLevelConfig[issue.pain_level]
            const PainIcon = painConfig.icon
            const isSelected = selectedIds.has(issue.id)

            return (
              <div
                key={issue.id}
                onClick={() => toggleSelect(issue.id)}
                className={`cursor-pointer rounded-lg border bg-card p-4 transition-all ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(issue.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${painConfig.className}`}
                      >
                        <PainIcon className="h-3 w-3" />
                        {painConfig.label}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {issue.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {issue.source_label}
                      </span>
                      {issue.status !== 'new' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          {issue.status}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-medium">{issue.title}</h3>
                    <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">
                          技術アプローチ:
                        </span>{' '}
                        {issue.tech_approach}
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          期待される成果:
                        </span>{' '}
                        {issue.expected_outcome}
                      </div>
                    </div>
                    {issue.original_context && (
                      <div className="mt-2 rounded-lg bg-muted/50 p-2 text-sm text-muted-foreground">
                        <span className="font-medium">元の会話:</span> {issue.original_context}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
