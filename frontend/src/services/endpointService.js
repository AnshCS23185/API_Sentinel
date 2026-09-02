import { apiClient } from './apiClient'

export const endpointService = {
  getEndpoints: async () => {
    try {
      const response = await apiClient.get('/api/endpoints')
      return response.data
    } catch {
      return [
        {
          id: 1,
          name: 'Get Products',
          description: 'Retrieve list of products',
          method: 'GET',
          path: '/api/products',
          target_url: 'http://demo-api:8002/api/products',
          api_name: 'Products & E-Commerce API',
          is_active: true,
          last_updated: '29/08/2026 09:12 PM',
        },
        {
          id: 2,
          name: 'Get Orders',
          description: 'Retrieve list of orders',
          method: 'GET',
          path: '/api/orders',
          target_url: 'http://demo-api:8002/api/orders',
          api_name: 'Order Processing API',
          is_active: true,
          last_updated: '28/08/2026 04:45 PM',
        },
        {
          id: 3,
          name: 'Create Order',
          description: 'Create a new order',
          method: 'POST',
          path: '/api/orders',
          target_url: 'http://demo-api:8002/api/orders',
          api_name: 'Order Processing API',
          is_active: true,
          last_updated: '27/08/2026 11:38 AM',
        },
      ]
    }
  },

  createEndpoint: async (data) => {
    try {
      const response = await apiClient.post('/api/endpoints', data)
      return response.data
    } catch {
      return {
        id: Date.now(),
        ...data,
        is_active: data.is_active ?? true,
        last_updated: new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      }
    }
  },

  updateEndpoint: async (id, data) => {
    try {
      const response = await apiClient.patch(`/api/endpoints/${id}`, data)
      return response.data
    } catch {
      return { id, ...data }
    }
  },

  getCatalogApis: async () => {
    try {
      const response = await apiClient.get('/api/catalog')
      return response.data
    } catch {
      return [
        {
          id: 1,
          name: 'Products & E-Commerce API',
          description: 'Product catalog and e-commerce operations.',
          status: 'active',
          path: '/api/products',
          target: 'demo-api:8002',
          endpoints_count: 12,
          requests_7d: '42.8K',
          consumers_count: 18,
          last_request: '2 mins ago',
          last_updated: '29/08/2026',
          icon_type: 'cart',
          icon_color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
        },
        {
          id: 2,
          name: 'Order Processing API',
          description: 'Handles order creation, processing and fulfillment operations.',
          status: 'active',
          path: '/api/orders',
          target: 'demo-api:8002',
          endpoints_count: 9,
          requests_7d: '35.6K',
          consumers_count: 24,
          last_request: '5 mins ago',
          last_updated: '28/08/2026',
          icon_type: 'order',
          icon_color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
        },
        {
          id: 3,
          name: 'User Directory API',
          description: 'User profile, authentication and directory management operations.',
          status: 'active',
          path: '/api/users',
          target: 'demo-api:8002',
          endpoints_count: 7,
          requests_7d: '50.0K',
          consumers_count: 29,
          last_request: '1 min ago',
          last_updated: '27/08/2026',
          icon_type: 'users',
          icon_color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-500/30',
        },
      ]
    }
  },

  createApi: async (data) => {
    try {
      const response = await apiClient.post('/api/catalog', data)
      return response.data
    } catch {
      return { id: Date.now(), ...data, status: data.status || 'active', endpoints_count: 1, requests_7d: '0', consumers_count: 0, last_request: 'Just now', last_updated: new Date().toLocaleDateString('en-GB') }
    }
  },

  updateApi: async (id, data) => {
    try {
      const response = await apiClient.patch(`/api/catalog/${id}`, data)
      return response.data
    } catch {
      return { id, ...data }
    }
  },
}
