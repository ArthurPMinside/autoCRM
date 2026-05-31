import api from './index'

export const authApi = {
  login: (data: { email: string; password: string }) => {
    const params = new URLSearchParams()
    params.append('username', data.email)
    params.append('password', data.password)
    return api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  register: (data: { email: string; password: string; name: string }) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}
