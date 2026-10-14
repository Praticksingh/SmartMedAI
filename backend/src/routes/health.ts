import { Router } from "express";
import { prisma } from "../db.js";

export const healthRouter = Router();

const healthHandler = async (req: any, res: any) => {
  const checkDb = req.query.db === "true";
  let dbStatus = "skipped";

  if (checkDb) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch {
      dbStatus = "disconnected";
    }
  }

  res.status(200).json({
    status: dbStatus === "disconnected" ? "degraded" : "ok",
    service: "devfusion-backend",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    ...(checkDb ? { database: dbStatus } : {}),
  });
};

healthRouter.get("/", healthHandler);
healthRouter.get("/health", healthHandler);


