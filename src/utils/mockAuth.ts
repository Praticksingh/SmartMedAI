// Mock Authentication Engine — v2
// Backed by localStorage — works fully offline without Supabase credentials.
// Schema version tracked to handle future migrations cleanly.

export type UserRole = "PATIENT" | "DEPARTMENT_STAFF" | "DOCTOR" | "HOSPITAL_ADMIN";

export interface MockUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface MockProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  isProfileComplete: boolean;
}

interface MockAuthDB {
  schemaVersion: number;
  users: MockUser[];
  profiles: MockProfile[];
  passwords: Record<string, string>; // consolidated: email → plaintext (demo only)
  sessions: { userId: string; token: string } | null;
}

const AUTH_KEY = "opdflow_auth";
const CURRENT_SCHEMA = 2;

// ─── Pre-seeded demo accounts ────────────────────────────────────────────────
const SEED_USERS: MockUser[] = [
  { id: "user_patient_demo", email: "patient@demo.com", role: "PATIENT",         createdAt: "2026-01-01T00:00:00Z" },
  { id: "user_staff_demo",   email: "staff@demo.com",   role: "DEPARTMENT_STAFF", createdAt: "2026-01-01T00:00:00Z" },
  { id: "user_admin_demo",   email: "admin@demo.com",   role: "HOSPITAL_ADMIN",   createdAt: "2026-01-01T00:00:00Z" },
];

const SEED_PROFILES: MockProfile[] = [
  {
    id: "prof_patient_demo",
    userId: "user_patient_demo",
    fullName: "Aarav Sharma",
    dateOfBirth: "1990-04-15",
    gender: "Male",
    phone: "+91 98765 43210",
    isProfileComplete: true,
  },
  {
    id: "prof_staff_demo",
    userId: "user_staff_demo",
    fullName: "Sister Priya Nair",
    dateOfBirth: "1985-08-22",
    gender: "Female",
    phone: "+91 99887 76655",
    isProfileComplete: true,
  },
  {
    id: "prof_admin_demo",
    userId: "user_admin_demo",
    fullName: "Dr. Alok Sen",
    dateOfBirth: "1975-12-01",
    gender: "Male",
    phone: "+91 97654 32109",
    isProfileComplete: true,
  },
];

// Consolidated seed passwords (passwords stored in DB — demo only, never production)
const SEED_PASSWORDS: Record<string, string> = {
  "patient@demo.com": "demo1234",
  "staff@demo.com":   "demo1234",
  "admin@demo.com":   "demo1234",
};

// ─── DB helpers ───────────────────────────────────────────────────────────────
const freshDB = (): MockAuthDB => ({
  schemaVersion: CURRENT_SCHEMA,
  users: SEED_USERS,
  profiles: SEED_PROFILES,
  passwords: SEED_PASSWORDS,
  sessions: null,
});

const readAuthDB = (): MockAuthDB => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) throw new Error("empty");
    const db = JSON.parse(raw) as MockAuthDB;

    // Schema migration: v1 had separate passwords key — merge into DB
    if (!db.schemaVersion || db.schemaVersion < CURRENT_SCHEMA) {
      const oldPasswords = JSON.parse(localStorage.getItem("opdflow_auth_passwords") ?? "{}");
      const migrated: MockAuthDB = {
        schemaVersion: CURRENT_SCHEMA,
        users: db.users ?? SEED_USERS,
        profiles: db.profiles ?? SEED_PROFILES,
        passwords: { ...SEED_PASSWORDS, ...oldPasswords, ...(db as any).passwords },
        sessions: db.sessions ?? null,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(migrated));
      localStorage.removeItem("opdflow_auth_passwords"); // clean up old key
      return migrated;
    }

    // Always ensure seed passwords are present (resilient to manual edits)
    const merged = { ...SEED_PASSWORDS, ...db.passwords };
    if (JSON.stringify(merged) !== JSON.stringify(db.passwords)) {
      db.passwords = merged;
      localStorage.setItem(AUTH_KEY, JSON.stringify(db));
    }

    return db;
  } catch {
    const db = freshDB();
    localStorage.setItem(AUTH_KEY, JSON.stringify(db));
    return db;
  }
};

