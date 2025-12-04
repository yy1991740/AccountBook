import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Home from './pages/Home'
import Transactions from './pages/Transactions'
import AddTransaction from './pages/AddTransaction'
import Statistics from './pages/Statistics'
import Accounts from './pages/Accounts'
import Settings from './pages/Settings'
import Budget from './pages/Budget'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuthStore()
    return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Layout />
                    </PrivateRoute>
                }
            >
                <Route index element={<Home />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="add" element={<AddTransaction />} />
                <Route path="statistics" element={<Statistics />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="settings" element={<Settings />} />
                <Route path="budget" element={<Budget />} />
            </Route>
        </Routes>
    )
}

export default App

