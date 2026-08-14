import { Router } from "express";
import { z } from "zod";

import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";

const notificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  category: z.enum(["APPOINTMENT", "LAB", "PRESCRIPTION", "BILL", "SYSTEM"]).default("SYSTEM"),
  isRead: z.boolean().default(false),
});

const notificationStore: Array<{
  id: string;
  userId: string;
  title: string;
  message: string;
  category: "APPOINTMENT" | "LAB" | "PRESCRIPTION" | "BILL" | "SYSTEM";
  isRead: boolean;
  createdAt: string;
}> = [
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

notificationRouter.get("/my", requireRole(["PATIENT", "DOCTOR", "ADMIN", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"]), (req: AuthenticatedRequest, res) => {
  const currentUserId = req.user!.id;
  const userNotifications = notificationStore.filter((entry) => entry.userId === currentUserId || entry.category === "SYSTEM");
  res.json({ notifications: userNotifications });
});

notificationRouter.post("/", requireRole(["ADMIN", "SYSTEM", "RECEPTIONIST", "DOCTOR"]), (req, res) => {
  const parsed = notificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid notification payload", details: parsed.error.flatten() },
    });
    return;
  }

  const item = {
    id: `notif_${Date.now()}`,
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };

  notificationStore.push(item);
  res.status(201).json({ notification: item });
});

notificationRouter.patch("/:notificationId/read", requireRole(["PATIENT", "DOCTOR", "ADMIN", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"]), (req, res) => {
  const item = notificationStore.find((entry) => entry.id === req.params.notificationId);
  if (!item) {
    res.status(404).json({ error: { code: "NOTIFICATION_NOT_FOUND", message: "Notification not found", details: null } });
    return;
  }

  item.isRead = true;
  res.json({ notification: item });
});

notificationRouter.get("/stats", requireRole(["PATIENT", "DOCTOR", "ADMIN", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST"]), (req: AuthenticatedRequest, res) => {
  const total = notificationStore.filter((entry) => entry.userId === req.user!.id || entry.category === "SYSTEM").length;
  const unread = notificationStore.filter((entry) => (entry.userId === req.user!.id || entry.category === "SYSTEM") && !entry.isRead).length;
  res.json({ stats: { total, unread } });
});

export const getNotifications = () => notificationStore;
