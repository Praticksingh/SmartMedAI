import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config.js";

export type AuthRole =
  | "PATIENT"
  | "DOCTOR"
  | "DEPARTMENT_STAFF"
  | "RECEPTIONIST"
  | "LAB_STAFF"
  | "PHARMACIST"
  | "HOSPITAL_ADMIN"
  | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: AuthRole;
}

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const signAccessToken = (user: AuthUser) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: "15m",
    issuer: "devfusion",
  });

export const signRefreshToken = (user: AuthUser) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role, type: "refresh" }, env.JWT_SECRET, {
    expiresIn: "7d",
    issuer: "devfusion",
  });

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string; role: AuthRole };
export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as { sub: string; email: string; role: AuthRole; type: "refresh" };
