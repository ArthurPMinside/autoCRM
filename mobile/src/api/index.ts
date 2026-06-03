import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// Определяем базовый URL API
// В вебе используем LAN IP для доступа с любого устройства в сети
const API_URL =
  (process.env.API_URL as string) ||
  (Platform.OS === 'web'
    ? 'http://192.168.1.15:8001/api/v1'
    : 'http://10.0.2.2:8001/api/v1')

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

export default api
