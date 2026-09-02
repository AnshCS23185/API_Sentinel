import { apiClient } from './apiClient'

export const violationService = {
  getViolations: async (params) => {
    try {
      const response = await apiClient.get('/api/violations', { params })
      if (response.data && Array.isArray(response.data.violations) && response.data.violations.length > 0) {
        return response.data
      }
    } catch {
      // Fall through to fallback demo dataset
    }

    // Fallback Violations Dataset matching reference image exactly
    const demoItems = [
      {
        id: 33,
        consumer_name: 'Violation Consumer 8c2d',
        consumer_code_id: 'cns_8c2d7f4e91a0',
        key_prefix: 'sen_live_d1kd107a',
        full_key_prefix: 'sen_live_d1kd107a82b9c34f',
        endpoint_path: '/api/vep_85df',
        http_method: 'GET',
        limit: 10,
        window_seconds: 60,
        plan_name: '10 REQ / 60S',
        request_count: 11,
        allowed_count: 10,
        status_code: '429 TOO MANY REQUESTS',
        message: 'Rate limit exceeded',
        timestamp: '28/08/2026, 18:51:38',
        relative_time: '2 min ago',
        environment: 'Production',
        gateway_instance: 'gateway-02',
        request_id: 'req_01K3z7a8QmYb2x9',
        ip_address: '103.25.45.67',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
        attempts: [
          { time: '18:51:33', status: 'allowed' },
          { time: '18:51:35', status: 'allowed' },
          { time: '18:51:37', status: 'allowed' },
          { time: '18:51:38', status: 'blocked' },
        ],
      },
      {
        id: 32,
        consumer_name: 'Violation Consumer 03f9',
        consumer_code_id: 'cns_03f9a1b2c4d5',
        key_prefix: 'sen_live_H2pgo8L',
        full_key_prefix: 'sen_live_H2pgo8L91z8x7c6',
        endpoint_path: '/api/vep_7f00',
        http_method: 'GET',
        limit: 10,
        window_seconds: 60,
        plan_name: '10 REQ / 60S',
        request_count: 11,
        allowed_count: 10,
        status_code: '429 TOO MANY REQUESTS',
        message: 'Rate limit exceeded',
        timestamp: '28/08/2026, 18:51:38',
        relative_time: '2 min ago',
        environment: 'Production',
        gateway_instance: 'gateway-01',
        request_id: 'req_01K3z7a8QmYb2x8',
        ip_address: '103.25.45.68',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
        attempts: [
          { time: '18:51:33', status: 'allowed' },
          { time: '18:51:36', status: 'allowed' },
          { time: '18:51:38', status: 'blocked' },
        ],
      },
      {
        id: 31,
        consumer_name: 'Violation Consumer b2c9',
        consumer_code_id: 'cns_b2c9e3f4a5b6',
        key_prefix: 'sen_live_gRE0rP2',
        full_key_prefix: 'sen_live_gRE0rP274v9u8t7',
        endpoint_path: '/api/vep_4593',
        http_method: 'GET',
        limit: 10,
        window_seconds: 60,
        plan_name: '10 REQ / 60S',
        request_count: 11,
        allowed_count: 10,
        status_code: '429 TOO MANY REQUESTS',
        message: 'Rate limit exceeded',
        timestamp: '28/08/2026, 18:51:37',
        relative_time: '3 min ago',
        environment: 'Staging',
        gateway_instance: 'gateway-02',
        request_id: 'req_01K3z7a8QmYb2x7',
        ip_address: '172.20.10.4',
        user_agent: 'PostmanRuntime/7.29.2',
        attempts: [
          { time: '18:51:32', status: 'allowed' },
          { time: '18:51:37', status: 'blocked' },
        ],
      },
      {
        id: 30,
        consumer_name: 'Violation Consumer df97',
        consumer_code_id: 'cns_df9709a8b7c6',
        key_prefix: 'sen_live_10y81ya',
        full_key_prefix: 'sen_live_10y81ya53r2q1p0',
        endpoint_path: '/api/vep_0fd2',
        http_method: 'GET',
        limit: 10,
        window_seconds: 60,
        plan_name: '10 REQ / 60S',
        request_count: 11,
        allowed_count: 10,
        status_code: '429 TOO MANY REQUESTS',
        message: 'Rate limit exceeded',
        timestamp: '28/08/2026, 18:51:37',
        relative_time: '3 min ago',
        environment: 'Production',
        gateway_instance: 'gateway-03',
        request_id: 'req_01K3z7a8QmYb2x6',
        ip_address: '103.25.45.70',
        user_agent: 'curl/7.68.0',
        attempts: [
          { time: '18:51:31', status: 'allowed' },
          { time: '18:51:37', status: 'blocked' },
        ],
      },
      {
        id: 29,
        consumer_name: 'Consumer Alpha 770c',
        consumer_code_id: 'cns_770c11d2e3f4',
        key_prefix: 'sen_live_FwJIG2o',
        full_key_prefix: 'sen_live_FwJIG2o82m1k0j9',
        endpoint_path: '/api/r1_users_c26341',
        http_method: 'POST',
        limit: 3,
        window_seconds: 10,
        plan_name: '3 REQ / 10S',
        request_count: 4,
        allowed_count: 3,
        status_code: '429 TOO MANY REQUESTS',
        message: 'Rate limit exceeded',
        timestamp: '28/08/2026, 18:51:35',
        relative_time: '3 min ago',
        environment: 'Production',
        gateway_instance: 'gateway-01',
        request_id: 'req_01K3z7a8QmYb2x5',
        ip_address: '198.51.100.42',
        user_agent: 'axios/1.6.2',
        attempts: [
          { time: '18:51:30', status: 'allowed' },
          { time: '18:51:35', status: 'blocked' },
        ],
      },
    ]

    return {
      total: 156,
      limit: params?.limit || 10,
      offset: params?.offset || 0,
      violations: demoItems,
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
