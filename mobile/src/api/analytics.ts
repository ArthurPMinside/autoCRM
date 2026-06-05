import api from './index'

export const analyticsApi = {
  getSources: (params?: {
    start_date?: string
    end_date?: string
    sort_by?: string
    sort_order?: string
  }) => api.get('/analytics/sources', { params }),
  getRfm: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/rfm', { params }),
  getRevenue: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/revenue', { params }),
  getRetention: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/analytics/retention', { params }),
}
