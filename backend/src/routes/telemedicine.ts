import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const consultationSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  channel: z.enum(["VIDEO", "CHAT"]).default("VIDEO"),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED"]).default("SCHEDULED"),
  scheduledFor: z.string().min(1),
});

type ConsultationItem = {
  id: string;
  patientId: string;
  doctorId: string;
  channel: "VIDEO" | "CHAT";
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
  scheduledFor: string;
  startedAt?: string;
  endedAt?: string;
};

const consultationStore: ConsultationItem[] = [
  {
    id: "tele_1",
    patientId: "patient_demo_1",
    doctorId: "doc_1001",
    channel: "VIDEO",
    status: "SCHEDULED",
    scheduledFor: "2026-08-18T11:00:00.000Z",
  },
];

export const telemedicineRouter = Router();

telemedicineRouter.use(requireAuth);

telemedicineRouter.get("/consultations", requireRole(["DOCTOR", "PATIENT", "ADMIN", "HOSPITAL_ADMIN"]), async (_req, res) => {
  try {
    const dbConsultations = await prisma.consultation.findMany({
      include: { patient: true, doctor: true },
      orderBy: { createdAt: "desc" },
    });
    if (dbConsultations.length > 0) {
      res.json({
        consultations: dbConsultations.map((c) => ({
          id: c.id,
          patientId: c.patientId,
          doctorId: c.doctorId,
          channel: c.consultationType === "ONLINE_CHAT" ? "CHAT" : "VIDEO",
          status: c.status === "COMPLETED" ? "COMPLETED" : c.status === "IN_PROGRESS" ? "LIVE" : "SCHEDULED",
          scheduledFor: c.createdAt.toISOString(),
          startedAt: c.startedAt?.toISOString(),
          endedAt: c.completedAt?.toISOString(),
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  res.json({ consultations: consultationStore });
});

telemedicineRouter.post("/consultations", requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL_ADMIN"]), async (req, res) => {
  const parsed = consultationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid consultation payload", details: parsed.error.flatten() },
    });
    return;
  }

  const teleId = `tele_${Date.now()}`;
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
      const appt = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDate: new Date(parsed.data.scheduledFor),
          startTime: new Date(parsed.data.scheduledFor),
          endTime: new Date(new Date(parsed.data.scheduledFor).getTime() + 30 * 60 * 1000),
          consultationType: parsed.data.channel === "CHAT" ? "ONLINE_CHAT" : "ONLINE_VIDEO",
        },
      });

      await prisma.consultation.create({
        data: {
          id: teleId,
          appointmentId: appt.id,
          patientId: patient.id,
          doctorId: doctor.id,
          consultationType: parsed.data.channel === "CHAT" ? "ONLINE_CHAT" : "ONLINE_VIDEO",
          status: "SCHEDULED",
        },
      });
    }
  } catch {
    // fallback
  }

  const item: ConsultationItem = {
    id: teleId,
    ...parsed.data,
  };

  consultationStore.push(item);
  res.status(201).json({ consultation: item });
});

telemedicineRouter.patch("/consultations/:consultationId/status", requireRole(["DOCTOR", "ADMIN", "HOSPITAL_ADMIN"]), async (req, res) => {
  const consultationId = Array.isArray(req.params.consultationId) ? req.params.consultationId[0] : req.params.consultationId;
  const nextStatus = (req.body?.status ?? "LIVE") as "SCHEDULED" | "LIVE" | "COMPLETED";

  try {
    await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        status: nextStatus === "COMPLETED" ? "COMPLETED" : nextStatus === "LIVE" ? "IN_PROGRESS" : "SCHEDULED",
        startedAt: nextStatus === "LIVE" ? new Date() : undefined,
        completedAt: nextStatus === "COMPLETED" ? new Date() : undefined,
      },
    });
  } catch {
    // fallback
  }

  const consultation = consultationStore.find((entry) => entry.id === consultationId);
  if (!consultation) {
    res.status(404).json({ error: { code: "CONSULTATION_NOT_FOUND", message: "Consultation not found", details: null } });
    return;
  }

  consultation.status = nextStatus;
  if (nextStatus === "LIVE") consultation.startedAt = new Date().toISOString();
  if (nextStatus === "COMPLETED") consultation.endedAt = new Date().toISOString();

  res.json({ consultation });
});

export const getConsultations = () => consultationStore;
