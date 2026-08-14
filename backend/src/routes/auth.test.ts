import { describe, expect, it, vi } from "vitest";
import request from "supertest";

const mockUsers: any[] = [];

vi.mock("../db.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email) {
            return mockUsers.find((u) => u.email.toLowerCase() === where.email?.toLowerCase()) || null;
          }
          if (where.id) {
            return mockUsers.find((u) => u.id === where.id) || null;
          }
          return null;
        }),
        create: vi.fn(async ({ data }: { data: any }) => {
          const newUser = { id: `usr_${Date.now()}`, ...data };
          mockUsers.push(newUser);
          return newUser;
        }),
      },
      patientProfile: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }: { data: any }) => ({ id: `pat_${Date.now()}`, ...data })),
      },
      doctorProfile: {
        findUnique: vi.fn(async () => null),
      },
      staffProfile: {
        findUnique: vi.fn(async () => null),
      },
    },
  };
});

import app from "../index.js";

describe("Auth Endpoints & 3-Attempt Lockout Security", () => {
  const testEmail = `user_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  it("should register a user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: testEmail,
      password: testPassword,
      firstName: "Alex",
      lastName: "Morgan",
      role: "PATIENT",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("email", testEmail.toLowerCase());
  });

  it("should enforce account lockout after 3 failed login attempts", async () => {
    const lockoutEmail = `lockout_${Date.now()}@example.com`;

    // Failed attempt 1
    const res1 = await request(app).post("/api/v1/auth/login").send({
      email: lockoutEmail,
      password: "WrongPassword1",
    });
    expect(res1.status).toBe(401);

    // Failed attempt 2
    const res2 = await request(app).post("/api/v1/auth/login").send({
      email: lockoutEmail,
      password: "WrongPassword2",
    });
    expect(res2.status).toBe(401);

    // Failed attempt 3 -> should trigger 429 ACCOUNT_LOCKED
    const res3 = await request(app).post("/api/v1/auth/login").send({
      email: lockoutEmail,
      password: "WrongPassword3",
    });
    expect(res3.status).toBe(429);
    expect(res3.body.error).toHaveProperty("code", "ACCOUNT_LOCKED");
  });

  it("should login registered user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: testEmail,
      password: testPassword,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "PATIENT");
  });

  it("should reject unauthenticated request to /me", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
  });
});
