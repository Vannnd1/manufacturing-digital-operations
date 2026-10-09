import { apiClient } from "./client";

export const getProductionOrders = async () => {
  const { data } = await apiClient.get("/production");
  return data;
};

export const getProductionOrderDetails = async (id: string) => {
  const { data } = await apiClient.get(`/production/${id}`);
  return data;
};

export const createProductionOrder = async (prodoData: any) => {
  const { data } = await apiClient.post("/production", prodoData);
  return data;
};

export const checkAvailability = async (id: string) => {
  const { data } = await apiClient.get(`/production/${id}/availability`);
  return data;
};

export const reserveMaterials = async (id: string) => {
  const { data } = await apiClient.post(`/production/${id}/reserve`);
  return data;
};

export const recordProduction = async (id: string, actual_quantity_produced: number) => {
  const { data } = await apiClient.post(`/production/${id}/record`, { actual_quantity_produced });
  return data;
};
