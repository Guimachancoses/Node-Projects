import axios from 'axios'

const api = axios.create({
    baseURL: 'http://192.168.7.119:8000' //'http://192.168.10.31:8000'
})

export default api;