import { apiClient } from "./client";

export const getProducts = async () => {
  const { data } = await apiClient.get("/products");
  return data;
};

export const createProduct = async (productData: any) => {
  const { data } = await apiClient.post("/products", productData);
  return data;
};
