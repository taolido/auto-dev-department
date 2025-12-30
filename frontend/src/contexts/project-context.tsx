'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { Project, projectsAPI } from '@/lib/api'

interface ProjectContextType {
  projects: Project[]
  currentProject: Project | null
  isLoading: boolean
  error: string | null
  setCurrentProject: (project: Project) => void
  refreshProjects: () => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  updateProject: (id: string, name?: string, description?: string) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

const STORAGE_KEY = 'auto-dev-current-project'

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProjects = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await projectsAPI.list()
      setProjects(data)

      // 保存されているプロジェクトIDを取得
      const savedProjectId = localStorage.getItem(STORAGE_KEY)

      if (data.length > 0) {
        // 保存されたプロジェクトがあればそれを選択、なければ最初のプロジェクト
        const savedProject = savedProjectId
          ? data.find((p) => p.id === savedProjectId)
          : null
        setCurrentProjectState(savedProject || data[0])
      }
    } catch (err) {
      console.error('Failed to load projects:', err)
      setError('プロジェクトの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshProjects()
  }, [refreshProjects])

  const setCurrentProject = useCallback((project: Project) => {
    setCurrentProjectState(project)
    localStorage.setItem(STORAGE_KEY, project.id)
  }, [])

  const createProject = useCallback(async (name: string, description?: string) => {
    const newProject = await projectsAPI.create({ name, description })
    setProjects((prev) => [newProject, ...prev])
    setCurrentProject(newProject)
    return newProject
  }, [setCurrentProject])

  const updateProject = useCallback(async (id: string, name?: string, description?: string) => {
    const updated = await projectsAPI.update(id, { name, description })
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
    if (currentProject?.id === id) {
      setCurrentProjectState(updated)
    }
    return updated
  }, [currentProject])

  const deleteProject = useCallback(async (id: string) => {
    await projectsAPI.delete(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (currentProject?.id === id) {
      // 削除されたプロジェクトが現在選択中なら、別のプロジェクトを選択
      const remaining = projects.filter((p) => p.id !== id)
      if (remaining.length > 0) {
        setCurrentProject(remaining[0])
      } else {
        setCurrentProjectState(null)
      }
    }
  }, [currentProject, projects, setCurrentProject])

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        isLoading,
        error,
        setCurrentProject,
        refreshProjects,
        createProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}
