import { apiClient } from './apiClient'

export const consumerService = {
  getConsumers: async (params) => {
    const response = await apiClient.get('/api/consumers', { params })
    return response.data
  },

  getConsumer: async (id) => {
    const response = await apiClient.get(`/api/consumers/${id}`)
    return response.data
  },

  createConsumer: async (data) => {
    const response = await apiClient.post('/api/consumers', data)
    return response.data
  },

  updateConsumer: async (id, data) => {
    const response = await apiClient.patch(`/api/consumers/${id}`, data)
    return response.data
  },

  deleteConsumer: async (id, force = false) => {
    const response = await apiClient.delete(`/api/consumers/${id}`, { params: { force } })
    return response.data
  },
}
