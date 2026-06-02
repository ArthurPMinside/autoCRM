import Constants from 'expo-constants'

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.API_URL ||
  'http://localhost:8001/api/v1'
