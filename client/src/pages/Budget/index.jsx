import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBudgetStore } from '../../stores/budgetStore'
import { useCategoryStore } from '../../stores/categoryStore'
import './Budget.css'

function Budget() {
    const navigate = useNavigate()
    const { budgets, budgetSummary, loading, fetchBudgetSummary, createBudget, deleteBudget } = useBudgetStore()
    const { expenseCategories, fetchCategories } = useCategoryStore()

    const [showModal, setShowModal] = useState(false)
    const [newBudget, setNewBudget] = useState({
        categoryId: '',
        amount: '',
        period: 'monthly'
    })

    useEffect(() => {
        fetchCategories()
        fetchBudgetSummary()
    }, [])

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            minimumFractionDigits: 0
        }).format(amount || 0)
    }

    const handleCreate = async () => {
        if (!newBudget.categoryId || !newBudget.amount) return
        try {
            await createBudget({
                ...newBudget,
                amount: parseFloat(newBudget.amount)
            })
            setShowModal(false)
            setNewBudget({ categoryId: '', amount: '', period: 'monthly' })
            fetchBudgetSummary()
        } catch (err) {
            alert('创建失败')
        }
    }

    const handleDelete = async (id, name) => {
        if (confirm(`确定删除"${name}"的预算吗？`)) {
            await deleteBudget(id)
            fetchBudgetSummary()
        }
    }

    const getProgressColor = (percentage, isOverBudget) => {
        if (isOverBudget) return 'var(--expense)'
        if (percentage > 80) return '#F59E0B'
        return 'var(--primary)'
    }

    return (
        <div className="budget-page container">
            <header className="page-header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h1>预算设置</h1>
                <button className="add-btn" onClick={() => setShowModal(true)}>+</button>
            </header>

            {budgetSummary && (
                <section className="budget-overview card">
                    <div className="overview-row">
                        <div className="overview-item">
                            <span className="overview-label">本月预算</span>
                            <span className="overview-value">¥{formatMoney(budgetSummary.totalBudget)}</span>
                        </div>
                        <div className="overview-item">
                            <span className="overview-label">已支出</span>
                            <span className="overview-value text-expense">¥{formatMoney(budgetSummary.totalSpent)}</span>
                        </div>
                    </div>
                    <div className="overview-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${Math.min((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100, 100)}%`,
                                    background: budgetSummary.totalSpent > budgetSummary.totalBudget ? 'var(--expense)' : 'var(--primary)'
                                }}
                            ></div>
                        </div>
                        <span className="progress-text">
                            剩余 ¥{formatMoney(budgetSummary.totalBudget - budgetSummary.totalSpent)}
                        </span>
                    </div>
                </section>
            )}

            <section className="budget-list">
                <h3>分类预算</h3>
                {loading ? (
                    <div className="loading-state">加载中...</div>
                ) : budgets.length > 0 ? (
                    budgets.map(budget => (
                        <div
                            key={budget.id}
                            className={`budget-item card ${budget.isOverBudget ? 'over-budget' : ''}`}
                            onClick={() => handleDelete(budget.id, budget.category?.name)}
                        >
                            <div className="budget-header">
                                <div className="budget-category">
                                    <span className="category-icon">{budget.category?.icon || '📦'}</span>
                                    <span className="category-name">{budget.category?.name || '未知分类'}</span>
                                </div>
                                {budget.isOverBudget && (
                                    <span className="over-badge">超支</span>
                                )}
                            </div>
                            <div className="budget-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${budget.percentage}%`,
                                            background: getProgressColor(budget.percentage, budget.isOverBudget)
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <div className="budget-stats">
                                <span>已用 ¥{formatMoney(budget.spent)}</span>
                                <span>预算 ¥{formatMoney(budget.amount)}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state card">
                        <span className="empty-icon">🎯</span>
                        <p>暂无预算</p>
                        <p className="empty-hint">点击右上角 + 添加预算</p>
                    </div>
                )}
            </section>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>添加预算</h3>
                        <div className="modal-form">
                            <div className="form-group">
                                <label>分类</label>
                                <select
                                    value={newBudget.categoryId}
                                    onChange={e => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                                >
                                    <option value="">选择分类</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.icon} {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>预算金额</label>
                                <input
                                    type="number"
                                    value={newBudget.amount}
                                    onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })}
                                    placeholder="输入金额"
                                />
                            </div>
                            <div className="form-group">
                                <label>周期</label>
                                <select
                                    value={newBudget.period}
                                    onChange={e => setNewBudget({ ...newBudget, period: e.target.value })}
                                >
                                    <option value="monthly">每月</option>
                                    <option value="weekly">每周</option>
                                    <option value="yearly">每年</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>取消</button>
                            <button className="btn-confirm" onClick={handleCreate}>确定</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Budget
