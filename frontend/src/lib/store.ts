import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Fiche } from './api';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token); // read by api.ts interceptor
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface EditorState {
  currentFiche: Fiche | null;
  isModified: boolean;
  setCurrentFiche: (fiche: Fiche) => void;
  updateField: (field: keyof Fiche, value: string) => void;
  resetEditor: () => void;
  setModified: (modified: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentFiche: null,
  isModified: false,
  setCurrentFiche: (fiche) => set({ currentFiche: fiche, isModified: false }),
  updateField: (field, value) =>
    set((state) => ({
      currentFiche: state.currentFiche ? { ...state.currentFiche, [field]: value } : null,
      isModified: true,
    })),
  resetEditor: () => set({ currentFiche: null, isModified: false }),
  setModified: (modified) => set({ isModified: modified }),
}));
