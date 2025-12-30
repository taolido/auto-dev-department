'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Lightbulb,
  Code,
  CheckCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  Bot,
  GitBranch,
  Rocket,
  ChevronRight,
} from 'lucide-react'
import { statsAPI, DashboardStats } from '@/lib/api'
import { useProject } from '@/contexts/project-context'

export default function Home() {
  const { currentProject } = useProject()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!currentProject) return
      try {
        const data = await statsAPI.get(currentProject.id)
        setStats(data)
      } catch (err) {
        console.error('Failed to load stats:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadStats()
  }, [currentProject])

  return (
    <div className="space-y-8 fade-in">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-pink-500/30 blur-3xl" />

        <div className="relative glass-strong rounded-2xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm mb-6">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span className="text-violet-300">AI-Powered Development</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="gradient-text">会話</span>から
                <br />
                <span className="text-foreground">ソフトウェア</span>が生まれる
              </h1>

              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                チャットログをアップロードするだけで、AIが課題を抽出し、
                要件定義から実装まで自動で行います。
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/sources"
                  className="group relative inline-flex items-center gap-2 rounded-xl px-6 py-3 text-white font-medium overflow-hidden transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Rocket className="relative h-5 w-5" />
                  <span className="relative">始める</span>
                  <ArrowRight className="relative h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium transition-all hover:bg-white/20"
                >
                  ダッシュボードを見る
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 装飾的なイラスト */}
            <div className="hidden md:block relative">
              <div className="relative h-64 w-64">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 rotate-6 opacity-20" />
                <div className="absolute inset-0 rounded-3xl glass flex items-center justify-center">
                  <Bot className="h-24 w-24 text-violet-400 float" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="取込済みソース"
          value={isLoading ? null : stats?.sources ?? 0}
          gradient="from-blue-500 to-cyan-500"
          delay={0}
        />
        <StatCard
          icon={<Lightbulb className="h-5 w-5" />}
          label="抽出された課題"
          value={isLoading ? null : stats?.issues ?? 0}
          gradient="from-amber-500 to-orange-500"
          delay={100}
        />
        <StatCard
          icon={<Code className="h-5 w-5" />}
          label="要件定義"
          value={isLoading ? null : stats?.requirements ?? 0}
          gradient="from-violet-500 to-purple-500"
          delay={200}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label="承認済み"
          value={isLoading ? null : stats?.completed ?? 0}
          gradient="from-emerald-500 to-green-500"
          delay={300}
        />
      </div>

      {/* ワークフロー */}
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ワークフロー</h2>
            <p className="text-sm text-muted-foreground">3ステップで自動開発</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <WorkflowCard
            step={1}
            icon={<FileText className="h-6 w-6" />}
            title="ログを取り込む"
            description="Chatworkと連携するか、会話ログをアップロード。AIが自動で内容を分析します。"
            href="/sources"
            gradient="from-blue-500 to-cyan-500"
          />
          <WorkflowCard
            step={2}
            icon={<Lightbulb className="h-6 w-6" />}
            title="課題を選択"
            description="AIが抽出した課題一覧から、解決したい課題を選択。優先度も自動判定。"
            href="/issues"
            gradient="from-amber-500 to-orange-500"
          />
          <WorkflowCard
            step={3}
            icon={<GitBranch className="h-6 w-6" />}
            title="自動開発"
            description="要件定義からコード生成、テスト、PRまで自動実行。GitHubと完全連携。"
            href="/developments"
            gradient="from-emerald-500 to-green-500"
          />
        </div>
      </div>

      {/* 機能紹介 */}
      <div className="grid gap-6 md:grid-cols-2">
        <FeatureCard
          icon={<Bot className="h-6 w-6" />}
          title="マルチエージェントAI"
          description="PM、テックリード、コーダー、テスターの4つのAIエージェントが協力して開発を進めます。"
          gradient="from-violet-500 to-purple-500"
        />
        <FeatureCard
          icon={<GitBranch className="h-6 w-6" />}
          title="GitHub完全連携"
          description="Issue作成、ブランチ作成、コード生成、Pull Request作成まで完全自動化。"
          gradient="from-pink-500 to-rose-500"
        />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  gradient,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: number | null
  gradient: string
  delay: number
}) {
  return (
    <div
      className="group glass rounded-xl p-5 hover-lift cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <div className="text-white">{icon}</div>
        </div>
        <div>
          {value === null ? (
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  )
}

function WorkflowCard({
  step,
  icon,
  title,
  description,
  href,
  gradient,
}: {
  step: number
  icon: React.ReactNode
  title: string
  description: string
  href: string
  gradient: string
}) {
  return (
    <Link
      href={href}
      className="group relative glass rounded-xl p-6 transition-all hover:bg-white/10"
    >
      <div className="absolute -top-3 -left-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-white shadow-lg`}>
          {step}
        </div>
      </div>

      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20 mb-4`}>
        <div className={`text-transparent bg-gradient-to-r ${gradient} bg-clip-text`}>
          {icon}
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2 group-hover:text-violet-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1 text-sm text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span>詳細を見る</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="group glass rounded-xl p-6 transition-all hover:bg-white/10">
      <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg mb-4`}>
        <div className="text-white">{icon}</div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
