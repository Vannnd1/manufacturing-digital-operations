import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  static async getSummary(req: Request, res: Response) {
    try {
      const summary = await DashboardService.getSummary();
      res.json(summary);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }
}
