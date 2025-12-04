import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.use(authenticate)

// 获取自上次同步以来的更新
router.get('/changes', async (req, res) => {
    try {
        const { since } = req.query
        const userId = req.user.userId

        const sinceDate = since ? new Date(since) : new Date(0)

        const [transactions, accounts, categories, budgets] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    userId,
                    updatedAt: { gte: sinceDate }
                },
                include: { category: true, account: true }
            }),
            prisma.account.findMany({
                where: {
                    userId,
                    updatedAt: { gte: sinceDate }
                }
            }),
            prisma.category.findMany({
                where: {
                    userId,
                    updatedAt: { gte: sinceDate }
                }
            }),
            prisma.budget.findMany({
                where: {
                    userId,
                    updatedAt: { gte: sinceDate }
                },
                include: { category: true }
            })
        ])

        res.json({
            transactions,
            accounts,
            categories,
            budgets,
            serverTime: new Date().toISOString()
        })
    } catch (error) {
        console.error('Get changes error:', error)
        res.status(500).json({ message: '获取变更失败' })
    }
})

// 批量同步上传
router.post('/upload', async (req, res) => {
    try {
        const { transactions, accounts, categories, budgets } = req.body
        const userId = req.user.userId
        const results = { transactions: [], accounts: [], categories: [], budgets: [] }

        // 同步交易记录
        if (transactions && transactions.length > 0) {
            for (const tx of transactions) {
                try {
                    if (tx.id) {
                        // 更新
                        const updated = await prisma.transaction.update({
                            where: { id: tx.id },
                            data: {
                                amount: tx.amount,
                                categoryId: tx.categoryId,
                                date: new Date(tx.date),
                                note: tx.note
                            }
                        })
                        results.transactions.push({ localId: tx.localId, id: updated.id, success: true })
                    } else {
                        // 创建
                        const created = await prisma.transaction.create({
                            data: {
                                type: tx.type,
                                amount: tx.amount,
                                categoryId: tx.categoryId,
                                accountId: tx.accountId,
                                date: new Date(tx.date),
                                note: tx.note,
                                userId
                            }
                        })
                        results.transactions.push({ localId: tx.localId, id: created.id, success: true })
                    }
                } catch (e) {
                    results.transactions.push({ localId: tx.localId, success: false, error: e.message })
                }
            }
        }

        // 同步账户
        if (accounts && accounts.length > 0) {
            for (const acc of accounts) {
                try {
                    if (acc.id) {
                        const updated = await prisma.account.update({
                            where: { id: acc.id },
                            data: { name: acc.name, balance: acc.balance, icon: acc.icon, color: acc.color }
                        })
                        results.accounts.push({ localId: acc.localId, id: updated.id, success: true })
                    } else {
                        const created = await prisma.account.create({
                            data: { ...acc, userId, localId: undefined }
                        })
                        results.accounts.push({ localId: acc.localId, id: created.id, success: true })
                    }
                } catch (e) {
                    results.accounts.push({ localId: acc.localId, success: false, error: e.message })
                }
            }
        }

        res.json({
            results,
            serverTime: new Date().toISOString()
        })
    } catch (error) {
        console.error('Upload sync error:', error)
        res.status(500).json({ message: '同步上传失败' })
    }
})

// 获取同步状态
router.get('/status', async (req, res) => {
    try {
        const userId = req.user.userId

        const [transactionCount, accountCount, categoryCount] = await Promise.all([
            prisma.transaction.count({ where: { userId } }),
            prisma.account.count({ where: { userId } }),
            prisma.category.count({ where: { userId } })
        ])

        res.json({
            transactionCount,
            accountCount,
            categoryCount,
            serverTime: new Date().toISOString()
        })
    } catch (error) {
        res.status(500).json({ message: '获取状态失败' })
    }
})

export default router
