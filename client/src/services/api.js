import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// 根据环境确定 API 基础路径
const getBaseURL = () => {
    // 生产环境使用环境变量中的 API 地址
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL
    }
    // 开发环境使用代理
    return '/api'
}

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器：添加 token
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器：处理 token 刷新
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            const refreshToken = useAuthStore.getState().refreshToken
            if (refreshToken) {
                try {
                    const baseURL = getBaseURL()
                    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
                    useAuthStore.getState().updateToken(res.data.token)
                    originalRequest.headers.Authorization = `Bearer ${res.data.token}`
                    return api(originalRequest)
                } catch (refreshError) {
                    useAuthStore.getState().logout()
                    window.location.href = '/login'
                }
            } else {
                useAuthStore.getState().logout()
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api
