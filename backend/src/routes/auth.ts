import { Router } from "express";
import { z } from "zod";

import { hashPassword, signAccessToken, signRefreshToken, verifyPassword, verifyRefreshToken } from "../auth/session.js";
import { type AuthenticatedRequest, requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["PATIENT", "DOCTOR", "RECEPTIONIST", "LAB_STAFF", "PHARMACIST", "ADMIN"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid registration payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  try {
    const { email, password, firstName, lastName, role } = parsed.data;
    
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({
        error: {
          code: "USER_EXISTS",
          message: "User already exists",
          details: null,
        },
      });
      return;
    }

    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: passwordHash,
        role: role as any,
      },
    });

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role, firstName, lastName });
    const refreshToken = signRefreshToken({ id: user.id, email: user.email, role: user.role, firstName, lastName });

    res.cookie("devfusion_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("devfusion_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName,
        lastName,
        role: user.role,
      },
      token: accessToken,
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Registration failed",
        details: null,
      },
    });
  }
});

const loginFailedAttempts: Record<string, { count: number; lockUntil: number }> = {};

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid login payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  try {
    const { email, password } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Check account lockout status
    const lockout = loginFailedAttempts[lowerEmail];
    if (lockout && lockout.lockUntil > Date.now()) {
      const remainingMins = Math.ceil((lockout.lockUntil - Date.now()) / (60 * 1000));
      res.status(429).json({
        error: {
          code: "ACCOUNT_LOCKED",
          message: `ACCOUNT BLOCKED: Maximum limit of 3 failed login attempts reached. Dashboard access is locked for ${remainingMins} minute(s).`,
          details: { lockUntil: lockout.lockUntil },
        },
      });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (!user) {
      const attempts = (lockout?.count ?? 0) + 1;
      if (attempts >= 3) {
        loginFailedAttempts[lowerEmail] = { count: attempts, lockUntil: Date.now() + 15 * 60 * 1000 };
        res.status(429).json({
          error: {
            code: "ACCOUNT_LOCKED",
            message: "ACCOUNT BLOCKED: Maximum limit of 3 failed login attempts reached. Access to all dashboards is locked for 15 minutes.",
            details: null,
          },
        });
        return;
      }
      loginFailedAttempts[lowerEmail] = { count: attempts, lockUntil: 0 };
      res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: `Invalid email or password. Attempt ${attempts} of 3. Reaching 3 failed attempts will block account access.`,
          details: null,
        },
      });
      return;
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      const attempts = (lockout?.count ?? 0) + 1;
      if (attempts >= 3) {
        loginFailedAttempts[lowerEmail] = { count: attempts, lockUntil: Date.now() + 15 * 60 * 1000 };
        res.status(429).json({
          error: {
            code: "ACCOUNT_LOCKED",
            message: "ACCOUNT BLOCKED: Maximum limit of 3 failed login attempts reached. Access to all dashboards is locked for 15 minutes.",
            details: null,
          },
        });
        return;
      }
      loginFailedAttempts[lowerEmail] = { count: attempts, lockUntil: 0 };
      res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: `Invalid email or password. Attempt ${attempts} of 3. Reaching 3 failed attempts will block account access.`,
          details: null,
        },
      });
      return;
    }

    // Reset failed attempts on successful login
    delete loginFailedAttempts[lowerEmail];

    const accessToken = signAccessToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      firstName: "", 
      lastName: "" 
    });
    const refreshToken = signRefreshToken({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      firstName: "", 
      lastName: "" 
    });

    res.cookie("devfusion_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("devfusion_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      token: accessToken,
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: err.message || "Login failed",
        details: null,
      },
    });
  }
});

authRouter.get("/me", requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({
    user: req.user,
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("devfusion_access_token");
  res.clearCookie("devfusion_refresh_token");
  res.json({ ok: true, message: "Logged out successfully" });
});

authRouter.post("/refresh", (req, res) => {
  const cookieToken = req.cookies?.devfusion_refresh_token ?? null;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const refreshToken = cookieToken ?? bearerToken;

  if (!refreshToken) {
    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Refresh token missing",
        details: null,
      },
    });
    return;
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ 
      id: decoded.sub, 
      email: decoded.email, 
      role: decoded.role as any, 
      firstName: "", 
      lastName: "" 
    });
    res.cookie("devfusion_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ token: accessToken });
  } catch {
    res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Refresh token is invalid or expired",
        details: null,
      },
    });
  }
});

authRouter.get("/admin-only", requireAuth, requireRole(["ADMIN"]), (_req, res) => {
  res.json({ ok: true, message: "admin access verified" });
});
