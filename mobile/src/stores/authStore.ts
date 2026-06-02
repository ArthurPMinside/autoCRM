import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  token: string | null
  user: User | null
  isLoading: boolean
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  loadToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('token', token)
    } else {
      await AsyncStorage.removeItem('token')
    }
    set({ token })
  },
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await AsyncStorage.removeItem('token')
    set({ token: null, user: null })
  },
  loadToken: async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      set({ token, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))
