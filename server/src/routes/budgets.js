import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.use(authenticate)

// 获取所有预算
router.get('/', async (req, res) => {
    try {
        const budgets = await prisma.budget.findMany({
            where: { userId: req.user.userId },
            include: { category: true }
        })
        res.json(budgets)
    } catch (error) {
        res.status(500).json({ message: '获取预算失败' })
    }
})

// 创建预算
router.post('/', async (req, res) => {
    try {
        const { categoryId, amount, period, alertThreshold } = req.body
        const budget = await prisma.budget.create({
            data: {
                categoryId,
                amount: parseFloat(amount),
                period: period || 'monthly',
                alertThreshold: alertThreshold || 0.8,
                userId: req.user.userId
            },
            include: { category: true }
        })
        res.status(201).json(budget)
    } catch (error) {
        res.status(500).json({ message: '创建预算失败' })
    }
})

// 更新预算
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { amount, alertThreshold } = req.body

        const budget = await prisma.budget.updateMany({
            where: { id, userId: req.user.userId },
            data: {
                amount: amount ? parseFloat(amount) : undefined,
                alertThreshold
            }
        })

        if (budget.count === 0) {
            return res.status(404).json({ message: '预算不存在' })
        }

        const updated = await prisma.budget.findUnique({
            where: { id },
            include: { category: true }
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ message: '更新预算失败' })
    }
})

// 删除预算
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        await prisma.budget.deleteMany({
            where: { id, userId: req.user.userId }
        })
        res.json({ message: '删除成功' })
    } catch (error) {
        res.status(500).json({ message: '删除预算失败' })
    }
})

export default router
