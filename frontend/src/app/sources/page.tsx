'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, MessageSquare, FileText, Plus, Trash2, Loader2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { sourcesAPI, issuesAPI, Source, ChatworkStatus } from '@/lib/api'

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState<string | null>(null)
  const [chatworkRoomId, setChatworkRoomId] = useState('')
  const [chatworkRoomName, setChatworkRoomName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadedContent, setUploadedContent] = useState<Map<string, string>>(new Map())
  const [chatworkStatus, setChatworkStatus] = useState<ChatworkStatus | null>(null)
  const [isFetchingMessages, setIsFetchingMessages] = useState<string | null>(null)

  const loadSources = useCallback(async () => {
    try {
      const data = await sourcesAPI.list()
      setSources(data)
    } catch (err) {
      console.error('Failed to load sources:', err)
      setError('ソースの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSources()
    // Chatwork設定状態を取得
    sourcesAPI.getChatworkStatus()
      .then(setChatworkStatus)
      .catch(console.error)
  }, [loadSources])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // ファイルの内容を読み取って保存
      const content = await file.text()

      const newSource = await sourcesAPI.upload(file)
      setSources([...sources, newSource])

      // 内容を保存（抽出時に使用）
      setUploadedContent(prev => new Map(prev).set(newSource.id, content))
    } catch (err) {
      console.error('Upload failed:', err)
      setError('ファイルのアップロードに失敗しました')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleChatworkConnect = async () => {
    if (!chatworkRoomId.trim()) return

    setError(null)
    try {
      const newSource = await sourcesAPI.connectChatwork(
        chatworkRoomId,
        chatworkRoomName || undefined
      )
      setSources([...sources, newSource])
      setChatworkRoomId('')
      setChatworkRoomName('')
    } catch (err) {
      console.error('Chatwork connect failed:', err)
      setError('Chatwork連携に失敗しました')
    }
  }

  const handleDelete = async (sourceId: string) => {
    try {
      await sourcesAPI.delete(sourceId)
      setSources(sources.filter(s => s.id !== sourceId))
      setUploadedContent(prev => {
        const newMap = new Map(prev)
        newMap.delete(sourceId)
        return newMap
      })
    } catch (err) {
      console.error('Delete failed:', err)
      setError('削除に失敗しました')
    }
  }

  const handleFetchMessages = async (sourceId: string) => {
    setIsFetchingMessages(sourceId)
    setError(null)

    try {
      const response = await sourcesAPI.getMessages(sourceId)
      // 取得したコンテンツを保存
      setUploadedContent(prev => new Map(prev).set(sourceId, response.content))
      // ソースの情報を更新（メッセージ数）
      setSources(prev => prev.map(s =>
        s.id === sourceId ? { ...s, message_count: response.message_count } : s
      ))
      alert(`${response.message_count}件のメッセージを取得しました。「課題抽出」ボタンで分析を開始できます。`)
    } catch (err) {
      console.error('Fetch messages failed:', err)
      setError('メッセージの取得に失敗しました。Chatwork API設定を確認してください。')
    } finally {
      setIsFetchingMessages(null)
    }
  }

  const handleExtract = async (sourceId: string) => {
    const content = uploadedContent.get(sourceId)
    if (!content) {
      // Chatworkソースの場合はまずメッセージを取得
      const source = sources.find(s => s.id === sourceId)
      if (source?.type === 'chatwork_room') {
        setError('まず「メッセージ取得」ボタンでメッセージを取得してください。')
      } else {
        setError('ファイルの内容が見つかりません。再度アップロードしてください。')
      }
      return
    }

    setIsExtracting(sourceId)
    setError(null)

    try {
      await issuesAPI.extract(sourceId, content)
      // 抽出開始をユーザーに通知
      alert('課題抽出を開始しました。「課題リスト」ページで結果を確認してください。')
    } catch (err) {
      console.error('Extract failed:', err)
      setError('課題抽出に失敗しました')
    } finally {
      setIsExtracting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ログ取込</h1>
          <p className="text-muted-foreground">
            Chatworkと連携するか、ログファイルをアップロードしてください
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {/* 取込方法 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* ファイルアップロード */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold">ファイルアップロード</h2>
              <p className="text-sm text-muted-foreground">
                テキストファイルやCSVをアップロード
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-muted/50">
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="mt-2 text-sm text-muted-foreground">
                {isUploading ? 'アップロード中...' : 'クリックまたはドラッグ&ドロップ'}
              </span>
              <span className="text-xs text-muted-foreground">
                .txt, .csv, .json
              </span>
              <input
                type="file"
                className="hidden"
                accept=".txt,.csv,.json"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        {/* Chatwork連携 */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3 text-green-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold">Chatwork連携</h2>
                <p className="text-sm text-muted-foreground">
                  ルームIDを指定してメッセージを取得
                </p>
              </div>
            </div>
            {chatworkStatus && (
              <span className={`flex items-center gap-1 text-xs ${chatworkStatus.configured ? 'text-green-600' : 'text-yellow-600'}`}>
                {chatworkStatus.configured ? (
                  <>✓ API設定済み</>
                ) : (
                  <><AlertCircle className="h-3 w-3" /> API未設定</>
                )}
              </span>
            )}
          </div>

          {!chatworkStatus?.configured && (
            <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              Chatwork APIを使用するには、.envファイルで CHATWORK_API_TOKEN を設定してください。
            </div>
          )}

          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="ルームID（例: 123456789）"
              value={chatworkRoomId}
              onChange={(e) => setChatworkRoomId(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="ルーム名（任意）"
              value={chatworkRoomName}
              onChange={(e) => setChatworkRoomName(e.target.value)}
              className="w-full rounded-lg border bg-background px-4 py-2 text-sm"
            />
            <button
              onClick={handleChatworkConnect}
              disabled={!chatworkRoomId.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              連携する
            </button>
          </div>
        </div>
      </div>

      {/* ソース一覧 */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="font-semibold">取込済みソース</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 opacity-50" />
            <p className="mt-2">まだソースがありません</p>
            <p className="text-sm">上のフォームからログを取り込んでください</p>
          </div>
        ) : (
          <div className="divide-y">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  {source.type === 'chatwork_room' ? (
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium">{source.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {source.message_count || 0} 行
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Chatworkソースの場合はメッセージ取得ボタン */}
                  {source.type === 'chatwork_room' && chatworkStatus?.configured && (
                    <button
                      onClick={() => handleFetchMessages(source.id)}
                      disabled={isFetchingMessages === source.id}
                      className="flex items-center gap-1 rounded-lg border border-green-600 px-3 py-1.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                    >
                      {isFetchingMessages === source.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      メッセージ取得
                    </button>
                  )}
                  {/* コンテンツがある場合は抽出ボタン */}
                  {uploadedContent.has(source.id) && (
                    <button
                      onClick={() => handleExtract(source.id)}
                      disabled={isExtracting === source.id}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isExtracting === source.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      課題抽出
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(source.id)}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
