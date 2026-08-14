import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";

const prescriptionSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  visitId: z.string().min(1),
  medications: z.array(
    z.object({
      name: z.string().min(1),
      dosage: z.string().min(1),
      frequency: z.string().min(1),
      duration: z.string().min(1),
      notes: z.string().optional().default(""),
    })
  ).min(1),
  notes: z.string().optional().default(""),
  followUpDate: z.string().optional().default(""),
});

const prescriptionsStore: Array<{
  id: string;
  patientId: string;
  doctorId: string;
  visitId: string;
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string; notes: string }>;
  notes: string;
  followUpDate: string;
  createdAt: string;
}> = [
  {
    id: "rx_1",
    patientId: "patient_demo_1",
    doctorId: "doc_1001",
    visitId: "visit_1",
    medications: [
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "30 days", notes: "After breakfast" },
      { name: "Vitamin D3", dosage: "1000 IU", frequency: "Once daily", duration: "30 days", notes: "With food" },
    ],
    notes: "Continue current exercise plan and recheck blood pressure in two weeks.",
    followUpDate: "2026-08-28",
    createdAt: new Date().toISOString(),
  },
];

export const prescriptionRouter = Router();

prescriptionRouter.use(requireAuth);

prescriptionRouter.post("/", requireRole(["DOCTOR", "ADMIN"]), (req, res) => {
  const parsed = prescriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid prescription payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const prescription = {
    id: `rx_${Date.now()}`,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  prescriptionsStore.push(prescription);
  res.status(201).json({ prescription });
});

prescriptionRouter.get("/patient/:patientId", requireRole(["PATIENT", "DOCTOR", "ADMIN", "PHARMACIST"]), (req: AuthenticatedRequest, res) => {
  const patientPrescriptions = prescriptionsStore.filter((entry) => entry.patientId === req.params.patientId);
  if (req.user?.role === "PATIENT" && req.user.id !== req.params.patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s prescription history",
        details: null,
      },
    });
    return;
  }

  res.json({ prescriptions: patientPrescriptions });
});

prescriptionRouter.get("/visit/:visitId", requireRole(["PATIENT", "DOCTOR", "PHARMACIST", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  const prescription = prescriptionsStore.find((entry) => entry.visitId === req.params.visitId);
  if (!prescription) {
    res.status(404).json({
      error: {
        code: "PRESCRIPTION_NOT_FOUND",
        message: "Prescription not found for this visit",
        details: null,
      },
    });
    return;
  }

  if (req.user?.role === "PATIENT" && req.user.id !== prescription.patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s prescription",
        details: null,
      },
    });
    return;
  }

  res.json({ prescription });
});

export const getPrescriptions = () => prescriptionsStore;
