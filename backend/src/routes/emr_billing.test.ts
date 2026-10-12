import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { signAccessToken } from "../auth/session.js";

const mockPatients: any[] = [
  { id: "pat_profile_1", userId: "patient_1", fullName: "Jane Doe" },
];

const mockDoctors: any[] = [
  { id: "doc_profile_1", userId: "doctor_1", fullName: "Dr. Smith" },
];

const mockEmrRecords: any[] = [];
const mockInvoices: any[] = [];
const mockPrescriptions: any[] = [];

vi.mock("../db.js", () => {
  return {
    prisma: {
      patientProfile: {
        findUnique: vi.fn(async ({ where }: { where: { id?: string; userId?: string } }) => {
          if (where.id) return mockPatients.find((p) => p.id === where.id) || null;
          if (where.userId) return mockPatients.find((p) => p.userId === where.userId) || null;
          return null;
        }),
      },
      doctorProfile: {
        findUnique: vi.fn(async ({ where }: { where: { id?: string; userId?: string } }) => {
          if (where.id) return mockDoctors.find((d) => d.id === where.id) || null;
          if (where.userId) return mockDoctors.find((d) => d.userId === where.userId) || null;
          return null;
        }),
      },
      eMRRecord: {
        create: vi.fn(async ({ data }: { data: any }) => {
          const newRecord = { id: data.id || `emr_${Date.now()}`, ...data, createdAt: new Date() };
          mockEmrRecords.push(newRecord);
          return newRecord;
        }),
        findMany: vi.fn(async () => mockEmrRecords),
        findFirst: vi.fn(async () => mockEmrRecords[0] || null),
      },
      invoice: {
        create: vi.fn(async ({ data }: { data: any }) => {
          const inv = { id: data.id || `inv_${Date.now()}`, ...data, payments: [], createdAt: new Date() };
          mockInvoices.push(inv);
          return inv;
        }),
        findMany: vi.fn(async () => mockInvoices),
      },
      payment: {
        create: vi.fn(async ({ data }: { data: any }) => ({ id: `pay_${Date.now()}`, ...data })),
      },
      prescription: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return mockPrescriptions.find((p) => p.id === where.id) || null;
        }),
        update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
          const p = mockPrescriptions.find((item) => item.id === where.id);
          if (p) Object.assign(p, data);
          return p;
        }),
      },
      pharmacyFulfillment: {
        create: vi.fn(async ({ data }: { data: any }) => ({ id: `pf_${Date.now()}`, ...data })),
      },
      medicine: {
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: { data: any }) => ({ id: `med_${Date.now()}`, ...data })),
      },
    },
  };
});

import app from "../index.js";

describe("EMR, Billing & Pharmacy Fulfillment Integration", () => {
  const doctorToken = signAccessToken({
    id: "doctor_1",
    email: "doctor@hospital.org",
    role: "DOCTOR",
  });

  const pharmacistToken = signAccessToken({
    id: "pharm_1",
    email: "pharmacy@hospital.org",
    role: "PHARMACIST",
  });

  const patientToken = signAccessToken({
    id: "patient_1",
    email: "patient@hospital.org",
    role: "PATIENT",
  });

  it("should allow a doctor to create an EMR record with diagnosis and prescriptions", async () => {
    const res = await request(app)
      .post("/api/v1/emr/record")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        patientId: "patient_1",
        doctorId: "doctor_1",
        visitId: "visit_cardio_1",
        diagnosis: "Stage 1 Essential Hypertension",
        notes: "Patient advised low sodium diet and regular aerobic exercise.",
        prescriptions: [
          {
            medicine: "Telmisartan",
            dosage: "40mg",
            duration: "30 days",
            instructions: "Take once daily in the morning",
          },
        ],
        allergies: ["Sulfa drugs"],
        chronicConditions: ["Hypertension"],
      });

    expect(res.status).toBe(201);
    expect(res.body.record).toBeDefined();
    expect(res.body.record.diagnosis).toBe("Stage 1 Essential Hypertension");
    expect(res.body.record.prescriptions).toHaveLength(1);
  });

  it("should create a consultation billing invoice", async () => {
    const res = await request(app)
      .post("/api/v1/billing/invoices")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        patientId: "patient_1",
        amount: 800,
        currency: "INR",
        category: "CONSULTATION",
        status: "PENDING",
        paymentMethod: "UPI",
        reference: "UPI-CARDIO-CONSULT-001",
      });

    expect(res.status).toBe(201);
    expect(res.body.invoice).toBeDefined();
    expect(res.body.invoice.amount).toBe(800);
    expect(res.body.invoice.category).toBe("CONSULTATION");
  });

  it("should list invoices for patient or staff", async () => {
    const res = await request(app)
      .get("/api/v1/billing/invoices")
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.invoices).toBeDefined();
    expect(Array.isArray(res.body.invoices)).toBe(true);
  });

  it("should allow pharmacist to fulfill medication request", async () => {
    const res = await request(app)
      .post("/api/v1/pharmacy/fulfill")
      .set("Authorization", `Bearer ${pharmacistToken}`)
      .send({
        prescriptionId: "rx_demo_101",
        medicationName: "Amlodipine",
        quantity: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.fulfillment).toBeDefined();
    expect(res.body.fulfillment.status).toBe("FULFILLED");
  });
});
