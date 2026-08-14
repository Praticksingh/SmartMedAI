import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";

const searchSchema = z.object({
  query: z.string().min(1),
  scope: z.enum(["PATIENTS", "DOCTORS", "APPOINTMENTS", "BILLS", "ALL"]).default("ALL"),
});

export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get("/dashboard", requireRole(["ADMIN", "RECEPTIONIST"]), (_req, res) => {
  res.json({
    summary: {
      totalPatients: 128,
      activeDoctors: 32,
      todaysAppointments: 74,
      revenue: 285000,
      pendingBills: 41,
      labReports: 18,
    },
    charts: {
      dailyPatients: [42, 55, 49, 60, 68, 71, 58],
      revenueTrend: [18000, 22000, 21000, 27000, 31000, 35000, 33000],
    },
  });
});

adminRouter.get("/users", requireRole(["ADMIN"]), (_req, res) => {
  res.json({
    users: [
      { id: "user_1", email: "patient@example.com", role: "PATIENT", status: "ACTIVE" },
      { id: "user_2", email: "doctor@example.com", role: "DOCTOR", status: "ACTIVE" },
      { id: "user_3", email: "admin@example.com", role: "ADMIN", status: "ACTIVE" },
    ],
  });
});

adminRouter.get("/search", requireRole(["ADMIN", "RECEPTIONIST", "DOCTOR"]), (req, res) => {
  const parsed = searchSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid search query", details: parsed.error.flatten() },
    });
    return;
  }

  const q = parsed.data.query.toLowerCase();
  const results = [
    { type: "PATIENT", value: `Patient match for "${q}"` },
    { type: "DOCTOR", value: `Doctor match for "${q}"` },
    { type: "APPOINTMENT", value: `Appointment match for "${q}"` },
  ];

  res.json({ query: parsed.data.query, scope: parsed.data.scope, results });
});

adminRouter.get("/audit-log", requireRole(["ADMIN"]), (_req, res) => {
  res.json({
    logs: [
      { id: "audit_1", actor: "receptionist@clinic", action: "Checked in patient", at: new Date().toISOString() },
      { id: "audit_2", actor: "doctor@clinic", action: "Updated diagnosis", at: new Date().toISOString() },
    ],
  });
});
