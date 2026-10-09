import { apiClient } from "./client";

export const getInspections = async () => {
  const { data } = await apiClient.get("/quality");
  return data;
};

export const getPendingInspections = async () => {
  const { data } = await apiClient.get("/quality/pending");
  return data;
};

export const getInspectionDetails = async (id: string) => {
  const { data } = await apiClient.get(`/quality/${id}`);
  return data;
};

export const createInspection = async (inspectionData: any) => {
  const { data } = await apiClient.post("/quality", inspectionData);
  return data;
};
