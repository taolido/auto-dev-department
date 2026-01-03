'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Code,
  GitBranch,
  GitPullRequest,
  Bot,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Play,
  FileCode,
  ArrowLeft,
  X,
  Eye,
  Copy,
  Check,
  Download,
} from 'lucide-react'
import { developmentsAPI, requirementsAPI, Development, Requirement, GitHubStatus, getErrorMessage, APIError } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { ProcessingOverlay } from '@/components/ui/processing-overlay'
import { useProject } from '@/contexts/project-context'

const statusConfig = {
  designing: {
    label: '設計中',
    icon: Bot,
    className: 'bg-purple-100 text-purple-700',
    progress: 20,
  },
  coding: {
    label: 'コード生成中',
    icon: Code,
    className: 'bg-blue-100 text-blue-700',
    progress: 50,
  },
  testing: {
    label: 'テスト中',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700',
    progress: 75,
  },
  review: {
    label: 'レビュー待ち',
    icon: GitPullRequest,
    className: 'bg-orange-100 text-orange-700',
    progress: 90,
  },
  merged: {
    label: '完了',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700',
    progress: 100,
  },
  failed: {
    label: '失敗',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-700',
    progress: 0,
  },
}

const agentColors: Record<string, string> = {
  system: 'text-gray-500',
  tech_lead: 'text-purple-600',
  coder: 'text-blue-600',
  tester: 'text-green-600',
  pm: 'text-orange-600',
}

const agentLabels: Record<string, string> = {
  system: 'システム',
  tech_lead: 'テックリード',
  coder: 'コーダー',
  tester: 'テスター',
  pm: 'PM',
}

