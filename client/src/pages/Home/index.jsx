import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, ArrowRight, Calendar } from 'lucide-react'
import { useTransactionStore } from '../../stores/transactionStore'
import { useAccountStore } from '../../stores/accountStore'
import { useAuthStore } from '../../stores/authStore'
import './Home.css'

function Home() {
    const { user } = useAuthStore()
    const { transactions, stats, fetchTransactions, fetchStats } = useTransactionStore()
    const { fetchAccounts } = useAccountStore()

    useEffect(() => {
        // 获取本月数据
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        fetchStats({
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString()
        })
        fetchTransactions({ limit: 5 })
        fetchAccounts()
    }, [])

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(amount || 0)
    }

    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return `${date.getMonth() + 1}月${date.getDate()}日`
    }

    return (
        <div className="home-page container">
            <header className="home-header">
                <div>
                    <h1>你好，{user?.name || '用户'}</h1>
                    <div className="home-date">
                        <Calendar size={14} />
                        <span>{new Date().toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long'
                        })}</span>
                    </div>
                </div>
                <div className="user-avatar-sm">
                    {user?.name?.charAt(0) || 'U'}
                </div>
            </header>

            <section className="overview-card card glass-card">
                <div className="overview-header">
                    <span className="overview-title">本月结余</span>
                    <span className="overview-badge">
                        {stats.balance >= 0 ? '盈余' : '超支'}
                    </span>
                </div>
                <div className="overview-balance">
                    {formatMoney(stats.balance)}
                </div>
                <div className="overview-stats">
                    <div className="stat-item">
                        <div className="stat-icon income-bg">
                            <TrendingUp size={16} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">收入</span>
                            <span className="stat-value">{formatMoney(stats.income)}</span>
                        </div>
                    </div>
                    <div className="stat-divider"></div>
                    <div className="stat-item">
                        <div className="stat-icon expense-bg">
                            <TrendingDown size={16} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">支出</span>
                            <span className="stat-value">{formatMoney(stats.expense)}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="budget-section">
                <div className="budget-card card">
                    <div className="budget-header">
                        <span className="budget-title">月度预算</span>
                        <span className="budget-percent">
                            {Math.min(Math.round((stats.expense / 5000) * 100), 100)}%
                        </span>
                    </div>
                    <div className="budget-bar-container">
                        <div className="budget-bar">
                            <div
                                className="budget-progress"
                                style={{
                                    width: `${Math.min((stats.expense / 5000) * 100, 100)}%`,
                                    background: stats.expense > 5000 ? 'var(--expense)' : 'var(--primary)'
                                }}
                            ></div>
                        </div>
                    </div>
                    <div className="budget-footer">
                        <span>已用 {formatMoney(stats.expense)}</span>
                        <span>预算 ¥5,000.00</span>
                    </div>
                </div>
            </section>

            <section className="recent-section">
                <div className="section-header">
                    <h2>近期流水</h2>
                    <Link to="/transactions" className="view-all">
                        查看全部 <ArrowRight size={14} />
                    </Link>
                </div>

                {transactions.length > 0 ? (
                    <div className="transaction-list">
                        {transactions.slice(0, 5).map(tx => (
                            <div key={tx.id} className="transaction-item card">
                                <div className={`transaction-icon-box ${tx.type === 'income' ? 'income-box' : 'expense-box'}`}>
                                    {tx.category?.icon ? (
                                        <span className="emoji-icon">{tx.category.icon}</span>
                                    ) : (
                                        tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />
                                    )}
                                </div>
                                <div className="transaction-info">
                                    <div className="transaction-main">
                                        <span className="transaction-category">
                                            {tx.category?.name || (tx.type === 'transfer' ? '转账' : '未分类')}
                                        </span>
                                        <span className={`transaction-amount ${tx.type === 'income' ? 'text-income' : 'text-expense'}`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                                        </span>
                                    </div>
                                    <div className="transaction-sub">
                                        <span className="transaction-date">{formatDate(tx.date)}</span>
                                        {tx.note && <span className="transaction-note">{tx.note}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state card">
                        <div className="empty-icon-box">
                            <Wallet size={32} />
                        </div>
                        <p>暂无交易记录</p>
                        <p className="empty-hint">点击下方 + 开始记账</p>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Home

