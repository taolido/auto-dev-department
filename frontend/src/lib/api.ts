/**
 * Auto-Dev Department API Client
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// エラーレスポンス型
export interface APIErrorResponse {
  error: boolean
  error_code: string
  message: string
  details?: Record<string, unknown>
}

// カスタムエラークラス
export class APIError extends Error {
  public readonly errorCode: string
  public readonly statusCode: number
  public readonly details: Record<string, unknown>
  public readonly retryable: boolean

  constructor(
    message: string,
    errorCode: string,
    statusCode: number,
    details: Record<string, unknown> = {}
  ) {
    super(message)
    this.name = 'APIError'
    this.errorCode = errorCode
    this.statusCode = statusCode
    this.details = details
    this.retryable = statusCode >= 500 || statusCode === 429
  }

  static fromResponse(response: APIErrorResponse, statusCode: number): APIError {
    return new APIError(
      response.message,
      response.error_code,
      statusCode,
      response.details || {}
    )
  }
}

// エラーメッセージのマッピング
const ERROR_MESSAGES: Record<string, string> = {
  CONFIGURATION_ERROR: '設定が必要です',
  EXTERNAL_SERVICE_ERROR: '外部サービスでエラーが発生しました',
  RATE_LIMIT_ERROR: 'リクエスト制限に達しました。しばらく待ってから再試行してください',
  VALIDATION_ERROR: '入力内容に問題があります',
  NOT_FOUND: 'リソースが見つかりません',
  AI_GENERATION_ERROR: 'AI処理中にエラーが発生しました',
  INTERNAL_ERROR: 'サーバー内部エラーが発生しました',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return ERROR_MESSAGES[error.errorCode] || error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return '不明なエラーが発生しました'
}

// Project Types
export interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  description?: string
}

export interface ProjectUpdate {
  name?: string
  description?: string
}

// Types
export interface Source {
  id: string
  project_id: string
  type: 'chatwork_room' | 'uploaded_file'
  label: string
  file?: {
    file_name: string
    file_type: string
    file_size: number
  }
  chatwork?: {
    room_id: string
    room_name: string
    room_type: string
  }
  message_count: number
  created_at: string
  updated_at: string
}

export interface Issue {
  id: string
  project_id: string
  source_id: string
  source_type: string
  source_label: string
  title: string
  description: string
  category: string
  pain_level: 'high' | 'medium' | 'low'
  original_context: string
  tech_approach: string
  expected_outcome: string
  status: 'new' | 'selected' | 'in_progress' | 'done' | 'archived'
  requirement_id?: string
  github_issue_url?: string
  extraction_batch_id: string
  extracted_at: string
  created_at: string
  updated_at: string
}

export interface ExtractResponse {
  status: string
  batch_id: string
  message: string
}

export interface Requirement {
  id: string
  project_id: string
  issue_id: string
  title: string
  background: string
  problem_statement: string
  functional_requirements: string[]
  non_functional_requirements: string[]
  tech_approach: string
  markdown_content: string
  status: 'draft' | 'review' | 'approved' | 'rejected'
  github_issue_url?: string
  created_at: string
  updated_at: string
}

export interface GenerateResponse {
  status: string
  requirement_id: string
  message: string
}

// API Functions
interface FetchOptions extends RequestInit {
  maxRetries?: number
  timeout?: number
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAPI<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  const { maxRetries = 3, timeout = 30000, ...fetchOptions } = options || {}

  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions?.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        // エラーレスポンスをパース
        let errorData: APIErrorResponse | null = null
        try {
          errorData = await res.json()
        } catch {
          // JSONパースに失敗した場合は汎用エラー
        }

        if (errorData?.error) {
          const apiError = APIError.fromResponse(errorData, res.status)
          // 5xx or 429 はリトライ可能
          if (apiError.retryable && attempt < maxRetries - 1) {
            lastError = apiError
            await sleep(Math.pow(2, attempt) * 1000)
            continue
          }
          throw apiError
        }

        throw new APIError(
          `API Error: ${res.status} ${res.statusText}`,
          'UNKNOWN_ERROR',
          res.status
        )
      }

      return res.json()
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = new APIError(
            'リクエストがタイムアウトしました',
            'TIMEOUT_ERROR',
            408
          )
        } else if (error.message.includes('fetch')) {
          lastError = new APIError(
            'サーバーに接続できません',
            'NETWORK_ERROR',
            0
          )
        } else {
          lastError = error
        }
      }

      // リトライ
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000)
        continue
      }
    }
  }

  throw lastError || new APIError('不明なエラー', 'UNKNOWN_ERROR', 500)
}

// Chatwork Types
export interface ChatworkStatus {
  configured: boolean
}

export interface ChatworkRoom {
  room_id: number
  name: string
  type: string
  role: string
  unread_num: number
  mention_num: number
}

export interface SourceMessagesResponse {
  source_id: string
  message_count: number
  content: string
  messages: Array<{
    message_id: string
    account: { account_id: number; name: string }
    body: string
    send_time: number
  }>
}

// Sources API
export const sourcesAPI = {
  list: (projectId = 'default') =>
    fetchAPI<Source[]>(`/api/sources/?project_id=${projectId}`),

  get: (sourceId: string) =>
    fetchAPI<Source>(`/api/sources/${sourceId}`),

  upload: async (file: File, label?: string, projectId = 'default') => {
    const formData = new FormData()
    formData.append('file', file)
    if (label) formData.append('label', label)
    formData.append('project_id', projectId)

    const res = await fetch(`${API_BASE_URL}/api/sources/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`)
    }

    return res.json() as Promise<Source>
  },

  getChatworkStatus: () =>
    fetchAPI<ChatworkStatus>('/api/sources/chatwork/status'),

  getChatworkRooms: () =>
    fetchAPI<{ rooms: ChatworkRoom[] }>('/api/sources/chatwork/rooms'),

  connectChatwork: (roomId: string, roomName?: string, projectId = 'default') =>
    fetchAPI<Source>('/api/sources/chatwork', {
      method: 'POST',
      body: JSON.stringify({
        room_id: roomId,
        room_name: roomName,
        project_id: projectId,
      }),
    }),

  getMessages: (sourceId: string) =>
    fetchAPI<SourceMessagesResponse>(`/api/sources/${sourceId}/messages`),

  delete: (sourceId: string) =>
    fetchAPI<{ status: string }>(`/api/sources/${sourceId}`, {
      method: 'DELETE',
    }),
}

// Issues API
export const issuesAPI = {
  list: (projectId = 'default', filters?: {
    source_id?: string
    status?: string
    pain_level?: string
  }) => {
    const params = new URLSearchParams({ project_id: projectId })
    if (filters?.source_id) params.append('source_id', filters.source_id)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.pain_level) params.append('pain_level', filters.pain_level)
    return fetchAPI<Issue[]>(`/api/issues/?${params}`)
  },

  get: (issueId: string) =>
    fetchAPI<Issue>(`/api/issues/${issueId}`),

  extract: (sourceId: string, content: string, projectId = 'default') =>
    fetchAPI<ExtractResponse>('/api/issues/extract', {
      method: 'POST',
      body: JSON.stringify({
        source_id: sourceId,
        content,
        project_id: projectId,
      }),
    }),

  updateStatus: (issueId: string, status: Issue['status']) =>
    fetchAPI<Issue>(`/api/issues/${issueId}/status?status=${status}`, {
      method: 'PATCH',
    }),

  select: (issueId: string) =>
    fetchAPI<Issue>(`/api/issues/${issueId}/select`, {
      method: 'POST',
    }),
}

// Requirements API
export const requirementsAPI = {
  list: (projectId = 'default') =>
    fetchAPI<Requirement[]>(`/api/requirements/?project_id=${projectId}`),

  get: (requirementId: string) =>
    fetchAPI<Requirement>(`/api/requirements/${requirementId}`),

  generate: (issueIds: string[], projectId = 'default') =>
    fetchAPI<GenerateResponse>('/api/requirements/generate', {
      method: 'POST',
      body: JSON.stringify({
        issue_ids: issueIds,
        project_id: projectId,
      }),
    }),

  update: (requirementId: string, data: { markdown_content?: string; status?: string }) =>
    fetchAPI<Requirement>(`/api/requirements/${requirementId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  approve: (requirementId: string) =>
    fetchAPI<Requirement>(`/api/requirements/${requirementId}/approve`, {
      method: 'POST',
    }),

  createGithubIssue: (requirementId: string) =>
    fetchAPI<{ status: string; github_issue_url: string }>(
      `/api/requirements/${requirementId}/create-github-issue`,
      { method: 'POST' }
    ),

  delete: (requirementId: string) =>
    fetchAPI<{ status: string; id: string }>(
      `/api/requirements/${requirementId}`,
      { method: 'DELETE' }
    ),
}

// Developments API
export interface AgentLogEntry {
  timestamp: string
  agent: string
  message: string
  level: 'info' | 'warning' | 'error'
}

export interface GeneratedFile {
  path: string
  content: string
  language: string
}

export interface Development {
  id: string
  project_id: string
  requirement_id: string
  status: 'designing' | 'coding' | 'testing' | 'review' | 'merged' | 'failed'
  design_doc?: string
  generated_files: GeneratedFile[]
  test_results?: string
  error_count: number
  retry_count: number
  max_retries: number
  github_branch?: string
  github_pr_id?: number
  github_pr_url?: string
  agent_logs: AgentLogEntry[]
  created_at: string
  updated_at: string
}

export interface StartDevelopmentResponse {
  status: string
  development_id: string
  message: string
}

export interface GitHubStatus {
  configured: boolean
  repo: string | null
}

export interface CreatePRResponse {
  status: string
  branch: string
  pr_url: string
  pr_number: number
  files_pushed: number
}

export const developmentsAPI = {
  list: (projectId = 'default', status?: string) => {
    const params = new URLSearchParams({ project_id: projectId })
    if (status) params.append('status', status)
    return fetchAPI<Development[]>(`/api/developments/?${params}`)
  },

  get: (developmentId: string) =>
    fetchAPI<Development>(`/api/developments/${developmentId}`),

  getLogs: (developmentId: string) =>
    fetchAPI<AgentLogEntry[]>(`/api/developments/${developmentId}/logs`),

  start: (requirementId: string, projectId = 'default') =>
    fetchAPI<StartDevelopmentResponse>('/api/developments/start', {
      method: 'POST',
      body: JSON.stringify({
        requirement_id: requirementId,
        project_id: projectId,
      }),
    }),

  getGitHubStatus: () =>
    fetchAPI<GitHubStatus>('/api/developments/github/status'),

  createPR: (developmentId: string) =>
    fetchAPI<CreatePRResponse>(`/api/developments/${developmentId}/create-pr`, {
      method: 'POST',
    }),

  downloadZip: (developmentId: string) => {
    // 直接ダウンロードリンクを開く
    window.open(`${API_BASE_URL}/api/developments/${developmentId}/download`, '_blank')
  },
}

// Stats API (ダッシュボード用)
export interface DashboardStats {
  sources: number
  issues: number
  requirements: number
  completed: number
  developments: number
}

export const statsAPI = {
  get: async (projectId = 'default'): Promise<DashboardStats> => {
    const [sources, issues, requirements, developments] = await Promise.all([
      sourcesAPI.list(projectId),
      issuesAPI.list(projectId),
      requirementsAPI.list(projectId),
      developmentsAPI.list(projectId),
    ])

    return {
      sources: sources.length,
      issues: issues.length,
      requirements: requirements.length,
      completed: requirements.filter((r) => r.status === 'approved').length,
      developments: developments.length,
    }
  },
}

// Projects API
export const projectsAPI = {
  list: () =>
    fetchAPI<Project[]>('/api/projects/'),

  get: (projectId: string) =>
    fetchAPI<Project>(`/api/projects/${projectId}`),

  create: (data: ProjectCreate) =>
    fetchAPI<Project>('/api/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (projectId: string, data: ProjectUpdate) =>
    fetchAPI<Project>(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (projectId: string) =>
    fetchAPI<{ status: string; id: string }>(`/api/projects/${projectId}`, {
      method: 'DELETE',
    }),
}
