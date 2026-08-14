import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";

const recordSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  visitId: z.string().min(1),
  diagnosis: z.string().min(1),
  notes: z.string().min(1),
  prescriptions: z.array(
    z.object({
      medicine: z.string().min(1),
      dosage: z.string().min(1),
      duration: z.string().min(1),
      instructions: z.string().optional().default(""),
    })
  ).default([]),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
});

const recordStore: Array<{
  id: string;
  patientId: string;
  doctorId: string;
  visitId: string;
  diagnosis: string;
  notes: string;
  prescriptions: Array<{ medicine: string; dosage: string; duration: string; instructions: string }>;
  allergies: string[];
  chronicConditions: string[];
  createdAt: string;
}> = [
  {
    id: "emr_1",
    patientId: "patient_demo_1",
    doctorId: "doc_1001",
    visitId: "visit_1",
    diagnosis: "Hypertension follow-up",
    notes: "Blood pressure stable after medication adjustment; continue monitoring and repeat check in 2 weeks.",
    prescriptions: [
      { medicine: "Amlodipine", dosage: "5mg", duration: "30 days", instructions: "Once daily after breakfast" },
    ],
    allergies: ["Penicillin"],
    chronicConditions: ["Hypertension"],
    createdAt: new Date().toISOString(),
  },
];

export const emrRouter = Router();

emrRouter.use(requireAuth);

emrRouter.get("/patient/:patientId", requireRole(["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  const patientRecords = recordStore.filter((entry) => entry.patientId === req.params.patientId);
  if (req.user?.role === "PATIENT" && req.user.id !== req.params.patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s records",
        details: null,
      },
    });
    return;
  }

  res.json({ records: patientRecords });
});

emrRouter.get("/visit/:visitId", requireRole(["DOCTOR", "RECEPTIONIST", "ADMIN", "PATIENT"]), (req: AuthenticatedRequest, res) => {
  const visitRecord = recordStore.find((entry) => entry.visitId === req.params.visitId);
  if (!visitRecord) {
    res.status(404).json({
      error: {
        code: "RECORD_NOT_FOUND",
        message: "Medical record not found for this visit",
        details: null,
      },
    });
    return;
  }

  if (req.user?.role === "PATIENT" && req.user.id !== visitRecord.patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s visit record",
        details: null,
      },
    });
    return;
  }

  res.json({ record: visitRecord });
});

emrRouter.post("/record", requireRole(["DOCTOR", "ADMIN"]), (req, res) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid EMR record payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const record = {
    id: `emr_${Date.now()}`,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  recordStore.push(record);

  res.status(201).json({ record });
});

emrRouter.get("/summary/:patientId", requireRole(["PATIENT", "DOCTOR", "ADMIN"]), (req: AuthenticatedRequest, res) => {
  const patientRecords = recordStore.filter((entry) => entry.patientId === req.params.patientId);
  if (req.user?.role === "PATIENT" && req.user.id !== req.params.patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s summary",
        details: null,
      },
    });
    return;
  }

  res.json({
    patientId: req.params.patientId,
    totalVisits: patientRecords.length,
    latestDiagnosis: patientRecords[patientRecords.length - 1]?.diagnosis ?? null,
    allergies: Array.from(new Set(patientRecords.flatMap((entry) => entry.allergies))),
    chronicConditions: Array.from(new Set(patientRecords.flatMap((entry) => entry.chronicConditions))),
  });
});

export const getEmrRecords = () => recordStore;
