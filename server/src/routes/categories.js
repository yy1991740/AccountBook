import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

router.use(authenticate)

// 获取所有分类
router.get('/', async (req, res) => {
    try {
        const { type } = req.query
        const where = { userId: req.user.userId }
        if (type) where.type = type

        const categories = await prisma.category.findMany({
            where,
            orderBy: { order: 'asc' }
        })
        res.json(categories)
    } catch (error) {
        res.status(500).json({ message: '获取分类失败' })
    }
})

// 创建分类
router.post('/', async (req, res) => {
    try {
        const { name, type, icon, color, parentId } = req.body
        const category = await prisma.category.create({
            data: {
                name,
                type,
                icon: icon || '📦',
                color: color || '#6B7280',
                parentId,
                userId: req.user.userId
            }
        })
        res.status(201).json(category)
    } catch (error) {
        res.status(500).json({ message: '创建分类失败' })
    }
})

// 更新分类
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, icon, color, order } = req.body

        const category = await prisma.category.updateMany({
            where: { id, userId: req.user.userId },
            data: { name, icon, color, order }
        })

        if (category.count === 0) {
            return res.status(404).json({ message: '分类不存在' })
        }

        const updated = await prisma.category.findUnique({ where: { id } })
        res.json(updated)
    } catch (error) {
        res.status(500).json({ message: '更新分类失败' })
    }
})

// 删除分类
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params
        await prisma.category.deleteMany({
            where: { id, userId: req.user.userId }
        })
        res.json({ message: '删除成功' })
    } catch (error) {
        res.status(500).json({ message: '删除分类失败' })
    }
})

export default router
