import { Request, Response } from "express";
import { SupplierService } from "../services/supplier.service";
import { AuthRequest } from "../middleware/requireAuth";

export class SupplierController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const supplier = await SupplierService.createSupplier(req.body, req.user!.userId);
      res.status(201).json(supplier);
    } catch (error: any) {
      if (error.message === "SUPPLIER_EXISTS") {
        res.status(409).json({ error: "Supplier already exists", code: "CONFLICT" });
      } else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const suppliers = await SupplierService.getSuppliers(includeInactive);
      res.json(suppliers);
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id);
      res.json(supplier);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Supplier not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const supplier = await SupplierService.updateSupplier(req.params.id, req.body, req.user!.userId);
      res.json(supplier);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Supplier not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }
}
