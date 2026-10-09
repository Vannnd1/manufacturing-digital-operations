import request from "supertest";
import app from "./app";

describe("Health Check API", () => {
  it("should return 200 OK from /api/health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
  });
});
