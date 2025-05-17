import axios from 'axios';

// const api = axios.create({
//   baseURL: 'https://salao.ws:8000',
//   headers: {
//     Authorization: 'a7c360b6a7a1986ecd15027956d3b39d',
//   },
// });

const api = axios.create({
    baseURL: 'http://localhost:8000', //'http://ec2-3-147-238-182.us-east-2.compute.amazonaws.com:8000'
})

export default api;