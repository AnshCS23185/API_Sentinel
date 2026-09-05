import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Shared promise to ensure concurrent requests share the exact same login exchange
let tokenPromise = null

const getPortalToken = async () => {
  if (!tokenPromise) {
    tokenPromise = axios
      .post(`${API_BASE_URL}/api/auth/login`, {
        email: 'admin@sentinel.local',
        password: 'AdminSentinel2026!',
      })
      .then((res) => {
        if (res.data?.access_token) {
          localStorage.setItem('sentinel_admin_token', res.data.access_token)
          return res.data.access_token
        }
        return null
      })
      .catch((err) => {
        console.warn('Initial portal token fetch notice:', err)
        return null
      })
      .finally(() => {
        tokenPromise = null
      })
  }
  return tokenPromise
}

// Attach Authorization header automatically
apiClient.interceptors.request.use(async (config) => {
  let adminToken = localStorage.getItem('sentinel_admin_token')
  const consumerKey = localStorage.getItem('sentinel_consumer_key')

  if (config.url?.startsWith('/api/gateway')) {
    if (!config.headers.Authorization && !config.headers['X-API-Key'] && consumerKey) {
      config.headers.Authorization = `Bearer ${consumerKey}`
      config.headers['X-API-Key'] = consumerKey
    }
  } else {
    // If accessing backend data in consumer portal and token is missing, fetch it before sending request
    const path = typeof window !== 'undefined' ? window.location.pathname : ''
    if (!adminToken && path.startsWith('/consumer')) {
      adminToken = await getPortalToken()
    }
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    }
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
        localStorage.removeItem('sentinel_admin_token')
        const freshToken = await getPortalToken()
        if (freshToken) {
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          return apiClient(originalRequest)
        }
      }
    }
    return Promise.reject(error)
  }
)
