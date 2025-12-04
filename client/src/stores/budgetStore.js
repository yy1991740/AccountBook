import { create } from 'zustand'
import api from '../services/api'

export const useBudgetStore = create((set, get) => ({
    budgets: [],
    budgetSummary: null,
    loading: false,

    // 获取预算列表
    fetchBudgets: async () => {
        set({ loading: true })
        try {
            const res = await api.get('/budgets')
            set({ budgets: res.data, loading: false })
            return res.data
        } catch (error) {
            set({ loading: false })
            throw error
        }
    },

    // 获取预算使用情况
    fetchBudgetSummary: async () => {
        try {
            // 获取本月支出
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

            const [budgets, stats] = await Promise.all([
                api.get('/budgets'),
                api.get('/transactions/stats', {
                    params: {
                        startDate: startOfMonth.toISOString(),
                        endDate: endOfMonth.toISOString()
                    }
                })
            ])

            // 按分类统计支出
            const txRes = await api.get('/transactions', {
                params: {
                    startDate: startOfMonth.toISOString(),
                    endDate: endOfMonth.toISOString(),
                    type: 'expense'
                }
            })

            const categorySpending = {}
            txRes.data.forEach(tx => {
                if (tx.categoryId) {
                    categorySpending[tx.categoryId] = (categorySpending[tx.categoryId] || 0) + tx.amount
                }
            })

            // 计算每个预算的使用情况
            const budgetDetails = budgets.data.map(budget => {
                const spent = categorySpending[budget.categoryId] || 0
                const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
                return {
                    ...budget,
                    spent,
                    percentage: Math.min(percentage, 100),
                    remaining: budget.amount - spent,
                    isOverBudget: spent > budget.amount
                }
            })

            set({
                budgets: budgetDetails,
                budgetSummary: {
                    totalBudget: budgets.data.reduce((sum, b) => sum + b.amount, 0),
                    totalSpent: stats.data.expense || 0,
                    budgetDetails
                }
            })
        } catch (error) {
            console.error('Fetch budget summary error:', error)
        }
    },

    // 创建预算
    createBudget: async (data) => {
        try {
            const res = await api.post('/budgets', data)
            set(state => ({
                budgets: [...state.budgets, res.data]
            }))
            return res.data
        } catch (error) {
            throw error
        }
    },

    // 更新预算
    updateBudget: async (id, data) => {
        try {
            const res = await api.put(`/budgets/${id}`, data)
            set(state => ({
                budgets: state.budgets.map(b => b.id === id ? res.data : b)
            }))
            return res.data
        } catch (error) {
            throw error
        }
    },

    // 删除预算
    deleteBudget: async (id) => {
        try {
            await api.delete(`/budgets/${id}`)
            set(state => ({
                budgets: state.budgets.filter(b => b.id !== id)
            }))
        } catch (error) {
            throw error
        }
    }
}))
