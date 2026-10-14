import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../index.js";

describe("Health Endpoints", () => {
  it("should return status 200 at /api/v1/health", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "devfusion-backend");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("should return status 200 at /health (root liveness check)", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "devfusion-backend");
    expect(res.body).toHaveProperty("uptimeSeconds");
  });
});

