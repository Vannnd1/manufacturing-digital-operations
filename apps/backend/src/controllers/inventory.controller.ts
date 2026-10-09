import { Request, Response } from "express";
import { InventoryService } from "../services/inventory.service";
import { AuthRequest } from "../middleware/requireAuth";

export class InventoryController {
  static async list(req: Request, res: Response) {
    try {
      const inventory = await InventoryService.getInventory();
      res.json(inventory);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async adjust(req: AuthRequest, res: Response) {
    try {
      const { material_id, quantity_change, type, reference_id } = req.body;
      const tx = await InventoryService.recordTransaction(
        material_id,
        quantity_change,
        type,
        req.user!.userId,
        reference_id
      );
      res.status(201).json(tx);
    } catch (error: any) {
      if (error.message === "MATERIAL_NOT_FOUND") res.status(404).json({ error: "Material not found or inactive", code: "NOT_FOUND" });
      else if (error.message === "NEGATIVE_STOCK") res.status(409).json({ error: "Stock cannot become negative", code: "CONFLICT" });
      else if (error.message === "INVALID_QUANTITY") res.status(400).json({ error: "Invalid quantity", code: "BAD_REQUEST" });
      else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }
}
