import { apiClient } from './apiClient'

export const analyticsService = {
  getSummary: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/summary', { params })
      return response.data
    } catch {
      return null
    }
  },

  getConsumerAnalytics: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/consumers', { params })
      return response.data
    } catch {
      return []
    }
  },

  getApiKeyAnalytics: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/api-keys', { params })
      return response.data
    } catch {
      return []
    }
  },

  getEndpointAnalytics: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/endpoints', { params })
      return response.data
    } catch {
      return []
    }
  },

  getStatusCodeAnalytics: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/status-codes', { params })
      return response.data
    } catch {
      return null
    }
  },

  getMethodAnalytics: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/methods', { params })
      return response.data
    } catch {
      return null
    }
  },

  getTimeSeries: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/timeseries', { params })
      return response.data
    } catch {
      return null
    }
  },

  getLatency: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/latency', { params })
      return response.data
    } catch {
      return null
    }
  },

  getErrors: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/errors', { params })
      return response.data
    } catch {
      return null
    }
  },

  getLogs: async (params) => {
    try {
      const response = await apiClient.get('/api/analytics/logs', { params })
      return response.data
    } catch {
      return []
    }
  },
}
