'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Home,
  FileText,
  Lightbulb,
  FileCode,
  Code,
  Bot,
  BarChart3,
  FolderOpen,
  ChevronDown,
  Plus,
  Check,
  Loader2,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProject } from '@/contexts/project-context'
import { useToast } from '@/components/ui/toast'

const navigation = [
  { name: 'ホーム', href: '/', icon: Home, gradient: 'from-slate-500 to-slate-600' },
  { name: 'ダッシュボード', href: '/dashboard', icon: BarChart3, gradient: 'from-blue-500 to-cyan-500' },
  { name: 'ログ取込', href: '/sources', icon: FileText, gradient: 'from-violet-500 to-purple-500' },
  { name: '課題リスト', href: '/issues', icon: Lightbulb, gradient: 'from-amber-500 to-orange-500' },
  { name: '要件定義', href: '/requirements', icon: FileCode, gradient: 'from-emerald-500 to-green-500' },
  { name: '開発進捗', href: '/developments', icon: Code, gradient: 'from-pink-500 to-rose-500' },
]

export function Sidebar() {
  const pathname = usePathname()
  const toast = useToast()
  const {
    projects,
    currentProject,
    isLoading,
    setCurrentProject,
    createProject,
  } = useProject()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    setIsSubmitting(true)
    try {
      await createProject(newProjectName.trim())
      toast.success('プロジェクトを作成しました')
      setNewProjectName('')
      setIsCreating(false)
      setIsDropdownOpen(false)
    } catch (err) {
      console.error('Failed to create project:', err)
      toast.error('プロジェクトの作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectProject = (project: typeof currentProject) => {
    if (project) {
      setCurrentProject(project)
      setIsDropdownOpen(false)
    }
  }

  return (
    <aside className="flex w-64 flex-col glass border-r-0">
      {/* プロジェクトセレクター */}
      <div className="p-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="group flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm transition-all hover:bg-white/10"
          >
            <div className="flex items-center gap-3 truncate">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <FolderOpen className="h-4 w-4 text-white" />
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <div className="truncate">
                  <p className="font-medium truncate">
                    {currentProject?.name || 'プロジェクト選択'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {projects.length} プロジェクト
                  </p>
                </div>
              )}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl glass-strong shadow-2xl scale-in">
              <div className="max-h-48 overflow-auto p-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-white/10',
                      currentProject?.id === project.id && 'bg-white/10'
                    )}
                  >
                    {currentProject?.id === project.id ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-muted-foreground/30" />
                    )}
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-white/10 p-2">
                {isCreating ? (
                  <div className="space-y-2 p-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="プロジェクト名"
                      className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateProject()
                        if (e.key === 'Escape') {
                          setIsCreating(false)
                          setNewProjectName('')
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim() || isSubmitting}
                        className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-3 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                        ) : (
                          '作成'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false)
                          setNewProjectName('')
                        }}
                        className="rounded-lg bg-white/10 px-3 py-2 text-sm transition-all hover:bg-white/20"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    新しいプロジェクト
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isActive && (
                <div className={cn('absolute inset-0 rounded-xl bg-gradient-to-r opacity-90', item.gradient)} />
              )}
              <div className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                isActive
                  ? 'bg-white/20'
                  : 'bg-white/5 group-hover:bg-white/10'
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="relative">{item.name}</span>
              {isActive && (
                <div className="absolute right-3 h-2 w-2 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* エージェント状態 */}
      <div className="p-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 p-4">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">AI エージェント</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  スタンバイ中
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>gemini-3-flash-preview</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
