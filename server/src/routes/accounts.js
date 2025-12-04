import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.use(authenticate)

// 获取所有账户
router.get('/', async (req, res) => {
    try {
        const accounts = await prisma.account.findMany({
            where: { userId: req.user.userId },
            orderBy: { order: 'asc' }
        })
        res.json(accounts)
    } catch (error) {
        res.status(500).json({ message: '获取账户失败' })
    }
})

// 创建账户
router.post('/', async (req, res) => {
    try {
        const { name, type, balance, icon, color } = req.body
        const account = await prisma.account.create({
            data: {
                name,
                type,
                balance: balance || 0,
                icon: icon || '💳',
                color: color || '#10B981',
                userId: req.user.userId
            }
        })
        res.status(201).json(account)
    } catch (error) {
        res.status(500).json({ message: '创建账户失败' })
    }
})

// 更新账户
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, type, balance, icon, color, order } = req.body

        const account = await prisma.account.updateMany({
            where: { id, userId: req.user.userId },
            data: { name, type, balance, icon, color, order }
        })

        if (account.count === 0) {
            return res.status(404).json({ message: '账户不存在' })
        }

        const updated = await prisma.account.findUnique({ where: { id } })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ message: '更新账户失败' })
    }
})

// 删除账户
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        await prisma.account.deleteMany({
            where: { id, userId: req.user.userId }
        })
        res.json({ message: '删除成功' })
    } catch (error) {
        res.status(500).json({ message: '删除账户失败' })
    }
})

export default router
