import api from './index'

export const marketingApi = {
  getCampaigns: () => api.get('/marketing/campaigns'),
  createCampaign: (data: any) => api.post('/marketing/campaigns', data),
  getTemplates: () => api.get('/marketing/templates'),
}
