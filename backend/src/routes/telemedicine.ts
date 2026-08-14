import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";

const consultationSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  channel: z.enum(["VIDEO", "CHAT"]).default("VIDEO"),
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED"]).default("SCHEDULED"),
  scheduledFor: z.string().min(1),
});

const consultationStore: Array<{
  id: string;
  patientId: string;
  doctorId: string;
  channel: "VIDEO" | "CHAT";
  status: "SCHEDULED" | "LIVE" | "COMPLETED";
  scheduledFor: string;
  startedAt?: string;
  endedAt?: string;
}> = [
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

telemedicineRouter.get("/consultations", requireRole(["DOCTOR", "PATIENT", "ADMIN"]), (_req, res) => {
  res.json({ consultations: consultationStore });
});

telemedicineRouter.post("/consultations", requireRole(["PATIENT", "DOCTOR", "ADMIN"]), (req, res) => {
  const parsed = consultationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid consultation payload", details: parsed.error.flatten() },
    });
    return;
  }

  const item = {
    id: `tele_${Date.now()}`,
    ...parsed.data,
  };

  consultationStore.push(item);
  res.status(201).json({ consultation: item });
});

telemedicineRouter.patch("/consultations/:consultationId/status", requireRole(["DOCTOR", "ADMIN"]), (req, res) => {
  const consultation = consultationStore.find((entry) => entry.id === req.params.consultationId);
  if (!consultation) {
    res.status(404).json({ error: { code: "CONSULTATION_NOT_FOUND", message: "Consultation not found", details: null } });
    return;
  }

  const nextStatus = (req.body?.status ?? "LIVE") as "SCHEDULED" | "LIVE" | "COMPLETED";
  consultation.status = nextStatus;
  if (nextStatus === "LIVE") consultation.startedAt = new Date().toISOString();
  if (nextStatus === "COMPLETED") consultation.endedAt = new Date().toISOString();

  res.json({ consultation });
});

export const getConsultations = () => consultationStore;
