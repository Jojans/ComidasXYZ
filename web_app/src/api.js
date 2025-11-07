import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
});

export default api;

export const getProducts = async () => {
  const { data } = await api.get("/productos");
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/productos/${id}`);
  return data;
};

export const createProduct = async (product) => {
  const { data } = await api.post("/productos", product);
  return data;
};

export const updateProduct = async (id, product) => {
  const { data } = await api.put(`/productos/${id}`, product);
  return data;
};

export const deleteProduct = async (id) => {
  await api.delete(`/productos/${id}`);
};