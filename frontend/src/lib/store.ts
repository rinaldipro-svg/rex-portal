import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './api';

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
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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
  currentFiche: any | null;
  isModified: boolean;
  setCurrentFiche: (fiche: any) => void;
  updateField: (field: string, value: any) => void;
  resetEditor: () => void;
  setModified: (modified: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentFiche: null,
  isModified: false,
  setCurrentFiche: (fiche) => set({ currentFiche: fiche, isModified: false }),
  updateField: (field, value) =>
    set((state) => ({
      currentFiche: { ...state.currentFiche, [field]: value },
      isModified: true,
    })),
  resetEditor: () => set({ currentFiche: null, isModified: false }),
  setModified: (modified) => set({ isModified: modified }),
}));
