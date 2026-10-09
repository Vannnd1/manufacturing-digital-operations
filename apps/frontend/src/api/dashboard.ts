import { apiClient } from "./client";

export const getDashboardSummary = async () => {
  const { data } = await apiClient.get("/dashboard/summary");
  return data;
};
