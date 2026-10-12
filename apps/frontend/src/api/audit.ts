import { apiClient } from "./client";

export interface AuditLogItem {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  action_type: string;
  entity_name: string;
  entity_id: string;
  description: string;
  created_at: string;
}

export interface InventoryLedgerItem {
  id: string;
  material_id: string;
  material_sku: string;
  material_name: string;
  unit: string;
  transaction_type: string;
  quantity_change: number;
  reference_id: string | null;
  created_at: string;
}

export const getAuditLogs = async (params?: {
  entity_name?: string;
  entity_id?: string;
  action_type?: string;
  limit?: number;
}): Promise<AuditLogItem[]> => {
  const query = new URLSearchParams();
  if (params?.entity_name) query.set("entity_name", params.entity_name);
  if (params?.entity_id) query.set("entity_id", params.entity_id);
  if (params?.action_type) query.set("action_type", params.action_type);
  if (params?.limit) query.set("limit", String(params.limit));

  const qs = query.toString() ? `?${query.toString()}` : "";
  const { data } = await apiClient.get(`/audit/logs${qs}`);
  return data;
};

export const getProductionOrderTrace = async (prodoId: string) => {
  const { data } = await apiClient.get(`/audit/traceability/prodo/${prodoId}`);
  return data;
};

export const getMaterialTrace = async (materialId: string) => {
  const { data } = await apiClient.get(`/audit/traceability/material/${materialId}`);
  return data;
};