export default function DevelopmentsPage() {
  const router = useRouter()
  const toast = useToast()
  const { currentProject } = useProject()
  const [developments, setDevelopments] = useState<Development[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [selectedDev, setSelectedDev] = useState<Development | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [selectedReqId, setSelectedReqId] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null)
  const [isCreatingPR, setIsCreatingPR] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ path: string; content: string; language: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    if (!currentProject) return

    try {
      const [devsData, reqsData] = await Promise.all([
        developmentsAPI.list(currentProject.id),
        requirementsAPI.list(currentProject.id),
      ])
      setDevelopments(devsData)
      setRequirements(reqsData.filter(r => r.status === 'approved'))

      // 選択中のdevを更新
      if (selectedDev) {
        const updated = devsData.find(d => d.id === selectedDev.id)
        if (updated) {
          setSelectedDev(updated)
        }
      } else if (devsData.length > 0) {
        setSelectedDev(devsData[0])
      }
    } catch (err) {
      console.error('Failed to load developments:', err)
      setError(`データの読み込みに失敗しました: ${getErrorMessage(err)}`)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDev, currentProject])

  useEffect(() => {
    loadData()
    // GitHub設定状態を取得
    developmentsAPI.getGitHubStatus()
      .then(setGithubStatus)
      .catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 自動更新 (5秒間隔)
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadData()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, loadData])

  const handleStartDevelopment = async () => {
    if (!selectedReqId || !currentProject) return

    setIsStarting(true)
    setError(null)

    try {
      const result = await developmentsAPI.start(selectedReqId, currentProject.id)
      // 新しい開発の詳細を取得
      const newDev = await developmentsAPI.get(result.development_id)
      setDevelopments(prev => [newDev, ...prev])
      setSelectedDev(newDev)
      setSelectedReqId('')
      toast.success('開発を開始しました', 'AIエージェントが自動的にコードを生成します')
    } catch (err) {
      console.error('Failed to start development:', err)
      toast.error('開発の開始に失敗しました', getErrorMessage(err))
    } finally {
      setIsStarting(false)
    }
  }

  const handleCreatePR = async () => {
    if (!selectedDev) return

    setIsCreatingPR(true)
    setError(null)

    try {
      const result = await developmentsAPI.createPR(selectedDev.id)
      // 開発情報を再取得
      const updatedDev = await developmentsAPI.get(selectedDev.id)
      setSelectedDev(updatedDev)
      setDevelopments(prev => prev.map(d => d.id === updatedDev.id ? updatedDev : d))

      toast.success('PRを作成しました', 'GitHubでPRを確認してください')

      // PRのURLを新しいタブで開く
      if (result.pr_url) {
        window.open(result.pr_url, '_blank')
      }
    } catch (err) {
      console.error('Failed to create PR:', err)
      if (err instanceof APIError && err.errorCode === 'CONFIGURATION_ERROR') {
        toast.error('設定が必要です', 'GitHub APIの設定が必要です。.envファイルでGITHUB_TOKENとGITHUB_REPOを設定してください。')
      } else {
        toast.error('PRの作成に失敗しました', getErrorMessage(err))
      }
    } finally {
      setIsCreatingPR(false)
    }
  }

  const handleCopyCode = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('コピーしました')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('コピーに失敗しました')
    }
  }

  // 承認済み要件で、まだ開発が始まっていないもの
  const availableRequirements = requirements.filter(
    req => !developments.some(dev => dev.requirement_id === req.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/requirements')}
              className="rounded-lg p-1 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">開発進捗</h1>
          </div>
          <p className="text-muted-foreground">
            AIエージェントによる自動開発の進捗を確認できます
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自動更新
          </label>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            更新
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* 新規開発開始セクション */}
      {availableRequirements.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <Play className="h-5 w-5 text-primary" />
            開発を開始
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            承認済みの要件定義から開発を開始できます
          </p>
          <div className="mt-3 flex items-center gap-3">
            <select
              value={selectedReqId}
              onChange={(e) => setSelectedReqId(e.target.value)}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">要件定義を選択...</option>
              {availableRequirements.map(req => (
                <option key={req.id} value={req.id}>
                  {req.title}
                </option>
              ))}
            </select>
            <button
              onClick={handleStartDevelopment}
              disabled={!selectedReqId || isStarting}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              開始
            </button>
          </div>
        </div>
      )}

      {isLoading && developments.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border bg-card p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 開発リスト */}
          <div className="space-y-3">
            {developments.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <Code className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-2 text-muted-foreground">開発中の項目がありません</p>
                <p className="text-sm text-muted-foreground">
                  要件定義を承認して開発を開始してください
                </p>
                <button
                  onClick={() => router.push('/requirements')}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  要件定義へ
                </button>
              </div>
            ) : (
              developments.map((dev) => {
                const config = statusConfig[dev.status]
                const StatusIcon = config.icon
                const req = requirements.find(r => r.id === dev.requirement_id)

                return (
                  <button
                    key={dev.id}
                    onClick={() => setSelectedDev(dev)}
                    className={`w-full rounded-lg border bg-card p-4 text-left transition-all ${
                      selectedDev?.id === dev.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      {dev.status !== 'merged' && dev.status !== 'failed' && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="mt-2 font-medium line-clamp-2">
                      {req?.title || '要件定義'}
                    </h3>
                    {dev.github_branch && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <GitBranch className="h-3 w-3" />
                        {dev.github_branch}
                      </p>
                    )}
                    {/* 進捗バー */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          dev.status === 'failed' ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ width: `${config.progress}%` }}
                      />
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* 詳細ビュー */}
          <div className="lg:col-span-2">
            {selectedDev ? (
              <div className="space-y-4">
                {/* ステータスカード */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold">
                        {requirements.find(r => r.id === selectedDev.requirement_id)?.title || '開発タスク'}
                      </h2>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        {selectedDev.github_branch && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-4 w-4" />
                            {selectedDev.github_branch}
                          </span>
                        )}
                        {selectedDev.github_pr_url && (
                          <a
                            href={selectedDev.github_pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <GitPullRequest className="h-4 w-4" />
                            PR を開く
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* PR作成ボタン */}
                      {selectedDev.status === 'review' && !selectedDev.github_pr_url && githubStatus?.configured && (
                        <button
                          onClick={handleCreatePR}
                          disabled={isCreatingPR}
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreatingPR ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              PR作成中...
                            </>
                          ) : (
                            <>
                              <GitPullRequest className="h-4 w-4" />
                              PRを作成
                            </>
                          )}
                        </button>
                      )}
                      {/* GitHub未設定の警告 */}
                      {selectedDev.status === 'review' && !selectedDev.github_pr_url && githubStatus && !githubStatus.configured && (
                        <span className="text-sm text-yellow-600">
                          GitHub連携未設定
                        </span>
                      )}
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          statusConfig[selectedDev.status].className
                        }`}
                      >
                        {statusConfig[selectedDev.status].label}
                      </div>
                    </div>
                  </div>

                  {/* リトライ情報 */}
                  {selectedDev.retry_count > 0 && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      リトライ: {selectedDev.retry_count} / {selectedDev.max_retries}
                    </div>
                  )}
                </div>

                {/* 生成ファイル */}
                {selectedDev.generated_files.length > 0 && (
                  <div className="rounded-lg border bg-card">
                    <div className="flex items-center justify-between border-b p-4">
                      <h3 className="flex items-center gap-2 font-semibold">
                        <FileCode className="h-5 w-5" />
                        生成ファイル ({selectedDev.generated_files.length})
                      </h3>
                      <button
                        onClick={() => developmentsAPI.downloadZip(selectedDev.id)}
                        className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                      >
                        <Download className="h-4 w-4" />
                        ZIPダウンロード
                      </button>
                    </div>
                    <div className="max-h-[250px] overflow-auto p-4">
                      <div className="space-y-2">
                        {selectedDev.generated_files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg border p-2 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <Code className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono">{file.path}</span>
                              <span className="text-xs text-muted-foreground">
                                ({file.language})
                              </span>
                            </div>
                            <button
                              onClick={() => setPreviewFile(file)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
                            >
                              <Eye className="h-3 w-3" />
                              プレビュー
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* エージェントログ */}
                <div className="rounded-lg border bg-card">
                  <div className="border-b p-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Bot className="h-5 w-5" />
                      エージェント動作ログ
                    </h3>
                  </div>
                  <div className="max-h-[400px] overflow-auto p-4">
                    {selectedDev.agent_logs.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground">
                        ログがありません
                      </p>
                    ) : (
                      <div className="space-y-2 font-mono text-sm">
                        {selectedDev.agent_logs.map((log, index) => (
                          <div key={index} className="flex gap-3">
                            <span className="shrink-0 text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString('ja-JP')}
                            </span>
                            <span
                              className={`shrink-0 font-medium ${
                                agentColors[log.agent] || 'text-foreground'
                              }`}
                            >
                              [{agentLabels[log.agent] || log.agent}]
                            </span>
                            <span
                              className={
                                log.level === 'error'
                                  ? 'text-red-600'
                                  : log.level === 'warning'
                                  ? 'text-yellow-600'
                                  : ''
                              }
                            >
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* テスト結果 */}
                {selectedDev.test_results && (
                  <div className="rounded-lg border bg-card">
                    <div className="border-b p-4">
                      <h3 className="font-semibold">テスト結果</h3>
                    </div>
                    <div className="p-4">
                      <pre className="overflow-auto rounded bg-muted p-3 text-sm">
                        {selectedDev.test_results}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border bg-card p-8">
                <div className="text-center">
                  <Code className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">
                    開発項目を選択してください
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* コードプレビューモーダル */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-background shadow-xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                <span className="font-mono text-sm">{previewFile.path}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs">
                  {previewFile.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(previewFile.content)}
                  className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      コピー
                    </>
                  )}
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="rounded-lg p-1.5 transition-colors hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* コード表示 */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="rounded-lg bg-muted p-4 text-sm">
                <code>{previewFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
