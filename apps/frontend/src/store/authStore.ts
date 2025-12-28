import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface Member {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  addedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setToken: (token: string) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      setToken: (token: string) => {
        set({ token, error: null });
      },

      logout: () => {
        set({ token: null, user: null, error: null });
      },

      fetchUser: async () => {
        const { token } = get();
        if (!token) {
          set({ user: null, isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/members/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              set({ token: null, user: null, isLoading: false, error: 'Session expired' });
              return;
            }
            throw new Error('Failed to fetch user');
          }

          const user = await response.json();
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: 'Failed to fetch user' });
        }
      },

      isAuthenticated: () => {
        const { token, user } = get();
        return !!token && !!user;
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);

// Members API functions
export const membersApi = {
  getAll: async (token: string): Promise<Member[]> => {
    const response = await fetch(`${API_URL}/members`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch members');
    return response.json();
  },

  create: async (token: string, email: string): Promise<Member> => {
    const response = await fetch(`${API_URL}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error('Failed to create member');
    return response.json();
  },

  update: async (
    token: string,
    id: string,
    data: { role?: string; isActive?: boolean }
  ): Promise<Member> => {
    const response = await fetch(`${API_URL}/members/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update member');
    return response.json();
  },

  delete: async (token: string, id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/members/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to delete member');
  },
};

export type { User, Member };
