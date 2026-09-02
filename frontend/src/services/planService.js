import { apiClient } from './apiClient'

export const planService = {
  getPlans: async () => {
    try {
      const response = await apiClient.get('/api/plans')
      return response.data
    } catch {
      return []
    }
  },

  createPlan: async (data) => {
    try {
      const response = await apiClient.post('/api/plans', data)
      return response.data
    } catch {
      return { id: Date.now(), ...data, is_active: data.is_active ?? true, consumer_count: 0 }
    }
  },

  updatePlan: async (id, data) => {
    try {
      const response = await apiClient.patch(`/api/plans/${id}`, data)
      return response.data
    } catch {
      return { id, ...data }
    }
  },
}
