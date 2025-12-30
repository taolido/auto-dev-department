'use client'

import { Settings, Upload, Bell, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="glass-strong sticky top-0 z-50 flex h-16 items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold gradient-text">Auto-Dev</span>
            <span className="ml-1 text-lg font-light text-muted-foreground">Department</span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/sources"
          className="group relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white overflow-hidden transition-all hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Upload className="relative h-4 w-4" />
          <span className="relative">ログ取込</span>
        </Link>

        <button className="relative rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground group">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button className="rounded-xl p-2.5 text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground">
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
