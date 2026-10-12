import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const labRequestSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  visitId: z.string().min(1),
  testName: z.string().min(1),
  priority: z.enum(["ROUTINE", "URGENT", "STAT"]).default("ROUTINE"),
  notes: z.string().optional().default(""),
});

const reportUpdateSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "REJECTED"]).default("PENDING"),
  resultSummary: z.string().optional().default(""),
  fileUrl: z.string().url().optional(),
});

type LabRequest = {
  id: string;
  patientId: string;
  doctorId: string;
  visitId: string;
  testName: string;
  priority: "ROUTINE" | "URGENT" | "STAT";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  notes: string;
  createdAt: string;
  updatedAt: string;
  resultSummary?: string;
  fileUrl?: string;
};

const labRequests: LabRequest[] = [
  {
    id: "lab_1",
    patientId: "patient_demo_1",
    doctorId: "doc_1001",
    visitId: "visit_1",
    testName: "CBC",
    priority: "ROUTINE",
    status: "PENDING",
    notes: "Repeat blood work as part of follow-up review.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const labRouter = Router();

labRouter.use(requireAuth);

labRouter.post("/requests", requireRole(["DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "LAB_STAFF"]), async (req, res) => {
  const parsed = labRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid lab request payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const requestId = `lab_${Date.now()}`;
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
      await prisma.labRequest.create({
        data: {
          id: requestId,
          patientId: patient.id,
          doctorId: doctor.id,
          visitId: parsed.data.visitId,
          testName: parsed.data.testName,
          notes: parsed.data.notes,
          priority: parsed.data.priority === "STAT" ? "P1_CRITICAL" : parsed.data.priority === "URGENT" ? "P2_HIGH" : "P4_ROUTINE",
          status: "CREATED",
        },
      });
    }
  } catch {
    // fallback
  }

  const request: LabRequest = {
    id: requestId,
    patientId: parsed.data.patientId,
    doctorId: parsed.data.doctorId,
    visitId: parsed.data.visitId,
    testName: parsed.data.testName,
    priority: parsed.data.priority,
    status: "PENDING",
    notes: parsed.data.notes,
    createdAt: now,
    updatedAt: now,
  };

  labRequests.push(request);
  res.status(201).json({ request });
});

labRouter.get("/requests", requireRole(["DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "LAB_STAFF", "RECEPTIONIST"]), async (_req, res) => {
  try {
    const dbRequests = await prisma.labRequest.findMany({
      include: { patient: true, doctor: true },
      orderBy: { createdAt: "desc" },
    });
    if (dbRequests.length > 0) {
      res.json({
        requests: dbRequests.map((r) => ({
          id: r.id,
          patientId: r.patientId,
          doctorId: r.doctorId,
          visitId: r.visitId || "",
          testName: r.testName,
          priority: r.priority.includes("P1") ? "STAT" : r.priority.includes("P2") ? "URGENT" : "ROUTINE",
          status: r.status === "REPORTED" || r.status === "COMPLETED" ? "COMPLETED" : r.status === "PROCESSING" ? "IN_PROGRESS" : "PENDING",
          notes: r.notes || "",
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          resultSummary: r.notes || "",
          fileUrl: r.reportUrl || undefined,
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  res.json({ requests: labRequests });
});

labRouter.get("/requests/:requestId", requireRole(["DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "LAB_STAFF", "PATIENT"]), async (req, res) => {
  const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  try {
    const r = await prisma.labRequest.findUnique({
      where: { id: requestId },
      include: { patient: true, doctor: true },
    });
    if (r) {
      res.json({
        request: {
          id: r.id,
          patientId: r.patientId,
          doctorId: r.doctorId,
          visitId: r.visitId || "",
          testName: r.testName,
          priority: r.priority.includes("P1") ? "STAT" : r.priority.includes("P2") ? "URGENT" : "ROUTINE",
          status: r.status === "REPORTED" || r.status === "COMPLETED" ? "COMPLETED" : r.status === "PROCESSING" ? "IN_PROGRESS" : "PENDING",
          notes: r.notes || "",
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          resultSummary: r.notes || "",
          fileUrl: r.reportUrl || undefined,
        },
      });
      return;
    }
  } catch {
    // fallback
  }

  const request = labRequests.find((entry) => entry.id === requestId);
  if (!request) {
    res.status(404).json({
      error: {
        code: "LAB_REQUEST_NOT_FOUND",
        message: "Lab request not found",
        details: null,
      },
    });
    return;
  }

  res.json({ request });
});

labRouter.patch("/requests/:requestId/report", requireRole(["LAB_STAFF", "ADMIN", "HOSPITAL_ADMIN", "DOCTOR"]), async (req, res) => {
  const parsed = reportUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid lab report payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  try {
    await prisma.labRequest.update({
      where: { id: requestId },
      data: {
        status: parsed.data.status === "COMPLETED" ? "REPORTED" : "PROCESSING",
        reportUrl: parsed.data.fileUrl,
        notes: parsed.data.resultSummary,
      },
    });
  } catch {
    // fallback
  }

  const request = labRequests.find((entry) => entry.id === requestId);
  if (!request) {
    res.status(404).json({
      error: {
        code: "LAB_REQUEST_NOT_FOUND",
        message: "Lab request not found",
        details: null,
      },
    });
    return;
  }

  request.status = parsed.data.status;
  request.resultSummary = parsed.data.resultSummary;
  request.fileUrl = parsed.data.fileUrl;
  request.updatedAt = new Date().toISOString();

  res.json({ request });
});

labRouter.get("/patient/:patientId", requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "LAB_STAFF"]), async (req, res) => {
  const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
  try {
    const dbRequests = await prisma.labRequest.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
    if (dbRequests.length > 0) {
      res.json({
        requests: dbRequests.map((r) => ({
          id: r.id,
          patientId: r.patientId,
          doctorId: r.doctorId,
          visitId: r.visitId || "",
          testName: r.testName,
          priority: r.priority.includes("P1") ? "STAT" : r.priority.includes("P2") ? "URGENT" : "ROUTINE",
          status: r.status === "REPORTED" ? "COMPLETED" : "PENDING",
          notes: r.notes || "",
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          resultSummary: r.notes || "",
          fileUrl: r.reportUrl || undefined,
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  const patientRequests = labRequests.filter((entry) => entry.patientId === patientId);
  res.json({ requests: patientRequests });
});

export const getLabRequests = () => labRequests;
