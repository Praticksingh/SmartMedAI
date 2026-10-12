import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const notificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  category: z.enum(["APPOINTMENT", "LAB", "PRESCRIPTION", "BILL", "SYSTEM"]).default("SYSTEM"),
  isRead: z.boolean().default(false),
});

type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: "APPOINTMENT" | "LAB" | "PRESCRIPTION" | "BILL" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
};

const notificationStore: NotificationItem[] = [
  {
    id: "notif_1",
    userId: "patient_demo_1",
    title: "Appointment reminder",
    message: "Your consultation with Dr. Asha Verma is scheduled for tomorrow at 10:00 AM.",
    category: "APPOINTMENT",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "notif_2",
    userId: "user_1001",
    title: "Lab report ready",
    message: "Your CBC report is available for review.",
    category: "LAB",
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

export const notificationRouter = Router();

notificationRouter.use(requireAuth);

notificationRouter.get("/my", requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"]), async (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user!.id;
  try {
    const dbNotifs = await prisma.notification.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: "desc" },
    });
    if (dbNotifs.length > 0) {
      res.json({
        notifications: dbNotifs.map((n) => ({
          id: n.id,
          userId: n.userId,
          title: n.title,
          message: n.message,
          category: n.category as any,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  const userNotifications = notificationStore.filter((entry) => entry.userId === currentUserId || entry.category === "SYSTEM");
  res.json({ notifications: userNotifications });
});

notificationRouter.post("/", requireRole(["ADMIN", "HOSPITAL_ADMIN", "SYSTEM", "RECEPTIONIST", "DOCTOR"]), async (req, res) => {
  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid notification payload", details: parsed.error.flatten() },
    });
    return;
  }

  const notifId = `notif_${Date.now()}`;
  const now = new Date().toISOString();

  try {
    await prisma.notification.create({
      data: {
        id: notifId,
        userId: parsed.data.userId,
        title: parsed.data.title,
        message: parsed.data.message,
        category: parsed.data.category === "BILL" ? "BILL_GENERATED" : parsed.data.category === "LAB" ? "TEST_RESULT" : "SYSTEM",
        isRead: parsed.data.isRead,
      },
    });
  } catch {
    // fallback
  }

  const item: NotificationItem = {
    id: notifId,
    ...parsed.data,
    createdAt: now,
  };

  notificationStore.push(item);
  res.status(201).json({ notification: item });
});

notificationRouter.patch("/:notificationId/read", requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"]), async (req, res) => {
  const notifId = Array.isArray(req.params.notificationId) ? req.params.notificationId[0] : req.params.notificationId;

  try {
    await prisma.notification.update({
      where: { id: notifId },
      data: { isRead: true, readAt: new Date() },
    });
  } catch {
    // fallback
  }

  const item = notificationStore.find((entry) => entry.id === notifId);
  if (!item) {
    res.status(404).json({ error: { code: "NOTIFICATION_NOT_FOUND", message: "Notification not found", details: null } });
    return;
  }

  item.isRead = true;
  res.json({ notification: item });
});

notificationRouter.get("/stats", requireRole(["PATIENT", "DOCTOR", "ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"]), async (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user!.id;
  try {
    const total = await prisma.notification.count({ where: { userId: currentUserId } });
    const unread = await prisma.notification.count({ where: { userId: currentUserId, isRead: false } });
    if (total > 0) {
      res.json({ stats: { total, unread } });
      return;
    }
  } catch {
    // fallback
  }

  const total = notificationStore.filter((entry) => entry.userId === currentUserId || entry.category === "SYSTEM").length;
  const unread = notificationStore.filter((entry) => (entry.userId === currentUserId || entry.category === "SYSTEM") && !entry.isRead).length;
  res.json({ stats: { total, unread } });
});

export const getNotifications = () => notificationStore;
