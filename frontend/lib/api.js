import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:4000/api' })

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
