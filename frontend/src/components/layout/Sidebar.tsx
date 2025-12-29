'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  Lightbulb,
  FileCode,
  Code,
  Bot,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

  return (
    <aside className="w-60 border-r bg-card">
      <nav className="flex flex-col gap-1 p-4">
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

      <div className="mt-auto border-t p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">エージェント状態</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            待機中
          </p>
        </div>
      </div>
    </aside>
  )
}
