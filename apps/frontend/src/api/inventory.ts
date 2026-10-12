import { apiClient } from "./client";

export const getMaterials = async (includeInactive = false) => {
  const { data } = await apiClient.get(`/materials?includeInactive=${includeInactive}`);
  return data;
};

export const createMaterial = async (materialData: any) => {
  const { data } = await apiClient.post("/materials", materialData);
  return data;
};

export const updateMaterial = async (id: string, materialData: any) => {
  const { data } = await apiClient.patch(`/materials/${id}`, materialData);
  return data;
};

export const getInventory = async () => {
  const { data } = await apiClient.get("/inventory");
  return data;
};

export const adjustInventory = async (transaction: any) => {
  const { data } = await apiClient.post("/inventory/transaction", transaction);
  return data;
};

export const getInventoryTransactions = async (materialId?: string, limit = 100) => {
  const query = materialId ? `?material_id=${materialId}&limit=${limit}` : `?limit=${limit}`;
  const { data } = await apiClient.get(`/inventory/transactions${query}`);
  return data;
};
