/**
 * 统一的 Axios 实例与拦截器配置
 */
import axios from 'axios'
import toast from 'react-hot-toast'

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.response?.data?.detail || error.message || '网络请求失败'

    switch (error.response?.status) {
      case 401:
        toast.error('登录已过期，请重新登录')
        localStorage.removeItem('auth_token')
        window.location.href = '/auth'
        break
      case 403:
        toast.error('没有权限访问该资源')
        break
      case 404:
        toast.error(message || '请求的资源不存在')
        break
      case 500:
        toast.error(message || '服务器内部错误')
        break
      default:
        toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default apiClient
