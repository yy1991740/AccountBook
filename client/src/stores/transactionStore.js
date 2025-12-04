import { create } from 'zustand'
import api from '../services/api'

export const useTransactionStore = create((set, get) => ({
    transactions: [],
    stats: { income: 0, expense: 0, balance: 0 },
    loading: false,
    error: null,

    // 获取交易记录
    fetchTransactions: async (params = {}) => {
        set({ loading: true, error: null })
        try {
            const res = await api.get('/transactions', { params })
            set({ transactions: res.data, loading: false })
            return res.data
        } catch (error) {
            set({ error: error.message, loading: false })
            throw error
        }
    },

    // 获取统计数据
    fetchStats: async (params = {}) => {
        try {
            const res = await api.get('/transactions/stats', { params })
            set({ stats: res.data })
            return res.data
        } catch (error) {
            console.error('Fetch stats error:', error)
        }
    },

    // 创建交易
    createTransaction: async (data) => {
        set({ loading: true, error: null })
        try {
            const res = await api.post('/transactions', data)
            set(state => ({
                transactions: [res.data, ...state.transactions],
                loading: false
            }))
            // 刷新统计
            get().fetchStats()
            return res.data
        } catch (error) {
            set({ error: error.message, loading: false })
            throw error
        }
    },

    // 删除交易
    deleteTransaction: async (id) => {
        try {
            await api.delete(`/transactions/${id}`)
            set(state => ({
                transactions: state.transactions.filter(t => t.id !== id)
            }))
            get().fetchStats()
        } catch (error) {
            throw error
        }
    }
}))
