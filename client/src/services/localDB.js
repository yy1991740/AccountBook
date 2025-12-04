import Dexie from 'dexie'

// 创建本地数据库
const db = new Dexie('AccountBookDB')

// 定义数据库结构
db.version(1).stores({
    // 交易记录
    transactions: '++localId, id, type, amount, categoryId, accountId, date, note, userId, syncStatus, updatedAt',
    // 账户
    accounts: '++localId, id, name, type, balance, icon, color, userId, syncStatus, updatedAt',
    // 分类
    categories: '++localId, id, name, type, icon, color, userId, syncStatus, updatedAt',
    // 预算
    budgets: '++localId, id, categoryId, amount, period, userId, syncStatus, updatedAt',
    // 同步元数据
    syncMeta: 'key, value'
})

// 同步状态
export const SYNC_STATUS = {
    SYNCED: 'synced',      // 已同步
    PENDING: 'pending',    // 待同步
    CONFLICT: 'conflict'   // 冲突
}

// 获取最后同步时间
export async function getLastSyncTime() {
    const meta = await db.syncMeta.get('lastSyncTime')
    return meta?.value || null
}

// 设置最后同步时间
export async function setLastSyncTime(time) {
    await db.syncMeta.put({ key: 'lastSyncTime', value: time })
}

// 获取待同步的数据
export async function getPendingChanges() {
    const [transactions, accounts, categories, budgets] = await Promise.all([
        db.transactions.where('syncStatus').equals(SYNC_STATUS.PENDING).toArray(),
        db.accounts.where('syncStatus').equals(SYNC_STATUS.PENDING).toArray(),
        db.categories.where('syncStatus').equals(SYNC_STATUS.PENDING).toArray(),
        db.budgets.where('syncStatus').equals(SYNC_STATUS.PENDING).toArray()
    ])

    return { transactions, accounts, categories, budgets }
}

// 标记数据为已同步
export async function markAsSynced(table, localId, serverId) {
    await db[table].update(localId, {
        id: serverId,
        syncStatus: SYNC_STATUS.SYNCED
    })
}

// 清除所有本地数据
export async function clearLocalData() {
    await Promise.all([
        db.transactions.clear(),
        db.accounts.clear(),
        db.categories.clear(),
        db.budgets.clear(),
        db.syncMeta.clear()
    ])
}

export default db