const writeAuthDB = (db: MockAuthDB) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(db));
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const getMockSession = (): { user: MockUser; profile: MockProfile | null } | null => {
  const db = readAuthDB();
  if (!db.sessions) return null;

  const user = db.users.find(u => u.id === db.sessions!.userId);
  if (!user) return null;

  const profile = db.profiles.find(p => p.userId === user.id) ?? null;
  return { user, profile };
};

export interface SignUpPayload {
  email: string;
  password: string;
  role?: UserRole;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
}

export const mockSignUp = (payload: SignUpPayload): { user: MockUser; profile: MockProfile } | { error: string } => {
  const db = readAuthDB();

  if (db.users.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
    return { error: "An account with this email address already exists." };
  }

  const userId = `user_${Date.now()}`;
  const newUser: MockUser = {
    id: userId,
    email: payload.email.toLowerCase(),
    role: payload.role ?? "PATIENT",
    createdAt: new Date().toISOString(),
  };

  const newProfile: MockProfile = {
    id: `prof_${Date.now()}`,
    userId,
    fullName: payload.fullName ?? "",
    dateOfBirth: payload.dateOfBirth ?? "",
    gender: payload.gender ?? "",
    phone: payload.phone ?? "",
    isProfileComplete: !!(payload.fullName && payload.dateOfBirth && payload.gender && payload.phone),
  };

  // Store password in consolidated DB (not separate key)
  db.passwords[payload.email.toLowerCase()] = payload.password;
  db.users.push(newUser);
  db.profiles.push(newProfile);
  db.sessions = { userId, token: `tok_${Math.random().toString(36).slice(2)}` };
  writeAuthDB(db);

  return { user: newUser, profile: newProfile };
};

export const mockSignIn = (
  email: string,
  password: string
): { user: MockUser; profile: MockProfile | null } | { error: string } => {
  const db = readAuthDB();
  const lowerEmail = email.toLowerCase();

  const user = db.users.find(u => u.email === lowerEmail);
  if (!user) return { error: "No account found with this email address." };

  if (db.passwords[lowerEmail] !== password) {
    return { error: "Incorrect password. Please try again." };
  }

  const profile = db.profiles.find(p => p.userId === user.id) ?? null;
  db.sessions = { userId: user.id, token: `tok_${Math.random().toString(36).slice(2)}` };
  writeAuthDB(db);

  return { user, profile };
};

export const mockSignOut = () => {
  const db = readAuthDB();
  db.sessions = null;
  writeAuthDB(db);
};

export const mockUpdateProfile = (
  userId: string,
  updates: Partial<Omit<MockProfile, "id" | "userId">>
): MockProfile | { error: string } => {
  const db = readAuthDB();
  const idx = db.profiles.findIndex(p => p.userId === userId);

  if (idx === -1) return { error: "Profile not found." };

  const current = db.profiles[idx];
  const updated: MockProfile = {
    ...current,
    ...updates,
    isProfileComplete: !!(
      (updates.fullName ?? current.fullName) &&
      (updates.dateOfBirth ?? current.dateOfBirth) &&
      (updates.gender ?? current.gender) &&
      (updates.phone ?? current.phone)
    ),
  };

  db.profiles[idx] = updated;
  writeAuthDB(db);
  return updated;
};

// ─── Password reset (mock) ────────────────────────────────────────────────────
export const mockRequestPasswordReset = (email: string): { ok: true } | { error: string } => {
  const db = readAuthDB();
  const lowerEmail = email.toLowerCase();
  const exists = db.users.some(u => u.email === lowerEmail);
  if (!exists) return { error: "No account found with this email address." };
  return { ok: true }; // In production: send email via Supabase Auth
};

export const mockResetPassword = (email: string, newPassword: string): { ok: true } | { error: string } => {
  const db = readAuthDB();
  const lowerEmail = email.toLowerCase();
  if (!db.users.some(u => u.email === lowerEmail)) {
    return { error: "Account not found." };
  }
  db.passwords[lowerEmail] = newPassword;
  writeAuthDB(db);
  return { ok: true };
};
