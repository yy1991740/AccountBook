import { Outlet, NavLink } from 'react-router-dom'
import { Home, FileText, PlusCircle, PieChart, User } from 'lucide-react'
import './Layout.css'

const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/transactions', icon: FileText, label: '账单' },
    { path: '/add', icon: PlusCircle, label: '记账', isMain: true },
    { path: '/statistics', icon: PieChart, label: '统计' },
    { path: '/settings', icon: User, label: '我的' }
]

function Layout() {
    return (
        <div className="layout">
            <main className="layout-main">
                <Outlet />
            </main>
            <nav className="layout-nav">
                {navItems.map(item => {
                    const Icon = item.icon
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''} ${item.isMain ? 'nav-item-main' : ''}`
                            }
                        >
                            <span className="nav-icon">
                                <Icon size={item.isMain ? 32 : 24} strokeWidth={item.isMain ? 2 : 2.5} />
                            </span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    )
                })}
            </nav>
        </div>
    )
}

export default Layout

