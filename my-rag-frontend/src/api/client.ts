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

// 请求拦截器：自动携带 Token
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

// 响应拦截器：统一处理错误提示
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || '网络请求失败'
    
    // 根据状态码进行不同处理
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
        toast.error('请求的资源不存在')
        break
      case 500:
        toast.error('服务器内部错误')
        break
      default:
        toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default apiClient
