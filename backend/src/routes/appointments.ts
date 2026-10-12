import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const appointmentSchema = z.object({
  doctorId: z.string().min(1),
  appointmentDate: z.string().datetime({ offset: true }).or(z.string().datetime()),
  consultationType: z.enum(["IN_PERSON", "ONLINE_VIDEO", "ONLINE_CHAT"]),
  reason: z.string().optional(),
});

export const appointmentRouter = Router();

appointmentRouter.use(requireAuth);

appointmentRouter.post("/", requireRole(["PATIENT"]), async (req: AuthenticatedRequest, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid appointment payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: parsed.data.doctorId },
    });
    if (!doctor) {
      res.status(404).json({
        error: {
          code: "DOCTOR_NOT_FOUND",
          message: "Doctor not found",
          details: null,
        },
      });
      return;
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!patient) {
      res.status(404).json({
        error: {
          code: "PATIENT_NOT_FOUND",
          message: "Patient profile not found",
          details: null,
        },
      });
      return;
    }

    const duplicate = await prisma.appointment.findFirst({
      where: {
        doctorId: parsed.data.doctorId,
        appointmentDate: new Date(parsed.data.appointmentDate),
        status: { in: ["BOOKED", "CONFIRMED"] },
      },
    });

    if (duplicate) {
      res.status(409).json({
        error: {
          code: "DOUBLE_BOOKING",
          message: "This doctor already has an appointment at the selected time",
          details: null,
        },
      });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentDate: new Date(parsed.data.appointmentDate),
        startTime: new Date(parsed.data.appointmentDate),
        endTime: new Date(new Date(parsed.data.appointmentDate).getTime() + 30 * 60 * 1000),
        consultationType: parsed.data.consultationType as any,
        reason: parsed.data.reason,
      },
      include: { doctor: true },
    });

    res.status(201).json({ appointment });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to book appointment",
        details: null,
      },
    });
  }
});

appointmentRouter.get("/my", requireRole(["PATIENT"]), async (req: AuthenticatedRequest, res) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!patient) {
      res.json({ appointments: [] });
      return;
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: true },
      orderBy: { appointmentDate: "desc" },
    });

    res.json({ appointments });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch appointments",
        details: null,
      },
    });
  }
});

appointmentRouter.get("/doctor", requireRole(["DOCTOR", "RECEPTIONIST", "ADMIN"]), async (_req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { patient: true, doctor: true },
      orderBy: { appointmentDate: "desc" },
    });

    res.json({ appointments });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch appointments",
        details: null,
      },
    });
  }
});

appointmentRouter.patch("/:appointmentId/cancel", requireRole(["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"]), async (req: AuthenticatedRequest, res) => {
  try {
    const appointmentId = Array.isArray(req.params.appointmentId) ? req.params.appointmentId[0] : req.params.appointmentId;
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      res.status(404).json({
        error: {
          code: "APPOINTMENT_NOT_FOUND",
          message: "Appointment not found",
          details: null,
        },
      });
      return;
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (patient?.id !== appointment.patientId && !["DOCTOR", "RECEPTIONIST", "ADMIN"].includes(req.user!.role)) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You cannot cancel this appointment",
          details: null,
        },
      });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    res.json({ appointment: updated });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to cancel appointment",
        details: null,
      },
    });
  }
});
