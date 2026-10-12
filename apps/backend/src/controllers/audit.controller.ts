import { Request, Response } from "express";
import { AuditService } from "../services/audit.service";

export class AuditController {
  static async listLogs(req: Request, res: Response) {
    try {
      const logs = await AuditService.getLogs({
        entity_name: req.query.entity_name as string,
        entity_id: req.query.entity_id as string,
        action_type: req.query.action_type as string,
        user_id: req.query.user_id as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });
      res.json(logs);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async productionOrderTrace(req: Request, res: Response) {
    try {
      const trace = await AuditService.getProductionOrderTrace(req.params.id);
      res.json(trace);
    } catch (error: any) {
      if (error.message === "ORDER_NOT_FOUND") {
        res.status(404).json({ error: "Production order not found", code: "NOT_FOUND" });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }

  static async materialTrace(req: Request, res: Response) {
    try {
      const trace = await AuditService.getMaterialTrace(req.params.id);
      res.json(trace);
    } catch (error: any) {
      if (error.message === "MATERIAL_NOT_FOUND") {
        res.status(404).json({ error: "Material not found", code: "NOT_FOUND" });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }
}
