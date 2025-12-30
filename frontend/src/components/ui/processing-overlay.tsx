'use client'

import { Loader2, Sparkles, Bot, Code, TestTube } from 'lucide-react'

interface ProcessingOverlayProps {
  isOpen: boolean
  title: string
  description?: string
  steps?: {
    label: string
    status: 'pending' | 'active' | 'completed'
  }[]
  progress?: number
}

const stepIcons: Record<string, typeof Sparkles> = {
  'AI分析': Sparkles,
  '課題抽出': Sparkles,
  '要件定義': Bot,
  '設計': Bot,
  'コード生成': Code,
  'テスト': TestTube,
}

export function ProcessingOverlay({
  isOpen,
  title,
  description,
  steps,
  progress,
}: ProcessingOverlayProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 animate-pulse text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {/* プログレスバー */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">進捗</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* ステップ表示 */}
        {steps && steps.length > 0 && (
          <div className="mt-4 space-y-2">
            {steps.map((step, index) => {
              const Icon = Object.entries(stepIcons).find(([key]) =>
                step.label.includes(key)
              )?.[1] || Sparkles

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 rounded-lg p-2 ${
                    step.status === 'active'
                      ? 'bg-primary/10'
                      : step.status === 'completed'
                      ? 'bg-green-50'
                      : 'bg-muted/50'
                  }`}
                >
                  {step.status === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : step.status === 'completed' ? (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span
                    className={`text-sm ${
                      step.status === 'active'
                        ? 'font-medium text-primary'
                        : step.status === 'completed'
                        ? 'text-green-700'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* ローディングアニメーション（ステップがない場合） */}
        {!steps && (
          <div className="mt-6 flex justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 注意事項 */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          処理中はこのまましばらくお待ちください
        </p>
      </div>
    </div>
  )
}
