require("dotenv").config();
const axios = require("axios");

const api_key = process.env.MERCADO_PAGO_ACCESS_TOKEN;

const api = axios.create({
  baseURL: "https://api.mercadopago.com",
  headers: {
    Authorization: `Bearer ${api_key}`,
    "Content-Type": "application/json"
  },
});

/**
 * Faz uma requisição para o Mercado Pago com o método especificado.
 * @param {string} endpoint - O endpoint da API.
 * @param {object} data - Os dados da requisição (usado em métodos como POST, PUT, etc).
 * @param {string} method - O método HTTP: 'get', 'post', 'put', 'delete', etc.
 * @param {object} [extraHeaders] - Headers adicionais que serão adicionados (não sobrescrevem os padrões).
 * @returns {Promise<object>}
 */
module.exports = async (endpoint, data = {}, method = "post", extraHeaders = {}) => {
  try {
    const defaultHeaders = {
      Authorization: `Bearer ${api_key}`,
      "Content-Type": "application/json"
    };

    const headers = {
      ...defaultHeaders,
      ...Object.fromEntries(
        Object.entries(extraHeaders).filter(([key]) => !defaultHeaders.hasOwnProperty(key))
      )
    };

    const config = {
      method,
      url: endpoint,
      headers,
      ...(method === "get" ? { params: data } : { data })
    };

    const response = await api.request(config);

    return { error: false, data: response.data };
  } catch (err) {
    return {
      error: true,
      message: JSON.stringify(err.response?.data?.message || err.message),
      status: err.response?.status,  // Código de status da resposta
    response: err.response?.data,  // Dados completos de erro (se houver)
    };
  }
};
