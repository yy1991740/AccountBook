import { useEffect, useState } from 'react'
import { useAccountStore } from '../../stores/accountStore'
import './Accounts.css'

function Accounts() {
    const { accounts, totalAssets, loading, fetchAccounts, createAccount, deleteAccount } = useAccountStore()
    const [showModal, setShowModal] = useState(false)
    const [newAccount, setNewAccount] = useState({
        name: '',
        type: 'bank',
        balance: '',
        icon: '💳',
        color: '#3B82F6'
    })

    useEffect(() => {
        fetchAccounts()
    }, [])

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: 2
        }).format(amount || 0)
    }

    const accountTypes = [
        { value: 'cash', label: '现金', icon: '💵' },
        { value: 'bank', label: '储蓄卡', icon: '💳' },
        { value: 'credit', label: '信用卡', icon: '💳' },
        { value: 'alipay', label: '支付宝', icon: '📱' },
        { value: 'wechat', label: '微信', icon: '📱' },
        { value: 'investment', label: '投资账户', icon: '📈' }
    ]

    const handleCreate = async () => {
        if (!newAccount.name) return
        try {
            await createAccount({
                ...newAccount,
                balance: parseFloat(newAccount.balance) || 0
            })
            setShowModal(false)
            setNewAccount({ name: '', type: 'bank', balance: '', icon: '💳', color: '#3B82F6' })
        } catch (err) {
            alert('创建失败')
        }
    }

    const handleDelete = async (id, name) => {
        if (confirm(`确定删除账户"${name}"吗？`)) {
            await deleteAccount(id)
        }
    }

    return (
        <div className="accounts-page container">
            <header className="page-header">
                <h1>我的账户</h1>
            </header>

            <section className="total-assets card">
                <span className="total-label">净资产</span>
                <span className="total-value">{formatMoney(totalAssets)}</span>
                <span className="total-hint">不含信用卡负债</span>
            </section>

            <section className="accounts-list">
                <div className="list-header">
                    <h3>账户列表</h3>
                    <button className="add-account-btn" onClick={() => setShowModal(true)}>+ 添加</button>
                </div>

                {loading ? (
                    <div className="loading-state">加载中...</div>
                ) : (
                    accounts.map(account => (
                        <div
                            key={account.id}
                            className="account-item card"
                            onClick={() => handleDelete(account.id, account.name)}
                        >
                            <div className="account-icon" style={{ background: account.color }}>
                                {account.icon}
                            </div>
                            <div className="account-info">
                                <span className="account-name">{account.name}</span>
                                <span className="account-type">
                                    {accountTypes.find(t => t.value === account.type)?.label || account.type}
                                </span>
                            </div>
                            <span className={`account-balance ${account.type === 'credit' && account.balance < 0 ? 'text-expense' : ''}`}>
                                {formatMoney(account.balance)}
                            </span>
                        </div>
                    ))
                )}
            </section>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>添加账户</h3>
                        <div className="modal-form">
                            <div className="form-group">
                                <label>账户名称</label>
                                <input
                                    type="text"
                                    value={newAccount.name}
                                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                    placeholder="输入账户名称"
                                />
                            </div>
                            <div className="form-group">
                                <label>账户类型</label>
                                <select
                                    value={newAccount.type}
                                    onChange={e => {
                                        const type = accountTypes.find(t => t.value === e.target.value)
                                        setNewAccount({
                                            ...newAccount,
                                            type: e.target.value,
                                            icon: type?.icon || '💳'
                                        })
                                    }}
                                >
                                    {accountTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>初始余额</label>
                                <input
                                    type="number"
                                    value={newAccount.balance}
                                    onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
                                    placeholder="0.00"
                                />
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

export default Accounts
