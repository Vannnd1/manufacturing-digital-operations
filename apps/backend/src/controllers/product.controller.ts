import { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import { AuthRequest } from "../middleware/requireAuth";

export class ProductController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const product = await ProductService.createProduct(req.body, req.user!.userId);
      res.status(201).json(product);
    } catch (error: any) {
      if (error.message === "SKU_EXISTS") {
        res.status(409).json({ error: "Product SKU already exists", code: "CONFLICT" });
      } else {
        res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
      }
    }
  }

  static async list(req: Request, res: Response) {
    try {
      const products = await ProductService.getProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: "Internal Server Error", code: "INTERNAL_ERROR" });
    }
  }
}
