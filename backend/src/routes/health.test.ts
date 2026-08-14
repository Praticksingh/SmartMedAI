import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../index.js";

describe("GET /api/v1/health", () => {
  it("should return status 200 with service health info", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "devfusion-backend");
    expect(res.body).toHaveProperty("timestamp");
  });
});
