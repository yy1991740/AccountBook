import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactionStore } from '../../stores/transactionStore'
import { useCategoryStore } from '../../stores/categoryStore'
import { useAccountStore } from '../../stores/accountStore'
import './AddTransaction.css'

function AddTransaction() {
    const navigate = useNavigate()
    const { createTransaction, loading } = useTransactionStore()
    const { expenseCategories, incomeCategories, fetchCategories } = useCategoryStore()
    const { accounts, fetchAccounts } = useAccountStore()

    const [type, setType] = useState('expense')
    const [amount, setAmount] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [accountId, setAccountId] = useState('')
    const [targetAccountId, setTargetAccountId] = useState('')
    const [note, setNote] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [error, setError] = useState('')

    useEffect(() => {
        fetchCategories()
        fetchAccounts()
    }, [])

    useEffect(() => {
        // 设置默认账户
        if (accounts.length > 0 && !accountId) {
            const defaultAccount = accounts.find(a => a.isDefault) || accounts[0]
            setAccountId(defaultAccount.id)
        }
    }, [accounts])

    const categories = type === 'expense' ? expenseCategories : incomeCategories

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('请输入有效金额')
            return
        }
        if (!accountId) {
            setError('请选择账户')
            return
        }
        if (type !== 'transfer' && !categoryId) {
            setError('请选择分类')
            return
        }
        if (type === 'transfer' && !targetAccountId) {
            setError('请选择转入账户')
            return
        }

        try {
            await createTransaction({
                type,
                amount: parseFloat(amount),
                categoryId: type === 'transfer' ? null : categoryId,
                accountId,
                targetAccountId: type === 'transfer' ? targetAccountId : null,
                date,
                note
            })
            navigate('/')
        } catch (err) {
            setError('保存失败，请重试')
        }
    }

    return (
        <div className="add-page">
            <header className="add-header">
                <button className="back-btn" onClick={() => navigate(-1)}>✕</button>
                <h1>记一笔</h1>
                <button
                    className="save-btn"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? '保存中...' : '保存'}
                </button>
            </header>

            <div className="type-tabs">
                <button
                    className={`type-tab ${type === 'expense' ? 'active expense' : ''}`}
                    onClick={() => { setType('expense'); setCategoryId('') }}
                >
                    支出
                </button>
                <button
                    className={`type-tab ${type === 'income' ? 'active income' : ''}`}
                    onClick={() => { setType('income'); setCategoryId('') }}
                >
                    收入
                </button>
                <button
                    className={`type-tab ${type === 'transfer' ? 'active transfer' : ''}`}
                    onClick={() => { setType('transfer'); setCategoryId('') }}
                >
                    转账
                </button>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="amount-input">
                <span className="currency">¥</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError('') }}
                    placeholder="0.00"
                    autoFocus
                />
            </div>

            {type !== 'transfer' ? (
                <div className="category-section">
                    <h3>选择分类</h3>
                    <div className="category-grid">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                className={`category-item ${categoryId === cat.id ? 'selected' : ''}`}
                                onClick={() => setCategoryId(cat.id)}
                            >
                                <span className="category-icon">{cat.icon}</span>
                                <span className="category-name">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="transfer-section">
                    <h3>转账账户</h3>
                    <div className="transfer-accounts">
                        <div className="transfer-from">
                            <label>从</label>
                            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <span className="transfer-arrow">→</span>
                        <div className="transfer-to">
                            <label>到</label>
                            <select value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)}>
                                <option value="">选择账户</option>
                                {accounts.filter(a => a.id !== accountId).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            <div className="form-section">
                <div className="form-row">
                    <label>账户</label>
                    <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-row">
                    <label>日期</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div className="form-row">
                    <label>备注</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="添加备注..."
                    />
                </div>
            </div>
        </div>
    )
}

export default AddTransaction
