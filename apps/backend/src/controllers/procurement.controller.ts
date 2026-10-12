import { Request, Response } from "express";
import { ProcurementService } from "../services/procurement.service";
import { AuthRequest } from "../middleware/requireAuth";

export class ProcurementController {
  static async createPR(req: AuthRequest, res: Response) {
    try {
      const pr = await ProcurementService.createPR(req.user!.userId, req.body.items);
      res.status(201).json(pr);
    } catch (error: any) {
      if (error.message === "EMPTY_ITEMS") res.status(400).json({ error: "Purchase request requires at least one item", code: "BAD_REQUEST" });
      else if (error.message === "DUPLICATE_MATERIAL") res.status(400).json({ error: "Duplicate materials in purchase request", code: "BAD_REQUEST" });
      else if (error.message === "INACTIVE_OR_INVALID_MATERIAL") res.status(400).json({ error: "One or more materials are inactive or do not exist", code: "BAD_REQUEST" });
      else {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }

  static async listPRs(req: Request, res: Response) {
    try {
      const prs = await ProcurementService.getPRs();
      res.json(prs);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async approvePR(req: AuthRequest, res: Response) {
    try {
      const pr = await ProcurementService.approvePR(req.params.id, req.body.status, req.user!.userId);
      res.json(pr);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") res.status(404).json({ error: "PR not found", code: "NOT_FOUND" });
      else if (error.message === "INVALID_TRANSITION") res.status(400).json({ error: "PR is not pending", code: "BAD_REQUEST" });
      else if (error.message === "SELF_APPROVAL_FORBIDDEN") res.status(403).json({ error: "Requesters cannot approve their own purchase requests (Segregation of Duties)", code: "FORBIDDEN" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async createPO(req: AuthRequest, res: Response) {
    try {
      const { pr_id, supplier_id, items } = req.body;
      const po = await ProcurementService.createPO(req.user!.userId, pr_id, supplier_id, items);
      res.status(201).json(po);
    } catch (error: any) {
      if (error.message === "PR_NOT_FOUND") res.status(404).json({ error: "PR not found", code: "NOT_FOUND" });
      else if (error.message === "PR_NOT_APPROVED") res.status(400).json({ error: "PR is not approved", code: "BAD_REQUEST" });
      else if (error.message === "INACTIVE_OR_INVALID_SUPPLIER") res.status(400).json({ error: "Supplier does not exist or is inactive", code: "BAD_REQUEST" });
      else if (error.message === "DUPLICATE_MATERIAL") res.status(400).json({ error: "Duplicate materials in purchase order items", code: "BAD_REQUEST" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async listPOs(req: Request, res: Response) {
    try {
      const pos = await ProcurementService.getPOs();
      res.json(pos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async getPO(req: Request, res: Response) {
    try {
      const po = await ProcurementService.getPOById(req.params.id);
      res.json(po);
    } catch (error: any) {
      if (error.message === "PO_NOT_FOUND") res.status(404).json({ error: "PO not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }

  static async createGR(req: AuthRequest, res: Response) {
    try {
      const { po_id, items } = req.body;
      const gr = await ProcurementService.createGoodsReceipt(req.user!.userId, po_id, items);
      res.status(201).json(gr);
    } catch (error: any) {
      console.error("Failed to create Goods Receipt:", error);
      if (error.message === "PO_NOT_FOUND") res.status(404).json({ error: "PO not found", code: "NOT_FOUND" });
      else if (error.message === "INVALID_PO_STATUS") res.status(400).json({ error: "PO is not issued", code: "BAD_REQUEST" });
      else if (error.message === "PO_ITEM_NOT_FOUND") res.status(404).json({ error: "PO Item not found", code: "NOT_FOUND" });
      else if (error.message === "OVER_RECEIPT") res.status(400).json({ error: "Received quantity cannot exceed PO quantity", code: "BAD_REQUEST" });
      else if (error.message === "DUPLICATE_PO_ITEM") res.status(400).json({ error: "Duplicate items in goods receipt", code: "BAD_REQUEST" });
      else if (error.code === "23503" || error.message?.includes("foreign key") || error.message === "USER_NOT_FOUND") {
        res.status(401).json({ error: "User session expired or user not found. Please log in again.", code: "UNAUTHORIZED" });
      }
      else if (error.message === "MATERIAL_NOT_FOUND") res.status(404).json({ error: "One or more materials in this PO do not exist or are inactive", code: "NOT_FOUND" });
      else if (error.message === "INVENTORY_NOT_FOUND") res.status(404).json({ error: "Inventory record not found for material", code: "NOT_FOUND" });
      else if (error.message === "INVALID_QUANTITY") res.status(400).json({ error: "Received quantity must be greater than zero", code: "BAD_REQUEST" });
      else if (error.message === "NEGATIVE_STOCK") res.status(400).json({ error: "Operation would result in negative stock", code: "BAD_REQUEST" });
      else res.status(500).json({ 
        error: error.message || "Internal Server Error", 
        code: "INTERNAL_ERROR",
        details: error.message
      });
    }
  }
}
