import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const doctorQuerySchema = z.object({
  specialization: z.string().optional(),
  branch: z.string().optional(),
  minFee: z.coerce.number().optional(),
  maxFee: z.coerce.number().optional(),
  search: z.string().optional(),
});

export const doctorRouter = Router();

doctorRouter.use(requireAuth);

doctorRouter.get("/", requireRole(["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"]), async (req, res) => {
  try {
    const query = doctorQuerySchema.parse(req.query);

    const where: any = {};
    if (query.specialization) where.specialization = { contains: query.specialization, mode: "insensitive" };
    if (query.branch) where.branch = { contains: query.branch, mode: "insensitive" };
    if (query.minFee) where.fee = { gte: query.minFee };
    if (query.maxFee) {
      where.fee = { ...where.fee, lte: query.maxFee };
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      take: 50,
    });

    const filtered = !query.search
      ? doctors
      : doctors.filter((doc) => {
          const searchTerm = query.search!.toLowerCase();
          return `${doc.fullName} ${doc.specialization} ${doc.branch || ""}`.toLowerCase().includes(searchTerm);
        });

    res.json({ doctors: filtered });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch doctors",
        details: null,
      },
    });
  }
});

doctorRouter.get("/:doctorId", requireRole(["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"]), async (req, res) => {
  try {
    const doctorId = Array.isArray(req.params.doctorId) ? req.params.doctorId[0] : req.params.doctorId;
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      res.status(404).json({
        error: { code: "DOCTOR_NOT_FOUND", message: "Doctor not found", details: null },
      });
      return;
    }

    res.json({ doctor });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch doctor",
        details: null,
      },
    });
  }
});

doctorRouter.get("/dashboard/summary", requireRole(["DOCTOR"]), async (req: AuthenticatedRequest, res) => {
  try {
    const today = new Date();
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!doctor) {
      res.status(404).json({
        error: { code: "DOCTOR_NOT_FOUND", message: "Doctor not found", details: null },
      });
      return;
    }

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    });

    const pendingReports = await prisma.labRequest.findMany({
      where: {
        doctorId: doctor.id,
        status: { notIn: ["REPORTED", "COMPLETED"] },
      },
    });

    res.json({
      doctor,
      summary: {
        todayPatients: todayAppointments.length,
        pendingReports: pendingReports.length,
        consultations: 0,
        availableSlots: 6,
        generatedAt: today.toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch doctor summary",
        details: null,
      },
    });
  }
});
