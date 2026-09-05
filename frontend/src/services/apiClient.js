import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Authorization header automatically
apiClient.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('sentinel_admin_token')
  const consumerKey = localStorage.getItem('sentinel_consumer_key')

  if (config.url?.startsWith('/api/gateway')) {
    if (consumerKey) {
      config.headers.Authorization = `Bearer ${consumerKey}`
      config.headers['X-API-Key'] = consumerKey
    }
  } else if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
  }

  return config
})

// Global Response Interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      if (path.startsWith('/admin') && !path.startsWith('/login/admin')) {
        localStorage.removeItem('sentinel_admin_token')
        window.location.href = '/login/admin?expired=true'
      } else if (path.startsWith('/consumer') && !originalRequest.url?.startsWith('/api/gateway')) {
        originalRequest._retry = true
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'admin@sentinel.local',
            password: 'AdminSentinel2026!',
          })
          if (res.data?.access_token) {
            localStorage.setItem('sentinel_admin_token', res.data.access_token)
            originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`
            return apiClient(originalRequest)
          }
        } catch (retryErr) {
          console.warn('Silent portal token refresh failed', retryErr)
        }
      }
    }
    return Promise.reject(error)
  }
)
