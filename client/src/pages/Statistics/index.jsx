import { useEffect, useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { PieChart, BarChart, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import { useTransactionStore } from '../../stores/transactionStore'
import { useCategoryStore } from '../../stores/categoryStore'
import './Statistics.css'

function Statistics() {
    const { stats, transactions, fetchStats, fetchTransactions } = useTransactionStore()
    const { categories, fetchCategories } = useCategoryStore()
    const [period, setPeriod] = useState('month')
    const [chartType, setChartType] = useState('trend')

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        loadData()
    }, [period])

    const loadData = () => {
        const now = new Date()
        let startDate

        if (period === 'week') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        } else {
            startDate = new Date(now.getFullYear(), 0, 1)
        }
        const endDate = new Date()

        fetchStats({ startDate: startDate.toISOString(), endDate: endDate.toISOString() })
        fetchTransactions({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 500
        })
    }

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('zh-CN', {
            minimumFractionDigits: 2
        }).format(amount || 0)
    }

    // 计算趋势数据
    const trendData = useMemo(() => {
        const dateMap = {}
        const now = new Date()
        let days = period === 'week' ? 7 : period === 'month' ? 30 : 365

        // 初始化日期
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            const key = period === 'year'
                ? `${date.getMonth() + 1}月`
                : `${date.getMonth() + 1}/${date.getDate()}`
            if (!dateMap[key]) {
                dateMap[key] = { income: 0, expense: 0 }
            }
        }

        // 填充数据
        transactions.forEach(tx => {
            const date = new Date(tx.date)
            const key = period === 'year'
                ? `${date.getMonth() + 1}月`
                : `${date.getMonth() + 1}/${date.getDate()}`
            if (dateMap[key]) {
                if (tx.type === 'income') {
                    dateMap[key].income += tx.amount
                } else if (tx.type === 'expense') {
                    dateMap[key].expense += tx.amount
                }
            }
        })

        const labels = Object.keys(dateMap)
        const incomeData = labels.map(k => dateMap[k].income)
        const expenseData = labels.map(k => dateMap[k].expense)

        return { labels, incomeData, expenseData }
    }, [transactions, period])

    // 计算分类数据
    const categoryData = useMemo(() => {
        const categoryMap = {}
        transactions.forEach(tx => {
            if (tx.type === 'expense' && tx.category) {
                const name = tx.category.name
                if (!categoryMap[name]) {
                    categoryMap[name] = { value: 0, color: tx.category.color, icon: tx.category.icon }
                }
                categoryMap[name].value += tx.amount
            }
        })

        return Object.entries(categoryMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.value - a.value)
    }, [transactions])

    // 趋势图配置
    const trendOption = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#E5E7EB',
            textStyle: { color: '#111827' }
        },
        legend: {
            data: ['收入', '支出'],
            bottom: 0,
            itemWidth: 8,
            itemHeight: 8,
            icon: 'circle'
        },
        grid: {
            left: '3%',
            right: '4%',
            top: '10%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: trendData.labels,
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            axisLabel: { color: '#6B7280', fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#F3F4F6' } },
            axisLabel: { color: '#6B7280' }
        },
        series: [
            {
                name: '收入',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: trendData.incomeData,
                lineStyle: { color: '#10B981', width: 3 },
                itemStyle: { color: '#10B981' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.2)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
                        ]
                    }
                }
            },
            {
                name: '支出',
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: trendData.expenseData,
                lineStyle: { color: '#EF4444', width: 3 },
                itemStyle: { color: '#EF4444' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
                            { offset: 1, color: 'rgba(239, 68, 68, 0)' }
                        ]
                    }
                }
            }
        ]
    }

    // 饼图配置
    const pieOption = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: ¥{c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: '0%',
            top: 'center',
            textStyle: { color: '#6B7280' },
            itemWidth: 8,
            itemHeight: 8,
            icon: 'circle'
        },
        series: [
            {
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['30%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    }
                },
                data: categoryData.map(item => ({
                    name: item.name,
                    value: item.value,
                    itemStyle: { color: item.color }
                }))
            }
        ]
    }

    // 柱状图配置
    const barOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        legend: {
            data: ['收入', '支出'],
            bottom: 0,
            itemWidth: 8,
            itemHeight: 8,
            icon: 'circle'
        },
        grid: {
            left: '3%',
            right: '4%',
            top: '10%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: trendData.labels.filter((_, i) => i % (period === 'year' ? 1 : 5) === 0),
            axisLine: { lineStyle: { color: '#E5E7EB' } },
            axisLabel: { color: '#6B7280' }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            splitLine: { lineStyle: { color: '#F3F4F6' } },
            axisLabel: { color: '#6B7280' }
        },
        series: [
            {
                name: '收入',
                type: 'bar',
                barWidth: '20%',
                data: trendData.incomeData.filter((_, i) => i % (period === 'year' ? 1 : 5) === 0),
                itemStyle: {
                    color: '#10B981',
                    borderRadius: [4, 4, 0, 0]
                }
            },
            {
                name: '支出',
                type: 'bar',
                barWidth: '20%',
                data: trendData.expenseData.filter((_, i) => i % (period === 'year' ? 1 : 5) === 0),
                itemStyle: {
                    color: '#EF4444',
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    }

    const getChartOption = () => {
        switch (chartType) {
            case 'pie': return pieOption
            case 'bar': return barOption
            default: return trendOption
        }
    }

    const totalExpense = stats.expense || 1

    return (
        <div className="statistics-page container">
            <header className="page-header">
                <h1>统计分析</h1>
                <div className="period-tabs">
                    {['week', 'month', 'year'].map(p => (
                        <button
                            key={p}
                            className={`period-tab ${period === p ? 'active' : ''}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p === 'week' ? '周' : p === 'month' ? '月' : '年'}
                        </button>
                    ))}
                </div>
            </header>

            <section className="summary-card card glass-card">
                <div className="summary-row">
                    <div className="summary-item">
                        <span className="summary-label">
                            <ArrowUpRight size={14} className="text-income" /> 收入
                        </span>
                        <span className="summary-value text-income">¥{formatMoney(stats.income)}</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-item">
                        <span className="summary-label">
                            <ArrowDownRight size={14} className="text-expense" /> 支出
                        </span>
                        <span className="summary-value text-expense">¥{formatMoney(stats.expense)}</span>
                    </div>
                </div>
                <div className="balance-row">
                    <span className="balance-label">结余</span>
                    <span className={`balance-value ${stats.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                        ¥{formatMoney(stats.balance)}
                    </span>
                </div>
            </section>

            <section className="chart-section card">
                <div className="chart-header">
                    <div className="chart-title">
                        {chartType === 'trend' && <TrendingUp size={18} />}
                        {chartType === 'pie' && <PieChart size={18} />}
                        {chartType === 'bar' && <BarChart size={18} />}
                        <h3>{chartType === 'trend' ? '收支趋势' : chartType === 'pie' ? '支出构成' : '收支对比'}</h3>
                    </div>
                    <div className="chart-tabs">
                        <button
                            className={`chart-tab ${chartType === 'trend' ? 'active' : ''}`}
                            onClick={() => setChartType('trend')}
                        >
                            <TrendingUp size={16} />
                        </button>
                        <button
                            className={`chart-tab ${chartType === 'pie' ? 'active' : ''}`}
                            onClick={() => setChartType('pie')}
                        >
                            <PieChart size={16} />
                        </button>
                        <button
                            className={`chart-tab ${chartType === 'bar' ? 'active' : ''}`}
                            onClick={() => setChartType('bar')}
                        >
                            <BarChart size={16} />
                        </button>
                    </div>
                </div>
                <div className="chart-container">
                    <ReactECharts
                        option={getChartOption()}
                        style={{ height: '250px' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
            </section>

            <section className="category-section card">
                <h3>支出分类TOP5</h3>
                {categoryData.length > 0 ? (
                    <div className="category-list">
                        {categoryData.slice(0, 5).map((item, index) => (
                            <div key={item.name} className="category-row">
                                <div className="category-info">
                                    <span className={`category-rank rank-${index + 1}`}>{index + 1}</span>
                                    <span className="category-icon">{item.icon || '📦'}</span>
                                    <span className="category-name">{item.name}</span>
                                </div>
                                <div className="category-data">
                                    <span className="category-amount">¥{formatMoney(item.value)}</span>
                                    <span className="category-percent">
                                        {((item.value / totalExpense) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="category-bar">
                                    <div
                                        className="category-progress"
                                        style={{
                                            width: `${(item.value / totalExpense) * 100}%`,
                                            background: item.color || '#6B7280'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="chart-placeholder">
                        <div className="placeholder-icon">
                            <Wallet size={32} />
                        </div>
                        <p>暂无支出数据</p>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Statistics

