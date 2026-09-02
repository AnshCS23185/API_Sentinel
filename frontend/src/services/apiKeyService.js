import { apiClient } from './apiClient'

export const apiKeyService = {
  getConsumerKeys: async (consumerId) => {
    const response = await apiClient.get(`/api/consumers/${consumerId}/keys`)
    return response.data
  },

  createKey: async (consumerId, data) => {
    const response = await apiClient.post(`/api/consumers/${consumerId}/keys`, data)
    return response.data
  },

  updateKey: async (keyId, data) => {
    const response = await apiClient.patch(`/api/keys/${keyId}`, data)
    return response.data
  },
}
