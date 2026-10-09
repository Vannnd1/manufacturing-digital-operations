import request from "supertest";
import app from "./app";
import jwt from "jsonwebtoken";

jest.mock("./db", () => {
  const mDb: any = jest.fn();

  mDb.transaction = jest.fn(async (cb) => {
    const trx = jest.fn((table: string) => {
      if (table === "production_records") return {
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: "prec-1", prodo_id: "prodo-1", actual_quantity_produced: 100, product_id: "prod-1" }),
      };

      if (table === "quality_inspections") return {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: "insp-1" }]),
      };

      if (table === "defect_records") return {
        insert: jest.fn().mockResolvedValue([1]),
      };

      if (table === "finished_goods_records") return {
        insert: jest.fn().mockResolvedValue([1]),
      };

      if (table === "audit_logs") return { insert: jest.fn().mockResolvedValue([1]) };
      return {};
    });
    return await cb(trx);
  });
  return mDb;
});

describe("Quality API", () => {
  const qaToken = jwt.sign({ userId: "user-q", role: "QC" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");
  const prodToken = jwt.sign({ userId: "user-p", role: "Production" }, process.env.JWT_SECRET || "supersecretjwtkey_for_mvp_only");
  const precId = "11111111-1111-1111-1111-111111111111";

  it("should block unauthorized inspection creation", async () => {
    const res = await request(app)
      .post("/api/quality")
      .set("Authorization", `Bearer ${prodToken}`)
      .send({
        production_record_id: precId,
        pass_quantity: 100,
        fail_quantity: 0
      });
    expect(res.status).toBe(403);
  });

  it("should block if pass + fail != actual produced", async () => {
    const res = await request(app)
      .post("/api/quality")
      .set("Authorization", `Bearer ${qaToken}`)
      .send({
        production_record_id: precId,
        pass_quantity: 90,
        fail_quantity: 5 // total 95 != 100
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/equal total produced/i);
  });

  it("should block if defect quantities != fail_quantity", async () => {
    const res = await request(app)
      .post("/api/quality")
      .set("Authorization", `Bearer ${qaToken}`)
      .send({
        production_record_id: precId,
        pass_quantity: 90,
        fail_quantity: 10,
        defects: [{ defect_reason: "Scratch", quantity: 5 }] // only 5, not 10
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Defect quantities must equal/i);
  });

  it("should create inspection successfully with defects", async () => {
    const res = await request(app)
      .post("/api/quality")
      .set("Authorization", `Bearer ${qaToken}`)
      .send({
        production_record_id: precId,
        pass_quantity: 90,
        fail_quantity: 10,
        defects: [{ defect_reason: "Scratch", quantity: 10 }]
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe("insp-1");
  });
});
