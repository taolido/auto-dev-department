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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProject } from '@/contexts/project-context'
import { useToast } from '@/components/ui/toast'

const navigation = [
  { name: 'ホーム', href: '/', icon: Home },
  { name: 'ダッシュボード', href: '/dashboard', icon: BarChart3 },
  { name: 'ログ取込', href: '/sources', icon: FileText },
  { name: '課題リスト', href: '/issues', icon: Lightbulb },
  { name: '要件定義', href: '/requirements', icon: FileCode },
  { name: '開発進捗', href: '/developments', icon: Code },
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
    <aside className="flex w-60 flex-col border-r bg-card">
      {/* プロジェクトセレクター */}
      <div className="border-b p-3">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            <div className="flex items-center gap-2 truncate">
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="truncate">
                  {currentProject?.name || 'プロジェクト選択'}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover shadow-lg">
              <div className="max-h-48 overflow-auto p-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted',
                      currentProject?.id === project.id && 'bg-muted'
                    )}
                  >
                    {currentProject?.id === project.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <span
                      className={cn(
                        'truncate',
                        currentProject?.id !== project.id && 'ml-6'
                      )}
                    >
                      {project.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="border-t p-2">
                {isCreating ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="プロジェクト名"
                      className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                        className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
                        className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* エージェント状態 */}
      <div className="mt-auto border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">エージェント状態</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">待機中</p>
        </div>
      </div>
    </aside>
  )
}
