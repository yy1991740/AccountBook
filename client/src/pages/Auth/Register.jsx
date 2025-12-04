import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import './Auth.css'

function Register() {
    const navigate = useNavigate()
    const { login } = useAuthStore()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
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

        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致')
            return
        }

        if (formData.password.length < 6) {
            setError('密码至少需要6个字符')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            })
            login(res.data.user, res.data.token, res.data.refreshToken)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.message || '注册失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-logo">💰</h1>
                    <h2 className="auth-title">创建账户</h2>
                    <p className="auth-subtitle">开始您的智能记账之旅</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="name">昵称</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="请输入昵称"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">邮箱</label>
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

                    <div className="form-group">
                        <label htmlFor="password">密码</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="至少6个字符"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">确认密码</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="请再次输入密码"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? '注册中...' : '注册'}
                    </button>
                </form>

                <p className="auth-footer">
                    已有账户？<Link to="/login">立即登录</Link>
                </p>
            </div>
        </div>
    )
}

export default Register
