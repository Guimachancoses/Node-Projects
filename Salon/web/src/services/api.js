import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  // withCredentials: true, // habilite se usar cookie/sessão
});

export default api;