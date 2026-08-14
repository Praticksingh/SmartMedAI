import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const statusUpdateSchema = z.object({
  status: z.enum(["WAITING", "CALLED", "IN_PROGRESS", "COMPLETED"]),
});

export const queueRouter = Router();

queueRouter.use(requireAuth);

queueRouter.get("/dashboard", requireRole(["RECEPTIONIST", "ADMIN", "DOCTOR"]), async (_req, res) => {
  try {
    const queues = await prisma.queueEntry.findMany({
      where: { status: { in: ["WAITING", "CALLED"] } },
      include: { visit: { include: { patient: true } } },
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });

    const waiting = queues.filter((q) => q.status === "WAITING").length;
    const called = queues.filter((q) => q.status === "CALLED").length;

    res.json({
      summary: {
        total: queues.length,
        waiting,
        called,
        completed: 0,
        nextPatient: queues[0] || null,
      },
      queue: queues,
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch queue dashboard",
        details: null,
      },
    });
  }
});

queueRouter.get("/live", requireRole(["RECEPTIONIST", "ADMIN", "DOCTOR", "PATIENT"]), async (_req, res) => {
  try {
    const queues = await prisma.queueEntry.findMany({
      where: { status: { in: ["WAITING", "CALLED"] } },
      include: { visit: { include: { patient: true } }, department: true },
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });

    res.json({
      summary: {
        total: queues.length,
        waiting: queues.filter((q) => q.status === "WAITING").length,
        called: queues.filter((q) => q.status === "CALLED").length,
      },
      queue: queues.map((q) => ({
        id: q.id,
        patientName: q.visit?.patient?.fullName,
        department: q.department?.name,
        priority: q.priority,
        position: q.position,
        status: q.status,
      })),
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch live queue",
        details: null,
      },
    });
  }
});

queueRouter.post("/checkin", requireRole(["RECEPTIONIST", "ADMIN", "DOCTOR"]), async (req: AuthenticatedRequest, res) => {
  try {
    const { visitId } = z.object({ visitId: z.string() }).parse(req.body);

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { department: true },
    });

    if (!visit) {
      res.status(404).json({
        error: {
          code: "VISIT_NOT_FOUND",
          message: "Visit not found",
          details: null,
        },
      });
      return;
    }

    const maxPosition = await prisma.queueEntry.findFirst({
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const queueEntry = await prisma.queueEntry.create({
      data: {
        visitId,
        departmentId: visit.departmentId,
        priority: visit.priority,
        position: (maxPosition?.position ?? 0) + 1,
        status: "WAITING",
      },
      include: { visit: true, department: true },
    });

    const summary = await getQueueSummary();
    res.status(201).json({ queueEntry, summary });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to check in",
        details: null,
      },
    });
  }
});

queueRouter.get("/:queueId", requireRole(["RECEPTIONIST", "ADMIN", "DOCTOR", "PATIENT"]), async (req, res) => {
  try {
    const queueId = Array.isArray(req.params.queueId) ? req.params.queueId[0] : req.params.queueId;
    const queueEntry = await prisma.queueEntry.findUnique({
      where: { id: queueId },
      include: { visit: true, department: true },
    });

    if (!queueEntry) {
      res.status(404).json({
        error: {
          code: "QUEUE_ENTRY_NOT_FOUND",
          message: "Queue entry not found",
          details: null,
        },
      });
      return;
    }

    res.json({ queueEntry });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch queue entry",
        details: null,
      },
    });
  }
});

queueRouter.patch("/:queueId/status", requireRole(["RECEPTIONIST", "ADMIN", "DOCTOR"]), async (req, res) => {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid queue status payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  try {
    const queueId = Array.isArray(req.params.queueId) ? req.params.queueId[0] : req.params.queueId;
    const queueEntry = await prisma.queueEntry.update({
      where: { id: queueId },
      data: { status: parsed.data.status as any },
      include: { visit: true },
    });

    const summary = await getQueueSummary();
    res.json({ queueEntry, summary });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to update queue status",
        details: null,
      },
    });
  }
});

queueRouter.get("/patient/:patientId", requireRole(["PATIENT", "RECEPTIONIST", "ADMIN", "DOCTOR"]), async (req, res) => {
  try {
    const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
    const patient = await prisma.patientProfile.findUnique({
      where: { userId: patientId },
    });

    if (!patient) {
      res.json({ queue: [] });
      return;
    }

    const queue = await prisma.queueEntry.findMany({
      where: { visit: { patientId: patient.id } },
      include: { visit: true },
    });

    res.json({ queue });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Failed to fetch patient queue",
        details: null,
      },
    });
  }
});

async function getQueueSummary() {
  const queues = await prisma.queueEntry.findMany({
    where: { status: { in: ["WAITING", "CALLED"] } },
  });

  return {
    total: queues.length,
    waiting: queues.filter((q) => q.status === "WAITING").length,
    called: queues.filter((q) => q.status === "CALLED").length,
    completed: 0,
  };
}
