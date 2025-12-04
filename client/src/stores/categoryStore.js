import { create } from 'zustand'
import api from '../services/api'

export const useCategoryStore = create((set) => ({
    categories: [],
    expenseCategories: [],
    incomeCategories: [],
    loading: false,
    error: null,

    // 获取分类列表
    fetchCategories: async () => {
        set({ loading: true, error: null })
        try {
            const res = await api.get('/categories')
            const categories = res.data
            set({
                categories,
                expenseCategories: categories.filter(c => c.type === 'expense'),
                incomeCategories: categories.filter(c => c.type === 'income'),
                loading: false
            })
            return categories
        } catch (error) {
            set({ error: error.message, loading: false })
            throw error
        }
    },

    // 创建分类
    createCategory: async (data) => {
        try {
            const res = await api.post('/categories', data)
            set(state => {
                const newCategories = [...state.categories, res.data]
                return {
                    categories: newCategories,
                    expenseCategories: newCategories.filter(c => c.type === 'expense'),
                    incomeCategories: newCategories.filter(c => c.type === 'income')
                }
            })
            return res.data
        } catch (error) {
            throw error
        }
    },

    // 更新分类
    updateCategory: async (id, data) => {
        try {
            const res = await api.put(`/categories/${id}`, data)
            set(state => {
                const newCategories = state.categories.map(c => c.id === id ? res.data : c)
                return {
                    categories: newCategories,
                    expenseCategories: newCategories.filter(c => c.type === 'expense'),
                    incomeCategories: newCategories.filter(c => c.type === 'income')
                }
            })
            return res.data
        } catch (error) {
            throw error
        }
    },

    // 删除分类
    deleteCategory: async (id) => {
        try {
            await api.delete(`/categories/${id}`)
            set(state => {
                const newCategories = state.categories.filter(c => c.id !== id)
                return {
                    categories: newCategories,
                    expenseCategories: newCategories.filter(c => c.type === 'expense'),
                    incomeCategories: newCategories.filter(c => c.type === 'income')
                }
            })
        } catch (error) {
            throw error
        }
    }
}))
