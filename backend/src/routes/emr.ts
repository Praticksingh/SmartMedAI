import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

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

type EMRItem = {
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
};

const recordStore: EMRItem[] = [
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

emrRouter.get("/patient/:patientId", requireRole(["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN", "HOSPITAL_ADMIN"]), async (req: AuthenticatedRequest, res) => {
  const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
  if (req.user?.role === "PATIENT" && req.user.id !== patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s records",
        details: null,
      },
    });
    return;
  }

  try {
    const dbRecords = await prisma.eMRRecord.findMany({
      where: { patientId },
      include: { prescriptions: true, doctor: true },
      orderBy: { createdAt: "desc" },
    });
    if (dbRecords.length > 0) {
      res.json({
        records: dbRecords.map((r) => ({
          id: r.id,
          patientId: r.patientId,
          doctorId: r.doctorId,
          visitId: r.visitId || "",
          diagnosis: r.diagnosis,
          notes: r.notes || "",
          prescriptions: r.prescriptions.map((p) => ({
            medicine: p.medicineName,
            dosage: p.dosage,
            duration: p.duration,
            instructions: p.instructions || "",
          })),
          allergies: [],
          chronicConditions: [],
          createdAt: r.createdAt.toISOString(),
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  const patientRecords = recordStore.filter((entry) => entry.patientId === patientId);
  res.json({ records: patientRecords });
});

emrRouter.get("/visit/:visitId", requireRole(["DOCTOR", "RECEPTIONIST", "ADMIN", "HOSPITAL_ADMIN", "PATIENT"]), async (req: AuthenticatedRequest, res) => {
  const visitId = Array.isArray(req.params.visitId) ? req.params.visitId[0] : req.params.visitId;

  try {
    const dbRecord = await prisma.eMRRecord.findFirst({
      where: { visitId },
      include: { prescriptions: true, doctor: true },
    });
    if (dbRecord) {
      if (req.user?.role === "PATIENT" && req.user.id !== dbRecord.patientId) {
        res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You cannot access another patient’s visit record",
            details: null,
          },
        });
        return;
      }

      res.json({
        record: {
          id: dbRecord.id,
          patientId: dbRecord.patientId,
          doctorId: dbRecord.doctorId,
          visitId: dbRecord.visitId || "",
          diagnosis: dbRecord.diagnosis,
          notes: dbRecord.notes || "",
          prescriptions: dbRecord.prescriptions.map((p) => ({
            medicine: p.medicineName,
            dosage: p.dosage,
            duration: p.duration,
            instructions: p.instructions || "",
          })),
          allergies: [],
          chronicConditions: [],
          createdAt: dbRecord.createdAt.toISOString(),
        },
      });
      return;
    }
  } catch {
    // fallback
  }

  const visitRecord = recordStore.find((entry) => entry.visitId === visitId);
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

emrRouter.post("/record", requireRole(["DOCTOR", "ADMIN", "HOSPITAL_ADMIN"]), async (req, res) => {
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

  const recordId = `emr_${Date.now()}`;
  const now = new Date().toISOString();

  try {
    let patient = await prisma.patientProfile.findUnique({ where: { id: parsed.data.patientId } });
    if (!patient) {
      patient = await prisma.patientProfile.findUnique({ where: { userId: parsed.data.patientId } });
    }

    let doctor = await prisma.doctorProfile.findUnique({ where: { id: parsed.data.doctorId } });
    if (!doctor) {
      doctor = await prisma.doctorProfile.findUnique({ where: { userId: parsed.data.doctorId } });
    }

    if (patient && doctor) {
      await prisma.eMRRecord.create({
        data: {
          id: recordId,
          patientId: patient.id,
          doctorId: doctor.id,
          visitId: parsed.data.visitId,
          visitDate: new Date(),
          diagnosis: parsed.data.diagnosis,
          notes: parsed.data.notes,
          symptoms: [],
          attachments: [],
          prescriptions: {
            create: parsed.data.prescriptions.map((rx) => ({
              patientId: patient!.id,
              doctorId: doctor!.id,
              medicineName: rx.medicine,
              dosage: rx.dosage,
              frequency: "Daily",
              duration: rx.duration,
              instructions: rx.instructions,
            })),
          },
        },
      });
    }
  } catch {
    // fallback
  }

  const record: EMRItem = {
    id: recordId,
    ...parsed.data,
    createdAt: now,
  };

  recordStore.push(record);
  res.status(201).json({ record });
});

emrRouter.get("/summary/:patientId", requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL_ADMIN"]), async (req: AuthenticatedRequest, res) => {
  const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
  if (req.user?.role === "PATIENT" && req.user.id !== patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s summary",
        details: null,
      },
    });
    return;
  }

  try {
    const dbRecords = await prisma.eMRRecord.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    if (dbRecords.length > 0) {
      res.json({
        patientId,
        totalVisits: dbRecords.length,
        latestDiagnosis: dbRecords[0]?.diagnosis ?? null,
        allergies: [],
        chronicConditions: [],
      });
      return;
    }
  } catch {
    // fallback
  }

  const patientRecords = recordStore.filter((entry) => entry.patientId === patientId);
  res.json({
    patientId,
    totalVisits: patientRecords.length,
    latestDiagnosis: patientRecords[patientRecords.length - 1]?.diagnosis ?? null,
    allergies: Array.from(new Set(patientRecords.flatMap((entry) => entry.allergies))),
    chronicConditions: Array.from(new Set(patientRecords.flatMap((entry) => entry.chronicConditions))),
  });
});

export const getEmrRecords = () => recordStore;
