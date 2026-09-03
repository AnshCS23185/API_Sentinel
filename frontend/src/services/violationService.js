import { apiClient } from './apiClient'

export const violationService = {
  getViolations: async (params) => {
    try {
      const response = await apiClient.get('/api/violations', { params })
      if (response.data && typeof response.data.total === 'number') {
        return response.data
      }
    } catch (err) {
      console.warn('Backend violations query error', err)
    }

    return {
      total: 0,
      limit: params?.limit || 10,
      offset: params?.offset || 0,
      violations: [],
    }
  },

  getViolationById: async (id) => {
    try {
      const response = await apiClient.get(`/api/violations/${id}`)
      return response.data
    } catch {
      return null
    }
  },
}
