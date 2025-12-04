import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/accounts.js'
import categoryRoutes from './routes/categories.js'
import transactionRoutes from './routes/transactions.js'
import budgetRoutes from './routes/budgets.js'
import syncRoutes from './routes/sync.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// CORS 配置 - 允许前端域名
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/sync', syncRoutes)

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root path
app.get('/', (req, res) => {
    res.json({ message: 'AccountBook API Server', version: '1.0.0' })
})

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ message: '服务器错误' })
})

// 仅在非 Vercel 环境下启动服务器
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`)
    })
}

// 导出 app 供 Vercel 使用
export default app
