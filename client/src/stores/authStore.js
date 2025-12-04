import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,

            login: (userData, token, refreshToken) => {
                set({
                    user: userData,
                    token,
                    refreshToken,
                    isAuthenticated: true
                })
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isAuthenticated: false
                })
            },

            updateToken: (token) => {
                set({ token })
            },

            updateUser: (userData) => {
                set({ user: { ...get().user, ...userData } })
            }
        }),
        {
            name: 'auth-storage'
        }
    )
)
