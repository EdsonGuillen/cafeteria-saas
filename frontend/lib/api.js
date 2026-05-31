import axios from 'axios'

const api = axios.create({ baseURL: 'https://cafeteria-saasv2-backend.onrender.com/' })

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(r => r.startsWith('token='))
      ?.split('=')[1]
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
