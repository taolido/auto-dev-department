'use client'

import { useState, useEffect } from 'react'
import { FileText, Lightbulb, Code, CheckCircle, Loader2 } from 'lucide-react'
import { statsAPI, DashboardStats } from '@/lib/api'

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await statsAPI.get()
        setStats(data)
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* ヒーローセクション */}
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
        <h1 className="text-3xl font-bold">Auto-Dev Department</h1>
        <p className="mt-2 text-lg opacity-90">
          日常会話から、ソフトウェアが生まれる
        </p>
        <p className="mt-4 max-w-2xl text-sm opacity-80">
          チャットログをアップロードするだけで、AIが課題を抽出し、
          要件定義から実装まで自動で行います。
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="取込済みソース"
          value={isLoading ? null : stats?.sources ?? 0}
          color="blue"
        />
        <StatCard
          icon={<Lightbulb className="h-5 w-5" />}
          label="抽出された課題"
          value={isLoading ? null : stats?.issues ?? 0}
          color="yellow"
        />
        <StatCard
          icon={<Code className="h-5 w-5" />}
          label="要件定義"
          value={isLoading ? null : stats?.requirements ?? 0}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="承認済み"
          value={isLoading ? null : stats?.completed ?? 0}
          color="green"
        />
      </div>

      {/* クイックスタート */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">クイックスタート</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <QuickStartCard
            step={1}
            title="ログを取り込む"
            description="Chatworkと連携するか、ログファイルをアップロード"
            href="/sources"
          />
          <QuickStartCard
            step={2}
            title="課題を選択"
            description="AIが抽出した課題から、解決したいものを選択"
            href="/issues"
          />
          <QuickStartCard
            step={3}
            title="開発を開始"
            description="ボタンひとつで要件定義からコード生成まで自動実行"
            href="/developments"
          />
        </div>
      </div>

      {/* 最近のアクティビティ */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">最近のアクティビティ</h2>
        <div className="mt-4 text-center text-muted-foreground">
          <p>まだアクティビティがありません</p>
          <p className="text-sm">ログを取り込むと、ここに履歴が表示されます</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | null
  color: 'blue' | 'yellow' | 'purple' | 'green'
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
        <div>
          {value === null ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-2xl font-bold">{value}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

function QuickStartCard({
  step,
  title,
  description,
  href,
}: {
  step: number
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border p-4 transition-colors hover:border-primary hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {step}
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </a>
  )
}
