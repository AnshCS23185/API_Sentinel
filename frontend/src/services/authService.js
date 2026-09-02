import { apiClient } from './apiClient'

export const authService = {
  adminLogin: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', { email, password })
    return response.data
  },

  getAdminProfile: async () => {
    const response = await apiClient.get('/api/auth/me')
    return response.data
  },
}
