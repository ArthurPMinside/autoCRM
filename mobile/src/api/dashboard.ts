import api from './index'

export const dashboardApi = {
  getStats: (params?: { start_date?: string; end_date?: string }) =>
    api.get('/dashboard', { params }),
  getActivity: () => api.get('/dashboard/activity'),
}
