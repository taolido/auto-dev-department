'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  FileCode,
  ExternalLink,
  Check,
  Edit,
  Github,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { requirementsAPI, Requirement } from '@/lib/api'
import ReactMarkdown from 'react-markdown'

const statusConfig = {
  draft: { label: 'ドラフト', className: 'bg-gray-100 text-gray-700' },
  review: { label: 'レビュー中', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '承認済み', className: 'bg-green-100 text-green-700' },
  rejected: { label: '却下', className: 'bg-red-100 text-red-700' },
}

export default function RequirementsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetId = searchParams.get('id')

  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isCreatingIssue, setIsCreatingIssue] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadRequirements = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await requirementsAPI.list()
      setRequirements(data)

      // URLパラメータで指定されたIDがあれば選択
      if (targetId) {
        const target = data.find((r) => r.id === targetId)
        if (target) {
          setSelectedReq(target)
          setIsGenerating(false)
        } else {
          // まだ生成中かもしれないので、ポーリング
          setIsGenerating(true)
        }
      } else if (data.length > 0 && !selectedReq) {
        setSelectedReq(data[0])
      }
    } catch (err) {
      console.error('Failed to load requirements:', err)
      setError('要件定義の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [targetId, selectedReq])

  // 初回ロード
  useEffect(() => {
    loadRequirements()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 生成中の場合はポーリング
  useEffect(() => {
    if (!isGenerating || !targetId) return

    const interval = setInterval(async () => {
      try {
        const data = await requirementsAPI.list()
        const target = data.find((r) => r.id === targetId)
        if (target) {
          setRequirements(data)
          setSelectedReq(target)
          setIsGenerating(false)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isGenerating, targetId])

  const handleApprove = async () => {
    if (!selectedReq) return
    setIsApproving(true)
    try {
      const updated = await requirementsAPI.approve(selectedReq.id)
      setSelectedReq(updated)
      setRequirements((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )
    } catch (err) {
      console.error('Failed to approve:', err)
      setError('承認に失敗しました')
    } finally {
      setIsApproving(false)
    }
  }

  const handleCreateGithubIssue = async () => {
    if (!selectedReq) return
    setIsCreatingIssue(true)
    try {
      const result = await requirementsAPI.createGithubIssue(selectedReq.id)
      setSelectedReq({
        ...selectedReq,
        github_issue_url: result.github_issue_url,
      })
      setRequirements((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id
            ? { ...r, github_issue_url: result.github_issue_url }
            : r
        )
      )
    } catch (err) {
      console.error('Failed to create GitHub issue:', err)
      setError('GitHub Issue作成に失敗しました')
    } finally {
      setIsCreatingIssue(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedReq) return
    if (!confirm('この要件定義書を削除しますか？')) return

    setIsDeleting(true)
    try {
      await requirementsAPI.delete(selectedReq.id)
      setRequirements((prev) => prev.filter((r) => r.id !== selectedReq.id))
      setSelectedReq(null)
    } catch (err) {
      console.error('Failed to delete:', err)
      setError('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/issues')}
              className="rounded-lg p-1 hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold">要件定義</h1>
          </div>
          <p className="text-muted-foreground">
            AIが生成した仮説要件定義書を確認・編集できます
          </p>
        </div>
        <button
          onClick={loadRequirements}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* 生成中表示 */}
      {isGenerating && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          <div>
            <p className="font-medium">要件定義書を生成中...</p>
            <p className="text-sm text-muted-foreground">
              AIが課題を分析し、要件定義書を作成しています
            </p>
          </div>
          <Loader2 className="ml-auto h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-lg border bg-card p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 要件リスト */}
          <div className="space-y-3">
            {requirements.length === 0 && !isGenerating ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <FileCode className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-2 text-muted-foreground">
                  要件定義書がありません
                </p>
                <p className="text-sm text-muted-foreground">
                  課題を選択して要件定義を生成してください
                </p>
                <button
                  onClick={() => router.push('/issues')}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  課題リストへ
                </button>
              </div>
            ) : (
              requirements.map((req) => {
                const status = statusConfig[req.status] || statusConfig.draft
                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className={`w-full rounded-lg border bg-card p-4 text-left transition-all ${
                      selectedReq?.id === req.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                      {req.github_issue_url && (
                        <Github className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="mt-2 font-medium line-clamp-2">
                      {req.title || '要件定義書'}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </button>
                )
              })
            )}
          </div>

          {/* 詳細ビュー */}
          <div className="lg:col-span-2">
            {selectedReq ? (
              <div className="rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b p-4">
                  <div>
                    <h2 className="font-semibold">
                      {selectedReq.title || '要件定義書'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedReq.background}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      削除
                    </button>
                    <button
                      onClick={handleCreateGithubIssue}
                      disabled={isCreatingIssue || !!selectedReq.github_issue_url}
                      className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {isCreatingIssue ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Github className="h-4 w-4" />
                      )}
                      {selectedReq.github_issue_url ? 'Issue作成済み' : 'Issue作成'}
                    </button>
                    {selectedReq.status !== 'approved' && (
                      <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                      >
                        {isApproving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        承認
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[600px] overflow-auto p-6">
                  {selectedReq.markdown_content ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>
                        {selectedReq.markdown_content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <section>
                        <h3 className="font-semibold text-lg mb-2">背景</h3>
                        <p className="text-muted-foreground">{selectedReq.background}</p>
                      </section>
                      <section>
                        <h3 className="font-semibold text-lg mb-2">課題</h3>
                        <p className="text-muted-foreground">{selectedReq.problem_statement}</p>
                      </section>
                      <section>
                        <h3 className="font-semibold text-lg mb-2">機能要件</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReq.functional_requirements?.map((req, i) => (
                            <li key={i} className="text-muted-foreground">{req}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h3 className="font-semibold text-lg mb-2">非機能要件</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReq.non_functional_requirements?.map((req, i) => (
                            <li key={i} className="text-muted-foreground">{req}</li>
                          ))}
                        </ul>
                      </section>
                      <section>
                        <h3 className="font-semibold text-lg mb-2">技術アプローチ</h3>
                        <p className="text-muted-foreground">{selectedReq.tech_approach}</p>
                      </section>
                    </div>
                  )}
                </div>

                {selectedReq.github_issue_url && (
                  <div className="border-t p-4">
                    <a
                      href={selectedReq.github_issue_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub Issue を開く
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border bg-card p-8">
                <div className="text-center">
                  <FileCode className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="mt-2 text-muted-foreground">
                    要件定義書を選択してください
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
