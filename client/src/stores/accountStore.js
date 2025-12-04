import { create } from 'zustand'
import api from '../services/api'

export const useAccountStore = create((set, get) => ({
    accounts: [],
    totalAssets: 0,
    loading: false,
    error: null,

    // 获取账户列表
    fetchAccounts: async () => {
        set({ loading: true, error: null })
        try {
            const res = await api.get('/accounts')
            const accounts = res.data
            const totalAssets = accounts.reduce((sum, acc) => {
                // 信用卡不计入总资产
                if (acc.type === 'credit') return sum
                return sum + acc.balance
            }, 0)
            set({ accounts, totalAssets, loading: false })
            return accounts
        } catch (error) {
            set({ error: error.message, loading: false })
            throw error
        }
    },

    // 创建账户
    createAccount: async (data) => {
        try {
            const res = await api.post('/accounts', data)
            set(state => ({
                accounts: [...state.accounts, res.data]
            }))
            get().fetchAccounts() // 刷新总资产
            return res.data
        } catch (error) {
            throw error
        }
    },

    // 更新账户
    updateAccount: async (id, data) => {
        try {
            const res = await api.put(`/accounts/${id}`, data)
            set(state => ({
                accounts: state.accounts.map(a => a.id === id ? res.data : a)
            }))
            get().fetchAccounts()
            return res.data
        } catch (error) {
            throw error
        }
    },

    // 删除账户
    deleteAccount: async (id) => {
        try {
            await api.delete(`/accounts/${id}`)
            set(state => ({
                accounts: state.accounts.filter(a => a.id !== id)
            }))
            get().fetchAccounts()
        } catch (error) {
            throw error
        }
    }
}))
