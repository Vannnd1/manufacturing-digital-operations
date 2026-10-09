import { Request, Response } from "express";
import { MaterialService } from "../services/material.service";
import { AuthRequest } from "../middleware/requireAuth";

export class MaterialController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const material = await MaterialService.createMaterial(req.body, req.user!.userId);
      res.status(201).json(material);
    } catch (error: any) {
      if (error.message === "SKU_EXISTS") {
        res.status(409).json({ error: "Material with this SKU already exists", code: "CONFLICT" });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const materials = await MaterialService.getMaterials(includeInactive);
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const material = await MaterialService.getMaterialById(req.params.id);
      res.json(material);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Material not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const material = await MaterialService.updateMaterial(req.params.id, req.body, req.user!.userId);
      res.json(material);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Material not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }
}
