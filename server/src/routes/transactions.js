import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.use(authenticate)

// 获取交易记录
router.get('/', async (req, res) => {
    try {
        const { type, startDate, endDate, categoryId, accountId, limit = 50, offset = 0 } = req.query

        const where = { userId: req.user.userId }
        if (type) where.type = type
        if (categoryId) where.categoryId = categoryId
        if (accountId) where.accountId = accountId
        if (startDate || endDate) {
            where.date = {}
            if (startDate) where.date.gte = new Date(startDate)
            if (endDate) where.date.lte = new Date(endDate)
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                category: true,
                account: true,
                targetAccount: true
            },
            orderBy: { date: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        })

        res.json(transactions)
    } catch (error) {
        console.error('Get transactions error:', error)
        res.status(500).json({ message: '获取交易记录失败' })
    }
})

// 获取统计数据
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query
        const userId = req.user.userId

        const dateFilter = {}
        if (startDate) dateFilter.gte = new Date(startDate)
        if (endDate) dateFilter.lte = new Date(endDate)

        const where = { userId }
        if (Object.keys(dateFilter).length) where.date = dateFilter

        // 收入总计
        const income = await prisma.transaction.aggregate({
            where: { ...where, type: 'income' },
            _sum: { amount: true }
        })

        // 支出总计
        const expense = await prisma.transaction.aggregate({
            where: { ...where, type: 'expense' },
            _sum: { amount: true }
        })

        // 按分类统计
        const byCategory = await prisma.transaction.groupBy({
            by: ['categoryId'],
            where: { ...where, type: 'expense' },
            _sum: { amount: true }
        })

        res.json({
            income: income._sum.amount || 0,
            expense: expense._sum.amount || 0,
            balance: (income._sum.amount || 0) - (expense._sum.amount || 0),
            byCategory
        })
    } catch (error) {
        res.status(500).json({ message: '获取统计数据失败' })
    }
})

// 创建交易记录
router.post('/', async (req, res) => {
    try {
        const { type, amount, categoryId, accountId, targetAccountId, date, note, tags } = req.body

        if (!type || !amount || !accountId) {
            return res.status(400).json({ message: '缺少必填字段' })
        }

        // 开启事务
        const result = await prisma.$transaction(async (tx) => {
            // 创建交易记录
            const transaction = await tx.transaction.create({
                data: {
                    type,
                    amount: parseFloat(amount),
                    categoryId,
                    accountId,
                    targetAccountId,
                    date: date ? new Date(date) : new Date(),
                    note,
                    tags: tags ? JSON.stringify(tags) : null,
                    userId: req.user.userId
                },
                include: {
                    category: true,
                    account: true
                }
            })

            // 更新账户余额
            if (type === 'expense') {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: parseFloat(amount) } }
                })
            } else if (type === 'income') {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: parseFloat(amount) } }
                })
            } else if (type === 'transfer' && targetAccountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: parseFloat(amount) } }
                })
                await tx.account.update({
                    where: { id: targetAccountId },
                    data: { balance: { increment: parseFloat(amount) } }
                })
            }

            return transaction
        })

        res.status(201).json(result)
    } catch (error) {
        console.error('Create transaction error:', error)
        res.status(500).json({ message: '创建交易记录失败' })
    }
})

// 更新交易记录
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { amount, categoryId, date, note, tags } = req.body

        const transaction = await prisma.transaction.updateMany({
            where: { id, userId: req.user.userId },
            data: {
                amount: amount ? parseFloat(amount) : undefined,
                categoryId,
                date: date ? new Date(date) : undefined,
                note,
                tags: tags ? JSON.stringify(tags) : undefined
            }
        })

        if (transaction.count === 0) {
            return res.status(404).json({ message: '交易记录不存在' })
        }

        const updated = await prisma.transaction.findUnique({
            where: { id },
            include: { category: true, account: true }
        })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ message: '更新交易记录失败' })
    }
})

// 删除交易记录
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params

        // 获取交易记录以恢复余额
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId: req.user.userId }
        })

        if (!transaction) {
            return res.status(404).json({ message: '交易记录不存在' })
        }

        await prisma.$transaction(async (tx) => {
            // 恢复账户余额
            if (transaction.type === 'expense') {
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: { balance: { increment: transaction.amount } }
                })
            } else if (transaction.type === 'income') {
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: { balance: { decrement: transaction.amount } }
                })
            } else if (transaction.type === 'transfer' && transaction.targetAccountId) {
                await tx.account.update({
                    where: { id: transaction.accountId },
                    data: { balance: { increment: transaction.amount } }
                })
                await tx.account.update({
                    where: { id: transaction.targetAccountId },
                    data: { balance: { decrement: transaction.amount } }
                })
            }

            await tx.transaction.delete({ where: { id } })
        })

        res.json({ message: '删除成功' })
    } catch (error) {
        res.status(500).json({ message: '删除交易记录失败' })
    }
})

export default router
