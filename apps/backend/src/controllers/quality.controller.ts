import { Request, Response } from "express";
import { QualityService } from "../services/quality.service";
import { AuthRequest } from "../middleware/requireAuth";

export class QualityController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const inspection = await QualityService.createInspection(req.user!.userId, req.body);
      res.status(201).json(inspection);
    } catch (error: any) {
      if (error.message === "PRODUCTION_RECORD_NOT_FOUND") res.status(404).json({ error: "Production record not found", code: "NOT_FOUND" });
      else if (error.message === "INSPECTION_EXISTS") res.status(409).json({ error: "Inspection already exists for this record", code: "CONFLICT" });
      else if (error.message === "QUANTITY_MISMATCH") res.status(400).json({ error: "Pass and fail quantity must equal total produced quantity", code: "BAD_REQUEST" });
      else if (error.message === "DEFECT_QUANTITY_MISMATCH") res.status(400).json({ error: "Defect quantities must equal fail quantity", code: "BAD_REQUEST" });
      else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const inspections = await QualityService.getInspections();
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const inspection = await QualityService.getInspectionDetails(req.params.id);
      res.json(inspection);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Inspection not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async listPending(req: Request, res: Response) {
    try {
      const pending = await QualityService.getPendingProductionRecords();
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }
}
