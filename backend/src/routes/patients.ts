import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const patientProfileSchema = z.object({
  fullName: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string(),
  phone: z.string().min(7),
  email: z.string().email(),
  bloodGroup: z.string().min(2).max(5),
  address: z.string().min(5).optional().default(""),
  emergencyContact: z.string().min(5).optional().default(""),
  allergies: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
});

export const patientRouter = Router();

patientRouter.use(requireAuth, requireRole(["PATIENT"]));

patientRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      res.status(404).json({
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Patient profile has not been created yet",
          details: null,
        },
      });
      return;
    }

    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to retrieve profile",
        details: null,
      },
    });
  }
});

patientRouter.put("/profile", async (req: AuthenticatedRequest, res) => {
  const parsed = patientProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid patient profile payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  try {
    const existing = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });

    const profileData = {
      fullName: parsed.data.fullName,
      dob: new Date(parsed.data.dob),
      gender: parsed.data.gender,
      phone: parsed.data.phone,
      email: parsed.data.email,
      bloodGroup: parsed.data.bloodGroup,
      address: parsed.data.address,
      emergencyContact: parsed.data.emergencyContact,
      allergies: parsed.data.allergies,
      conditions: parsed.data.conditions,
    };

    let profile;
    if (existing) {
      profile = await prisma.patientProfile.update({
        where: { userId: req.user!.id },
        data: profileData,
      });
    } else {
      profile = await prisma.patientProfile.create({
        data: {
          userId: req.user!.id,
          ...profileData,
        },
      });
    }

    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to update profile",
        details: null,
      },
    });
  }
});

patientRouter.get("/dashboard", async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      res.status(404).json({
        error: {
          code: "PROFILE_NOT_FOUND",
          message: "Patient profile has not been created yet",
          details: null,
        },
      });
      return;
    }

    const [upcomingAppointments, labReports, invoices, prescriptions] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          patientId: profile.id,
          appointmentDate: { gte: new Date() },
        },
        include: { doctor: true },
        orderBy: { appointmentDate: "asc" },
        take: 5,
      }),
      prisma.labRequest.findMany({
        where: { patientId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { patientId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.prescription.findMany({
        where: { patientId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const outstandingBills = invoices
      .filter((inv) => inv.status !== "PAID")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const dashboard = {
      status: "ok",
      profile,
      dashboard: {
        stats: {
          appointments: upcomingAppointments.length,
          pendingLabReports: labReports.filter((lr) => lr.status !== "REPORTED").length,
          outstandingBills,
          lastVisit: null,
        },
        upcomingAppointments: upcomingAppointments.map((appt) => ({
          id: appt.id,
          doctor: appt.doctor?.fullName,
          specialty: appt.doctor?.specialization,
          date: appt.appointmentDate,
          status: appt.status,
        })),
        medicalHistory: [],
        prescriptions: prescriptions.map((rx) => ({
          id: rx.id,
          medicine: rx.medicineName,
          dosage: rx.dosage,
          duration: rx.duration,
          doctor: "",
        })),
        labReports: labReports.map((lr) => ({
          id: lr.id,
          test: lr.testName,
          date: lr.createdAt,
          status: lr.status,
        })),
        bills: invoices.map((inv) => ({
          id: inv.id,
          invoice: inv.invoiceNumber,
          amount: inv.totalAmount,
          status: inv.status,
        })),
      },
    };

    res.json(dashboard);
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to retrieve dashboard",
        details: null,
      },
    });
  }
});

patientRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "patient-routes" });
});
