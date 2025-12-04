import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: 'light', // 'light' | 'dark' | 'system'

            // 设置主题
            setTheme: (theme) => {
                set({ theme })
                get().applyTheme()
            },

            // 切换深色模式
            toggleDark: () => {
                const newTheme = get().theme === 'dark' ? 'light' : 'dark'
                set({ theme: newTheme })
                get().applyTheme()
            },

            // 应用主题
            applyTheme: () => {
                const { theme } = get()
                const root = document.documentElement

                if (theme === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
                } else {
                    root.setAttribute('data-theme', theme)
                }
            },

            // 初始化
            init: () => {
                get().applyTheme()

                // 监听系统主题变化
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
                mediaQuery.addEventListener('change', () => {
                    if (get().theme === 'system') {
                        get().applyTheme()
                    }
                })
            }
        }),
        {
            name: 'theme-storage'
        }
    )
)
