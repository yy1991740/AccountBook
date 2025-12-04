import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Wallet } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import './Auth.css'

function Login() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await api.post('/auth/login', formData)
            login(res.data.user, res.data.token, res.data.refreshToken)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || '登录失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container glass-card">
                <div className="auth-header">
                    <div className="auth-logo-box">
                        <Wallet size={48} />
                    </div>
                    <h2 className="auth-title">欢迎回来</h2>
                    <p className="auth-subtitle">登录您的账户继续记账</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">邮箱</label>
                        <div className="input-wrapper">
                            <Mail className="input-icon" size={20} />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="请输入邮箱"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">密码</label>
                        <div className="input-wrapper">
                            <Lock className="input-icon" size={20} />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="请输入密码"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? '登录中...' : (
                            <>
                                登录 <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-footer">
                    还没有账户？<Link to="/register">立即注册</Link>
                </p>
            </div>
        </div>
    )
}

export default Login
