import { apiClient } from "./client";

export const getSuppliers = async () => {
  const { data } = await apiClient.get("/suppliers");
  return data;
};

export const createSupplier = async (supplier: any) => {
  const { data } = await apiClient.post("/suppliers", supplier);
  return data;
};

export const getPRs = async () => {
  const { data } = await apiClient.get("/procurement/pr");
  return data;
};

export const createPR = async (prData: any) => {
  const { data } = await apiClient.post("/procurement/pr", prData);
  return data;
};

export const approvePR = async (id: string, status: "Approved" | "Rejected") => {
  const { data } = await apiClient.patch(`/procurement/pr/${id}/approve`, { status });
  return data;
};

export const getPOs = async () => {
  const { data } = await apiClient.get("/procurement/po");
  return data;
};

export const createPO = async (poData: any) => {
  const { data } = await apiClient.post("/procurement/po", poData);
  return data;
};

export const createGR = async (grData: any) => {
  const { data } = await apiClient.post("/procurement/gr", grData);
  return data;
};
