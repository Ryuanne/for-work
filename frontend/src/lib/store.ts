import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Capability,
  ChatSession,
  Internship,
  LearningResource,
  Profile,
  ResumeVersion,
} from './types'
import { DEFAULT_PROFILE, DEFAULT_RESUME } from './recommendations'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

const now = () => new Date().toISOString()

interface AppState {
  profile: Profile
  internships: Internship[]
  capabilities: Capability[]
  resumes: ResumeVersion[]
  sessions: ChatSession[]
  hydrated: boolean

  setProfile: (p: Partial<Profile>) => void

  addInternship: (i: Omit<Internship, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateInternship: (id: string, patch: Partial<Internship>) => void
  deleteInternship: (id: string) => void

  addCapability: (
    c: Omit<Capability, 'id' | 'createdAt' | 'updatedAt' | 'resources'> & {
      resources?: LearningResource[]
    }
  ) => void
  updateCapability: (id: string, patch: Partial<Capability>) => void
  deleteCapability: (id: string) => void
  toggleResource: (capId: string, resId: string) => void
  addResource: (capId: string, r: Omit<LearningResource, 'id'>) => void

  addResume: (r: Omit<ResumeVersion, 'id' | 'createdAt'>) => void
  updateResume: (id: string, patch: Partial<ResumeVersion>) => void
  deleteResume: (id: string) => void

  addSession: (s: Omit<ChatSession, 'id' | 'createdAt'>) => string
  updateSession: (id: string, patch: Partial<ChatSession>) => void
  deleteSession: (id: string) => void

  resetAll: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      internships: [],
      capabilities: [],
      resumes: [
        {
          id: uid(),
          name: '我的初始简历（基于上传简历）',
          content: DEFAULT_RESUME,
          createdAt: now(),
        },
      ],
      sessions: [],
      hydrated: false,

      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),

      addInternship: (i) =>
        set((s) => ({
          internships: [{ ...i, id: uid(), createdAt: now(), updatedAt: now() }, ...s.internships],
        })),
      updateInternship: (id, patch) =>
        set((s) => ({
          internships: s.internships.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: now() } : x
          ),
        })),
      deleteInternship: (id) =>
        set((s) => ({ internships: s.internships.filter((x) => x.id !== id) })),

      addCapability: (c) =>
        set((s) => ({
          capabilities: [
            {
              ...c,
              resources: c.resources || [],
              id: uid(),
              createdAt: now(),
              updatedAt: now(),
            },
            ...s.capabilities,
          ],
        })),
      updateCapability: (id, patch) =>
        set((s) => ({
          capabilities: s.capabilities.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: now() } : x
          ),
        })),
      deleteCapability: (id) =>
        set((s) => ({ capabilities: s.capabilities.filter((x) => x.id !== id) })),
      toggleResource: (capId, resId) =>
        set((s) => ({
          capabilities: s.capabilities.map((c) =>
            c.id === capId
              ? {
                  ...c,
                  resources: c.resources.map((r) =>
                    r.id === resId ? { ...r, done: !r.done } : r
                  ),
                  updatedAt: now(),
                }
              : c
          ),
        })),
      addResource: (capId, r) =>
        set((s) => ({
          capabilities: s.capabilities.map((c) =>
            c.id === capId
              ? {
                  ...c,
                  resources: [...c.resources, { ...r, id: uid() }],
                  updatedAt: now(),
                }
              : c
          ),
        })),

      addResume: (r) =>
        set((s) => ({
          resumes: [{ ...r, id: uid(), createdAt: now() }, ...s.resumes],
        })),
      updateResume: (id, patch) =>
        set((s) => ({
          resumes: s.resumes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteResume: (id) =>
        set((s) => ({ resumes: s.resumes.filter((x) => x.id !== id) })),

      addSession: (s) => {
        const id = uid()
        set((st) => ({
          sessions: [{ ...s, id, createdAt: Date.now() }, ...st.sessions],
        }))
        return id
      },
      updateSession: (id, patch) =>
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      resetAll: () =>
        set({
          profile: DEFAULT_PROFILE,
          internships: [],
          capabilities: [],
          resumes: [
            { id: uid(), name: '我的初始简历（基于上传简历）', content: DEFAULT_RESUME, createdAt: now() },
          ],
          sessions: [],
        }),
    }),
    {
      name: 'intern-pilot-store',
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true
      },
    }
  )
)
