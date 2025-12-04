import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTransactionStore } from '../../stores/transactionStore'
import { useCategoryStore } from '../../stores/categoryStore'
import { useAccountStore } from '../../stores/accountStore'
import './Transactions.css'

function Transactions() {
    const { transactions, loading, fetchTransactions, deleteTransaction } = useTransactionStore()
    const { categories, fetchCategories } = useCategoryStore()
    const { accounts, fetchAccounts } = useAccountStore()

    const [filter, setFilter] = useState({
        type: 'all',
        period: 'month',
        categoryId: '',
        accountId: '',
        search: ''
    })
    const [showExportMenu, setShowExportMenu] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    useEffect(() => {
        fetchCategories()
        fetchAccounts()
    }, [])

    useEffect(() => {
        loadData()
    }, [filter.type, filter.period, filter.categoryId, filter.accountId])

    const loadData = () => {
        const params = { limit: 200 }
        if (filter.type !== 'all') {
            params.type = filter.type
        }
        if (filter.categoryId) {
            params.categoryId = filter.categoryId
        }
        if (filter.accountId) {
            params.accountId = filter.accountId
        }

        const now = new Date()
        if (filter.period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            params.startDate = weekAgo.toISOString()
        } else if (filter.period === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            params.startDate = startOfMonth.toISOString()
        } else if (filter.period === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1)
            params.startDate = startOfYear.toISOString()
        }

        fetchTransactions(params)
    }

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            minimumFractionDigits: 2
        }).format(amount || 0)
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const handleDeleteClick = (e, tx) => {
        e.stopPropagation()
        setDeleteConfirm(tx)
    }

    const handleConfirmDelete = async () => {
        if (deleteConfirm) {
            await deleteTransaction(deleteConfirm.id)
            setDeleteConfirm(null)
        }
    }

    // 搜索过滤
    const filteredTransactions = transactions.filter(tx => {
        if (!filter.search) return true
        const search = filter.search.toLowerCase()
        return (
            tx.category?.name?.toLowerCase().includes(search) ||
            tx.note?.toLowerCase().includes(search) ||
            tx.account?.name?.toLowerCase().includes(search) ||
            String(tx.amount).includes(search)
        )
    })

    // 按日期分组
    const groupByDate = (items) => {
        const groups = {}
        items.forEach(item => {
            const dateKey = new Date(item.date).toLocaleDateString('zh-CN')
            if (!groups[dateKey]) {
                groups[dateKey] = { items: [], income: 0, expense: 0 }
            }
            groups[dateKey].items.push(item)
            if (item.type === 'income') {
                groups[dateKey].income += item.amount
            } else if (item.type === 'expense') {
                groups[dateKey].expense += item.amount
            }
        })
        return groups
    }

    // 导出 CSV
    const exportCSV = () => {
        const headers = ['日期', '类型', '金额', '分类', '账户', '备注']
        const rows = filteredTransactions.map(tx => [
            formatDate(tx.date),
            tx.type === 'income' ? '收入' : tx.type === 'expense' ? '支出' : '转账',
            tx.amount,
            tx.category?.name || '',
            tx.account?.name || '',
            tx.note || ''
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `账单_${formatDate(new Date())}.csv`
        a.click()
        URL.revokeObjectURL(url)
        setShowExportMenu(false)
    }

    // 导出 JSON
    const exportJSON = () => {
        const data = filteredTransactions.map(tx => ({
            date: formatDate(tx.date),
            type: tx.type,
            amount: tx.amount,
            category: tx.category?.name,
            account: tx.account?.name,
            note: tx.note
        }))

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `账单_${formatDate(new Date())}.json`
        a.click()
        URL.revokeObjectURL(url)
        setShowExportMenu(false)
    }

    const groupedTransactions = groupByDate(filteredTransactions)

    return (
        <div className="transactions-page container">
            <header className="page-header">
                <h1>账单明细</h1>
                <div className="header-actions">
                    <button
                        className="export-btn"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                    >
                        📤 导出
                    </button>
                    {showExportMenu && (
                        <div className="export-menu">
                            <button onClick={exportCSV}>导出 CSV</button>
                            <button onClick={exportJSON}>导出 JSON</button>
                        </div>
                    )}
                </div>
            </header>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="🔍 搜索分类、备注、金额..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
            </div>

            <div className="filter-bar">
                <select
                    className="filter-select"
                    value={filter.type}
                    onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                >
                    <option value="all">全部类型</option>
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                    <option value="transfer">转账</option>
                </select>
                <select
                    className="filter-select"
                    value={filter.period}
                    onChange={(e) => setFilter({ ...filter, period: e.target.value })}
                >
                    <option value="month">本月</option>
                    <option value="week">本周</option>
                    <option value="year">今年</option>
                    <option value="all">全部</option>
                </select>
            </div>

            <div className="filter-row">
                <select
                    className="filter-select"
                    value={filter.categoryId}
                    onChange={(e) => setFilter({ ...filter, categoryId: e.target.value })}
                >
                    <option value="">全部分类</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                </select>
                <select
                    className="filter-select"
                    value={filter.accountId}
                    onChange={(e) => setFilter({ ...filter, accountId: e.target.value })}
                >
                    <option value="">全部账户</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading-state">加载中...</div>
            ) : filteredTransactions.length > 0 ? (
                <div className="transaction-groups">
                    {Object.entries(groupedTransactions).map(([date, data]) => (
                        <div key={date} className="transaction-group">
                            <div className="group-header">
                                <span className="group-date">{date}</span>
                                <div className="group-summary">
                                    {data.income > 0 && <span className="text-income">+{formatMoney(data.income)}</span>}
                                    {data.expense > 0 && <span className="text-expense">-{formatMoney(data.expense)}</span>}
                                </div>
                            </div>
                            <div className="transaction-list">
                                {data.items.map(tx => (
                                    <div
                                        key={tx.id}
                                        className="transaction-item card"
                                    >
                                        <div className="transaction-icon">
                                            {tx.category?.icon || (tx.type === 'income' ? '💰' : tx.type === 'transfer' ? '🔄' : '💸')}
                                        </div>
                                        <div className="transaction-info">
                                            <span className="transaction-category">
                                                {tx.category?.name || (tx.type === 'transfer' ? '转账' : '未分类')}
                                            </span>
                                            <span className="transaction-note">{tx.note || tx.account?.name}</span>
                                        </div>
                                        <span className={`transaction-amount ${tx.type === 'income' ? 'text-income' :
                                            tx.type === 'transfer' ? 'text-transfer' : 'text-expense'
                                            }`}>
                                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                                            ¥{formatMoney(tx.amount)}
                                        </span>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => handleDeleteClick(e, tx)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state card">
                    <span className="empty-icon">📋</span>
                    <p>{filter.search ? '未找到匹配的记录' : '暂无交易记录'}</p>
                </div>
            )}

            {/* 删除确认弹窗 */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="confirm-modal" onClick={e => e.stopPropagation()}>
                        <h3>确认删除</h3>
                        <p>
                            确定要删除这条
                            <strong>{deleteConfirm.type === 'income' ? '收入' : deleteConfirm.type === 'expense' ? '支出' : '转账'}</strong>
                            记录吗？
                        </p>
                        <p className="confirm-amount">
                            ¥{formatMoney(deleteConfirm.amount)}
                        </p>
                        <div className="confirm-actions">
                            <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>取消</button>
                            <button className="confirm-btn" onClick={handleConfirmDelete}>确认删除</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Transactions

