import { Request, Response } from "express";
import { ProductionService } from "../services/production.service";
import { AuthRequest } from "../middleware/requireAuth";

export class ProductionController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const prodo = await ProductionService.createProductionOrder(req.user!.userId, req.body);
      res.status(201).json(prodo);
    } catch (error: any) {
      if (error.message === "PRODUCT_NOT_FOUND") res.status(404).json({ error: "Product not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const orders = await ProductionService.getProductionOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async get(req: Request, res: Response) {
    try {
      const order = await ProductionService.getOrderDetails(req.params.id);
      res.json(order);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Production order not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async checkAvailability(req: Request, res: Response) {
    try {
      const result = await ProductionService.checkAvailability(req.params.id);
      res.json(result);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Production order not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async reserve(req: AuthRequest, res: Response) {
    try {
      await ProductionService.reserveMaterials(req.user!.userId, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Production order not found", code: "NOT_FOUND" });
      else if (error.message === "INVALID_STATUS") res.status(400).json({ error: "Invalid status for reservation", code: "BAD_REQUEST" });
      else if (error.message === "NEGATIVE_STOCK") res.status(409).json({ error: "Insufficient available stock", code: "CONFLICT" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async record(req: AuthRequest, res: Response) {
    try {
      const record = await ProductionService.recordProduction(req.user!.userId, req.params.id, req.body.actual_quantity_produced);
      res.status(201).json(record);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "Production order not found", code: "NOT_FOUND" });
      else if (error.message === "INVALID_STATUS") res.status(400).json({ error: "Order is not ready or in progress", code: "BAD_REQUEST" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }
}
