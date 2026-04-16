import axios from 'axios'

const api = axios.create({
<<<<<<< HEAD
    baseURL: 'http://192.168.10.31:8000' //'http://192.168.7.119:8000'
=======
    baseURL: 'http://192.168.7.119:8000' //'http://192.168.10.31:8000'
>>>>>>> parent of 10c19fd (Delete Salon/app directory)
})

export default api;