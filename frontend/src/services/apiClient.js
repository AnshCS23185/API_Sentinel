import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Authorization header automatically
apiClient.interceptors.request.use((config) => {
  // Check Admin JWT token
  const adminToken = localStorage.getItem('sentinel_admin_token')
  // Check Consumer Key credential
  const consumerKey = localStorage.getItem('sentinel_consumer_key')

  if (adminToken && !config.url?.startsWith('/api/gateway')) {
    config.headers.Authorization = `Bearer ${adminToken}`
  } else if (consumerKey && config.url?.startsWith('/api/gateway')) {
    config.headers.Authorization = `Bearer ${consumerKey}`
  }

  return config
})

// Global Response Interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      if (path.startsWith('/admin') && !path.startsWith('/login/admin')) {
        localStorage.removeItem('sentinel_admin_token')
        window.location.href = '/login/admin?expired=true'
      }
      // Note: Consumer services handle API fallbacks gracefully and do not force sign-out on backend 401
    }
    return Promise.reject(error)
  }
)
