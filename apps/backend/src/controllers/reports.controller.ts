import { Request, Response } from "express";
import { ReportsService } from "../services/reports.service";
import { ReportQueryParams, ReportExportParams } from "../schemas/reports.schema";

export class ReportsController {
  static async getSummary(req: Request, res: Response) {
    try {
      const summary = await ReportsService.getSummary(req.query as unknown as ReportQueryParams);
      res.json(summary);
    } catch (error) {
      console.error("[Reports] Summary error:", error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async getInventoryReport(req: Request, res: Response) {
    try {
      const report = await ReportsService.getInventoryReport(req.query as unknown as ReportQueryParams);
      res.json(report);
    } catch (error) {
      console.error("[Reports] Inventory report error:", error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async getProcurementReport(req: Request, res: Response) {
    try {
      const report = await ReportsService.getProcurementReport(req.query as unknown as ReportQueryParams);
      res.json(report);
    } catch (error) {
      console.error("[Reports] Procurement report error:", error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async getProductionReport(req: Request, res: Response) {
    try {
      const report = await ReportsService.getProductionReport(req.query as unknown as ReportQueryParams);
      res.json(report);
    } catch (error) {
      console.error("[Reports] Production report error:", error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async getQualityReport(req: Request, res: Response) {
    try {
      const report = await ReportsService.getQualityReport(req.query as unknown as ReportQueryParams);
      res.json(report);
    } catch (error) {
      console.error("[Reports] Quality report error:", error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async exportReport(req: Request, res: Response) {
    try {
      const { filename, csv } = await ReportsService.exportReport(req.query as unknown as ReportExportParams);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error: any) {
      if (error.message === "INVALID_REPORT_TYPE") {
        return res.status(400).json({ error: "Invalid report type", code: "BAD_REQUEST" });
      }
      console.error("[Reports] Export error:", error);
      res.status(500).json({ error: "Failed to generate report export", code: "INTERNAL_ERROR" });
    }
  }
}
