'use client'

import { Settings, Upload, Bell } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">A</span>
          </div>
          <span className="text-lg font-semibold">Auto-Dev Department</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/sources"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Upload className="h-4 w-4" />
          ログ取込
        </Link>

        <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-5 w-5" />
        </button>

        <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
