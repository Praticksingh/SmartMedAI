import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";

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

labRouter.post("/requests", requireRole(["DOCTOR", "ADMIN", "LAB_STAFF"]), (req, res) => {
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

  const request: LabRequest = {
    id: `lab_${Date.now()}`,
    patientId: parsed.data.patientId,
    doctorId: parsed.data.doctorId,
    visitId: parsed.data.visitId,
    testName: parsed.data.testName,
    priority: parsed.data.priority,
    status: "PENDING",
    notes: parsed.data.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  labRequests.push(request);
  res.status(201).json({ request });
});

labRouter.get("/requests", requireRole(["DOCTOR", "ADMIN", "LAB_STAFF", "RECEPTIONIST"]), (_req, res) => {
  res.json({ requests: labRequests });
});

labRouter.get("/requests/:requestId", requireRole(["DOCTOR", "ADMIN", "LAB_STAFF", "PATIENT"]), (req, res) => {
  const request = labRequests.find((entry) => entry.id === req.params.requestId);
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

labRouter.patch("/requests/:requestId/report", requireRole(["LAB_STAFF", "ADMIN", "DOCTOR"]), (req, res) => {
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

  const request = labRequests.find((entry) => entry.id === req.params.requestId);
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

labRouter.get("/patient/:patientId", requireRole(["PATIENT", "DOCTOR", "ADMIN", "LAB_STAFF"]), (req, res) => {
  const patientRequests = labRequests.filter((entry) => entry.patientId === req.params.patientId);
  res.json({ requests: patientRequests });
});

export const getLabRequests = () => labRequests;
