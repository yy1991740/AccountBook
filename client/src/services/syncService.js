import { create } from 'zustand'
import api from './api'
import db, {
    SYNC_STATUS,
    getLastSyncTime,
    setLastSyncTime,
    getPendingChanges,
    markAsSynced,
    clearLocalData
} from './localDB'

export const useSyncStore = create((set, get) => ({
    syncStatus: 'idle', // idle, syncing, success, error, offline
    lastSyncTime: null,
    pendingCount: 0,
    isOnline: navigator.onLine,
    error: null,

    // 初始化
    init: async () => {
        const lastSync = await getLastSyncTime()
        set({ lastSyncTime: lastSync })

        // 监听网络状态
        window.addEventListener('online', () => {
            set({ isOnline: true })
            get().sync() // 恢复在线时自动同步
        })
        window.addEventListener('offline', () => {
            set({ isOnline: false, syncStatus: 'offline' })
        })

        // 计算待同步数量
        await get().updatePendingCount()
    },

    // 更新待同步数量
    updatePendingCount: async () => {
        const pending = await getPendingChanges()
        const count =
            pending.transactions.length +
            pending.accounts.length +
            pending.categories.length +
            pending.budgets.length
        set({ pendingCount: count })
    },

    // 同步数据
    sync: async () => {
        const { isOnline, syncStatus } = get()
        if (!isOnline || syncStatus === 'syncing') return

        set({ syncStatus: 'syncing', error: null })

        try {
            // 1. 上传本地更改
            await get().uploadChanges()

            // 2. 下载服务器更新
            await get().downloadChanges()

            // 3. 更新同步时间
            const now = new Date().toISOString()
            await setLastSyncTime(now)

            set({
                syncStatus: 'success',
                lastSyncTime: now,
                pendingCount: 0
            })

            // 3秒后重置状态
            setTimeout(() => {
                set({ syncStatus: 'idle' })
            }, 3000)

        } catch (error) {
            console.error('Sync error:', error)
            set({
                syncStatus: 'error',
                error: error.message || '同步失败'
            })
        }
    },

    // 上传本地更改
    uploadChanges: async () => {
        const pending = await getPendingChanges()

        // 上传交易记录
        for (const tx of pending.transactions) {
            try {
                if (tx.id) {
                    // 更新
                    await api.put(`/transactions/${tx.id}`, tx)
                } else {
                    // 新建
                    const res = await api.post('/transactions', tx)
                    await markAsSynced('transactions', tx.localId, res.data.id)
                }
            } catch (error) {
                console.error('Upload transaction error:', error)
            }
        }

        // 上传账户
        for (const acc of pending.accounts) {
            try {
                if (acc.id) {
                    await api.put(`/accounts/${acc.id}`, acc)
                } else {
                    const res = await api.post('/accounts', acc)
                    await markAsSynced('accounts', acc.localId, res.data.id)
                }
            } catch (error) {
                console.error('Upload account error:', error)
            }
        }

        // 上传分类
        for (const cat of pending.categories) {
            try {
                if (cat.id) {
                    await api.put(`/categories/${cat.id}`, cat)
                } else {
                    const res = await api.post('/categories', cat)
                    await markAsSynced('categories', cat.localId, res.data.id)
                }
            } catch (error) {
                console.error('Upload category error:', error)
            }
        }
    },

    // 下载服务器更新
    downloadChanges: async () => {
        const lastSync = await getLastSyncTime()

        try {
            // 获取服务器最新数据
            const [transactions, accounts, categories] = await Promise.all([
                api.get('/transactions', { params: { limit: 500 } }),
                api.get('/accounts'),
                api.get('/categories')
            ])

            // 更新本地数据库
            await db.transaction('rw', db.transactions, db.accounts, db.categories, async () => {
                // 清除旧数据并写入新数据
                await db.transactions.clear()
                await db.accounts.clear()
                await db.categories.clear()

                if (transactions.data.length > 0) {
                    await db.transactions.bulkAdd(
                        transactions.data.map(t => ({ ...t, syncStatus: SYNC_STATUS.SYNCED }))
                    )
                }
                if (accounts.data.length > 0) {
                    await db.accounts.bulkAdd(
                        accounts.data.map(a => ({ ...a, syncStatus: SYNC_STATUS.SYNCED }))
                    )
                }
                if (categories.data.length > 0) {
                    await db.categories.bulkAdd(
                        categories.data.map(c => ({ ...c, syncStatus: SYNC_STATUS.SYNCED }))
                    )
                }
            })
        } catch (error) {
            console.error('Download changes error:', error)
            throw error
        }
    },

    // 清除本地数据
    clearLocal: async () => {
        await clearLocalData()
        set({ pendingCount: 0, lastSyncTime: null })
    }
}))
