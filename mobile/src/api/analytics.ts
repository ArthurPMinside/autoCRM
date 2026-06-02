import api from './index'

export const analyticsApi = {
  getRfm: () => api.get('/analytics/rfm'),
  getRevenue: () => api.get('/analytics/revenue'),
  getRetention: () => api.get('/analytics/retention'),
  getSources: () => api.get('/analytics/sources'),
}
