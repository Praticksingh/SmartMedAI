import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

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

type PrescriptionItem = {
  id: string;
  patientId: string;
  doctorId: string;
  visitId: string;
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string; notes: string }>;
  notes: string;
  followUpDate: string;
  createdAt: string;
};

const prescriptionsStore: PrescriptionItem[] = [
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

prescriptionRouter.post("/", requireRole(["DOCTOR", "ADMIN", "HOSPITAL_ADMIN"]), async (req, res) => {
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

  const rxId = `rx_${Date.now()}`;
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
      for (const med of parsed.data.medications) {
        await prisma.prescription.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            visitId: parsed.data.visitId,
            medicineName: med.name,
            dosage: med.dosage,
            frequency: med.frequency,
            duration: med.duration,
            instructions: med.notes || parsed.data.notes,
            followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : null,
          },
        });
      }
    }
  } catch {
    // fallback
  }

  const prescription: PrescriptionItem = {
    id: rxId,
    ...parsed.data,
    createdAt: now,
  };

  prescriptionsStore.push(prescription);
  res.status(201).json({ prescription });
});

prescriptionRouter.get("/patient/:patientId", requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "PHARMACIST"]), async (req: AuthenticatedRequest, res) => {
  const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
  if (req.user?.role === "PATIENT" && req.user.id !== patientId) {
    res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: "You cannot access another patient’s prescription history",
        details: null,
      },
    });
    return;
  }

  try {
    const dbPrescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: { doctor: true },
      orderBy: { createdAt: "desc" },
    });
    if (dbPrescriptions.length > 0) {
      res.json({
        prescriptions: dbPrescriptions.map((rx) => ({
          id: rx.id,
          patientId: rx.patientId,
          doctorId: rx.doctorId,
          visitId: rx.visitId || "",
          medications: [
            {
              name: rx.medicineName,
              dosage: rx.dosage,
              frequency: rx.frequency,
              duration: rx.duration,
              notes: rx.instructions || "",
            },
          ],
          notes: rx.instructions || "",
          followUpDate: rx.followUpDate ? rx.followUpDate.toISOString().slice(0, 10) : "",
          createdAt: rx.createdAt.toISOString(),
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  const patientPrescriptions = prescriptionsStore.filter((entry) => entry.patientId === patientId);
  res.json({ prescriptions: patientPrescriptions });
});

prescriptionRouter.get("/visit/:visitId", requireRole(["PATIENT", "DOCTOR", "PHARMACIST", "ADMIN", "HOSPITAL_ADMIN"]), async (req: AuthenticatedRequest, res) => {
  const visitId = Array.isArray(req.params.visitId) ? req.params.visitId[0] : req.params.visitId;

  try {
    const dbPrescriptions = await prisma.prescription.findMany({
      where: { visitId },
      include: { doctor: true },
    });
    if (dbPrescriptions.length > 0) {
      const first = dbPrescriptions[0];
      if (req.user?.role === "PATIENT" && req.user.id !== first.patientId) {
        res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You cannot access another patient’s prescription",
            details: null,
          },
        });
        return;
      }

      res.json({
        prescription: {
          id: first.id,
          patientId: first.patientId,
          doctorId: first.doctorId,
          visitId: first.visitId || "",
          medications: dbPrescriptions.map((rx) => ({
            name: rx.medicineName,
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            notes: rx.instructions || "",
          })),
          notes: first.instructions || "",
          followUpDate: first.followUpDate ? first.followUpDate.toISOString().slice(0, 10) : "",
          createdAt: first.createdAt.toISOString(),
        },
      });
      return;
    }
  } catch {
    // fallback
  }

  const prescription = prescriptionsStore.find((entry) => entry.visitId === visitId);
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
