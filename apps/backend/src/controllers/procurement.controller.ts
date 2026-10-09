import { Request, Response } from "express";
import { ProcurementService } from "../services/procurement.service";
import { AuthRequest } from "../middleware/requireAuth";

export class ProcurementController {
  static async createPR(req: AuthRequest, res: Response) {
    try {
      const pr = await ProcurementService.createPR(req.user!.userId, req.body.items);
      res.status(201).json(pr);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
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

  static async createGR(req: AuthRequest, res: Response) {
    try {
      const { po_id, items } = req.body;
      const gr = await ProcurementService.createGoodsReceipt(req.user!.userId, po_id, items);
      res.status(201).json(gr);
    } catch (error: any) {
      if (error.message === "PO_NOT_FOUND") res.status(404).json({ error: "PO not found", code: "NOT_FOUND" });
      else if (error.message === "INVALID_PO_STATUS") res.status(400).json({ error: "PO is not issued", code: "BAD_REQUEST" });
      else if (error.message === "PO_ITEM_NOT_FOUND") res.status(404).json({ error: "PO Item not found", code: "NOT_FOUND" });
      else res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }
}
