import axios from 'axios'

const api = axios.create({
    baseURL: "https://salon.fabrisportalhub.com.br",
})

export default api;