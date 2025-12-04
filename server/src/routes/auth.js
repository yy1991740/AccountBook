import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 生成 token
const generateTokens = (userId) => {
    const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    )

    return { token, refreshToken }
}

// 默认分类
const defaultCategories = [
    // 支出分类
    { name: '餐饮', type: 'expense', icon: '🍜', color: '#F59E0B' },
    { name: '交通', type: 'expense', icon: '🚗', color: '#3B82F6' },
    { name: '购物', type: 'expense', icon: '🛒', color: '#EC4899' },
    { name: '娱乐', type: 'expense', icon: '🎬', color: '#8B5CF6' },
    { name: '医疗', type: 'expense', icon: '💊', color: '#EF4444' },
    { name: '教育', type: 'expense', icon: '📚', color: '#10B981' },
    { name: '住房', type: 'expense', icon: '🏠', color: '#6366F1' },
    { name: '水电', type: 'expense', icon: '💡', color: '#F97316' },
    { name: '通讯', type: 'expense', icon: '📱', color: '#14B8A6' },
    { name: '其他', type: 'expense', icon: '📦', color: '#6B7280' },
    // 收入分类
    { name: '工资', type: 'income', icon: '💰', color: '#10B981' },
    { name: '奖金', type: 'income', icon: '🎁', color: '#F59E0B' },
    { name: '投资', type: 'income', icon: '📈', color: '#3B82F6' },
    { name: '兼职', type: 'income', icon: '💼', color: '#8B5CF6' },
    { name: '其他收入', type: 'income', icon: '💵', color: '#6B7280' }
]

// 默认账户
const defaultAccounts = [
    { name: '现金', type: 'cash', icon: '💵', color: '#10B981', isDefault: true },
    { name: '储蓄卡', type: 'bank', icon: '💳', color: '#3B82F6' },
    { name: '信用卡', type: 'credit', icon: '💳', color: '#EF4444' },
    { name: '支付宝', type: 'alipay', icon: '📱', color: '#1677FF' },
    { name: '微信', type: 'wechat', icon: '📱', color: '#07C160' }
]

// 注册
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body

        // 验证
        if (!name || !email || !password) {
            return res.status(400).json({ message: '请填写所有必填字段' })
        }

        if (password.length < 6) {
            return res.status(400).json({ message: '密码至少需要6个字符' })
        }

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ message: '该邮箱已被注册' })
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10)

        // 创建用户
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                // 创建默认分类
                categories: {
                    create: defaultCategories.map((cat, index) => ({
                        ...cat,
                        order: index
                    }))
                },
                // 创建默认账户
                accounts: {
                    create: defaultAccounts.map((acc, index) => ({
                        ...acc,
                        order: index
                    }))
                }
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        })

        const { token, refreshToken } = generateTokens(user.id)

        res.status(201).json({
            user,
            token,
            refreshToken
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({ message: '注册失败，请重试' })
    }
})

// 登录
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: '请填写邮箱和密码' })
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
            return res.status(401).json({ message: '邮箱或密码错误' })
        }

        const validPassword = await bcrypt.compare(password, user.password)
        if (!validPassword) {
            return res.status(401).json({ message: '邮箱或密码错误' })
        }

        const { token, refreshToken } = generateTokens(user.id)

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token,
            refreshToken
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({ message: '登录失败，请重试' })
    }
})

// 刷新 token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(400).json({ message: '请提供刷新令牌' })
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
        const { token, refreshToken: newRefreshToken } = generateTokens(decoded.userId)

        res.json({ token, refreshToken: newRefreshToken })
    } catch (error) {
        res.status(401).json({ message: '刷新令牌无效或已过期' })
    }
})

export default router
