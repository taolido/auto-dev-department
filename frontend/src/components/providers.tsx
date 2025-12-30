'use client'

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { ProjectProvider } from '@/contexts/project-context'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProjectProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ProjectProvider>
  )
}
