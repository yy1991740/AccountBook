import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Monitor, Target, CreditCard, ChevronRight, LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import { useBudgetStore } from '../../stores/budgetStore'
import './Settings.css'

function Settings() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { theme, setTheme, init: initTheme } = useThemeStore()
    const { budgetSummary, fetchBudgetSummary } = useBudgetStore()

    useEffect(() => {
        initTheme()
        fetchBudgetSummary()
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const themeOptions = [
        { value: 'light', label: '浅色', icon: Sun },
        { value: 'dark', label: '深色', icon: Moon },
        { value: 'system', label: '跟随系统', icon: Monitor }
    ]

    return (
        <div className="settings-page container">
            <header className="page-header">
                <h1>我的</h1>
            </header>

            <section className="user-card card glass-card">
                <div className="user-avatar">
                    {user?.name?.charAt(0) || <User size={32} />}
                </div>
                <div className="user-info">
                    <span className="user-name">{user?.name || '未登录'}</span>
                    <span className="user-email">{user?.email || ''}</span>
                </div>
            </section>

            {/* 预算概览 */}
            {budgetSummary && budgetSummary.totalBudget > 0 && (
                <section className="budget-overview-card card" onClick={() => navigate('/budget')}>
                    <div className="budget-title">
                        <div className="budget-label">
                            <Target size={18} className="text-primary" />
                            <span>本月预算</span>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                    </div>
                    <div className="budget-bar-container">
                        <div className="budget-bar">
                            <div
                                className="budget-fill"
                                style={{
                                    width: `${Math.min((budgetSummary.totalSpent / budgetSummary.totalBudget) * 100, 100)}%`,
                                    background: budgetSummary.totalSpent > budgetSummary.totalBudget ? 'var(--expense)' : 'var(--primary)'
                                }}
                            ></div>
                        </div>
                        <div className="budget-text">
                            <span>¥{budgetSummary.totalSpent.toFixed(0)} / ¥{budgetSummary.totalBudget.toFixed(0)}</span>
                            {budgetSummary.totalSpent > budgetSummary.totalBudget && (
                                <span className="over-text">超支!</span>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* 主题设置 */}
            <section className="theme-card card">
                <h3>主题设置</h3>
                <div className="theme-options">
                    {themeOptions.map(opt => {
                        const Icon = opt.icon
                        return (
                            <button
                                key={opt.value}
                                className={`theme-option ${theme === opt.value ? 'active' : ''}`}
                                onClick={() => setTheme(opt.value)}
                            >
                                <Icon size={20} />
                                <span className="theme-label">{opt.label}</span>
                            </button>
                        )
                    })}
                </div>
            </section>

            <section className="menu-section">
                <button className="menu-item card" onClick={() => navigate('/budget')}>
                    <div className="menu-left">
                        <div className="menu-icon-box">
                            <Target size={20} />
                        </div>
                        <span className="menu-label">预算设置</span>
                    </div>
                    <ChevronRight size={18} className="menu-arrow" />
                </button>
                <button className="menu-item card" onClick={() => navigate('/accounts')}>
                    <div className="menu-left">
                        <div className="menu-icon-box">
                            <CreditCard size={20} />
                        </div>
                        <span className="menu-label">账户管理</span>
                    </div>
                    <ChevronRight size={18} className="menu-arrow" />
                </button>
            </section>

            <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
                退出登录
            </button>

            <p className="version">版本 1.0.0</p>
        </div>
    )
}

export default Settings

