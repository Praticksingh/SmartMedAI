import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { signAccessToken } from "../auth/session.js";

const mockVisits: any[] = [
  {
    id: "visit_cardio_1",
    departmentId: "dept_cardio",
    patientId: "patient_1",
    priority: "P2_HIGH",
    department: { id: "dept_cardio", name: "Cardiology" },
  },
  {
    id: "visit_cardio_2",
    departmentId: "dept_cardio",
    patientId: "patient_2",
    priority: "P4_ROUTINE",
    department: { id: "dept_cardio", name: "Cardiology" },
  },
  {
    id: "visit_ortho_1",
    departmentId: "dept_ortho",
    patientId: "patient_3",
    priority: "P1_CRITICAL",
    department: { id: "dept_ortho", name: "Orthopedics" },
  },
];

const mockQueueEntries: any[] = [];

vi.mock("../db.js", () => {
  return {
    prisma: {
      visit: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return mockVisits.find((v) => v.id === where.id) || null;
        }),
      },
      queueEntry: {
        findMany: vi.fn(async ({ where }: { where?: any } = {}) => {
          if (where?.status?.in) {
            return mockQueueEntries.filter((q) => where.status.in.includes(q.status));
          }
          return mockQueueEntries;
        }),
        findFirst: vi.fn(async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
          let filtered = [...mockQueueEntries];
          if (where?.departmentId) {
            filtered = filtered.filter((q) => q.departmentId === where.departmentId);
          }
          if (where?.status?.in) {
            filtered = filtered.filter((q) => where.status.in.includes(q.status));
          }
          if (orderBy?.position === "desc") {
            filtered.sort((a, b) => b.position - a.position);
          }
          return filtered[0] || null;
        }),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return mockQueueEntries.find((q) => q.id === where.id) || null;
        }),
        create: vi.fn(async ({ data, include }: { data: any; include?: any }) => {
          const entry = {
            id: `qe_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            ...data,
            visit: mockVisits.find((v) => v.id === data.visitId),
            department: { id: data.departmentId, name: "Cardiology" },
          };
          mockQueueEntries.push(entry);
          return entry;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
          const idx = mockQueueEntries.findIndex((q) => q.id === where.id);
          if (idx !== -1) {
            mockQueueEntries[idx] = { ...mockQueueEntries[idx], ...data };
            return mockQueueEntries[idx];
          }
          throw new Error("Entry not found");
        }),
      },
      $transaction: vi.fn(async (cb: any) => {
        return cb({
          queueEntry: {
            findFirst: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
              let filtered = [...mockQueueEntries];
              if (where?.departmentId) {
                filtered = filtered.filter((q) => q.departmentId === where.departmentId);
              }
              if (where?.status?.in) {
                filtered = filtered.filter((q) => where.status.in.includes(q.status));
              }
              if (orderBy?.position === "desc") {
                filtered.sort((a, b) => b.position - a.position);
              }
              return filtered[0] || null;
            },
            create: async ({ data }: { data: any }) => {
              const entry = {
                id: `qe_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                ...data,
                visit: mockVisits.find((v) => v.id === data.visitId),
                department: { id: data.departmentId, name: "Dept" },
              };
              mockQueueEntries.push(entry);
              return entry;
            },
          },
        });
      }),
    },
  };
});

import app from "../index.js";

describe("Queue Engine & Routing (Department Scoping & Priority)", () => {
  const staffToken = signAccessToken({
    id: "staff_1",
    email: "staff@hospital.org",
    role: "DEPARTMENT_STAFF",
  });

  const patientToken = signAccessToken({
    id: "patient_1",
    email: "patient@hospital.org",
    role: "PATIENT",
  });

  it("should check-in first patient and assign position 1 in Cardiology", async () => {
    const res = await request(app)
      .post("/api/v1/queues/checkin")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ visitId: "visit_cardio_1" });

    expect(res.status).toBe(201);
    expect(res.body.queueEntry).toBeDefined();
    expect(res.body.queueEntry.position).toBe(1);
    expect(res.body.queueEntry.departmentId).toBe("dept_cardio");
  });

  it("should check-in second patient in Cardiology and increment position to 2", async () => {
    const res = await request(app)
      .post("/api/v1/queues/checkin")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ visitId: "visit_cardio_2" });

    expect(res.status).toBe(201);
    expect(res.body.queueEntry.position).toBe(2);
    expect(res.body.queueEntry.departmentId).toBe("dept_cardio");
  });

  it("should check-in patient in Orthopedics and independently scope position to 1", async () => {
    const res = await request(app)
      .post("/api/v1/queues/checkin")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ visitId: "visit_ortho_1" });

    expect(res.status).toBe(201);
    expect(res.body.queueEntry.position).toBe(1);
    expect(res.body.queueEntry.departmentId).toBe("dept_ortho");
  });

  it("should allow staff to update queue entry status to CALLED", async () => {
    const firstEntry = mockQueueEntries[0];
    const res = await request(app)
      .patch(`/api/v1/queues/${firstEntry.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "CALLED" });

    expect(res.status).toBe(200);
    expect(res.body.queueEntry.status).toBe("CALLED");
  });

  it("should forbid patient role from updating queue status", async () => {
    const firstEntry = mockQueueEntries[0];
    const res = await request(app)
      .patch(`/api/v1/queues/${firstEntry.id}/status`)
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ status: "COMPLETED" });

    expect(res.status).toBe(403);
  });

  it("should provide live queue data to authenticated patients", async () => {
    const res = await request(app)
      .get("/api/v1/queues/live")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("summary");
    expect(res.body).toHaveProperty("queue");
    expect(Array.isArray(res.body.queue)).toBe(true);
  });
});
