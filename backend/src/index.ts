import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pathToFileURL } from "node:url";

import { appConfig } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { adminRouter } from "./routes/admin.js";
import { appointmentRouter } from "./routes/appointments.js";
import { authRouter } from "./routes/auth.js";
import { billingRouter } from "./routes/billing.js";
import { doctorRouter } from "./routes/doctors.js";
import { emrRouter } from "./routes/emr.js";
import { healthRouter } from "./routes/health.js";
import { labRouter } from "./routes/lab.js";
import { notificationRouter } from "./routes/notifications.js";
import { patientRouter } from "./routes/patients.js";
import { pharmacyRouter } from "./routes/pharmacy.js";
import { prescriptionRouter } from "./routes/prescriptions.js";
import { queueRouter } from "./routes/queues.js";
import { telemedicineRouter } from "./routes/telemedicine.js";

const app = express();
const allowedOrigins = [appConfig.frontendUrl, appConfig.backendUrl, "http://localhost:5173", "http://localhost:4000"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS policy denied for this origin"));
    },
    credentials: true,
  })
);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
  })
);

app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/queues", queueRouter);
app.use("/api/v1/emr", emrRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/pharmacy", pharmacyRouter);
app.use("/api/v1/lab", labRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/telemedicine", telemedicineRouter);
app.use(notFoundHandler);
app.use(errorHandler);

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  app.listen(appConfig.port, () => {
    console.log(`DevFusion backend listening on http://localhost:${appConfig.port}`);
  });
}

export default app;
