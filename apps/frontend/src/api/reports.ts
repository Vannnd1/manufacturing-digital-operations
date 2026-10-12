import { apiClient } from "./client";

export interface ReportFilterOptions {
  range?: "7d" | "30d" | "all" | "custom";
  startDate?: string;
  endDate?: string;
  materialId?: string;
}

const buildQueryString = (options?: ReportFilterOptions) => {
  if (!options) return "";
  const params = new URLSearchParams();
  if (options.range) params.append("range", options.range);
  if (options.startDate) params.append("startDate", options.startDate);
  if (options.endDate) params.append("endDate", options.endDate);
  if (options.materialId) params.append("materialId", options.materialId);
  const q = params.toString();
  return q ? `?${q}` : "";
};

export const getReportsSummary = async (options?: ReportFilterOptions) => {
  const { data } = await apiClient.get(`/reports/summary${buildQueryString(options)}`);
  return data;
};

export const getInventoryReport = async (options?: ReportFilterOptions) => {
  const { data } = await apiClient.get(`/reports/inventory-movements${buildQueryString(options)}`);
  return data;
};

export const getProcurementReport = async (options?: ReportFilterOptions) => {
  const { data } = await apiClient.get(`/reports/procurement-spend${buildQueryString(options)}`);
  return data;
};

export const getProductionReport = async (options?: ReportFilterOptions) => {
  const { data } = await apiClient.get(`/reports/production-yield${buildQueryString(options)}`);
  return data;
};

export const getQualityReport = async (options?: ReportFilterOptions) => {
  const { data } = await apiClient.get(`/reports/quality-defects${buildQueryString(options)}`);
  return data;
};

export const downloadReportCsv = async (
  type: "inventory" | "procurement" | "production" | "quality",
  options?: ReportFilterOptions
) => {
  const query = buildQueryString({ ...options });
  const separator = query ? "&" : "?";
  const url = `/reports/export${query}${separator}type=${type}`;

  const response = await apiClient.get(url, {
    responseType: "blob",
  });

  // Extract filename from header or fallback
  const contentDisposition = response.headers["content-disposition"];
  let filename = `${type}-report.csv`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  // Trigger browser download
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
