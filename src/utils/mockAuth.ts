// Mock Authentication Engine — v2
// Backed by localStorage — works fully offline without Supabase credentials.
// Schema version tracked to handle future migrations cleanly.

export type UserRole =
  | "PATIENT"
  | "DOCTOR"
  | "DEPARTMENT_STAFF"
  | "RECEPTIONIST"
  | "LAB_STAFF"
  | "PHARMACIST"
  | "HOSPITAL_ADMIN"
  | "ADMIN";

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
const CURRENT_SCHEMA = 3;

// Consolidated seed passwords helper
const hashPw = (pw: string): string => {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    hash = (hash << 5) - hash + pw.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
};

// ─── DB helpers ───────────────────────────────────────────────────────────────
const freshDB = (): MockAuthDB => ({
  schemaVersion: CURRENT_SCHEMA,
  users: [],
  profiles: [],
  passwords: {},
  sessions: null,
});

const readAuthDB = (): MockAuthDB => {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) throw new Error("empty");
    const db = JSON.parse(raw) as MockAuthDB;

    // Schema migration & purge demo data: v3 cleans out demo accounts
    if (!db.schemaVersion || db.schemaVersion < CURRENT_SCHEMA) {
      const oldPasswords = JSON.parse(localStorage.getItem("opdflow_auth_passwords") ?? "{}");
      const cleanedUsers = (db.users || []).filter(u => !u.email.includes("demo.com") && !u.id.includes("demo"));
      const cleanedProfiles = (db.profiles || []).filter(p => !p.id.includes("demo") && !p.userId.includes("demo"));
      const cleanedPasswords = { ...oldPasswords, ...(db.passwords || {}) };
      delete cleanedPasswords["patient@demo.com"];
      delete cleanedPasswords["staff@demo.com"];
      delete cleanedPasswords["admin@demo.com"];

      const migrated: MockAuthDB = {
        schemaVersion: CURRENT_SCHEMA,
        users: cleanedUsers,
        profiles: cleanedProfiles,
        passwords: cleanedPasswords,
        sessions: db.sessions && cleanedUsers.some(u => u.id === db.sessions?.userId) ? db.sessions : null,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(migrated));
      localStorage.removeItem("opdflow_auth_passwords");
      return migrated;
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

  // Store hashed password in consolidated DB (never raw plaintext)
  db.passwords[payload.email.toLowerCase()] = hashPw(payload.password);
  db.users.push(newUser);
  db.profiles.push(newProfile);
  db.sessions = { userId, token: `tok_${Math.random().toString(36).slice(2)}` };
  writeAuthDB(db);

  return { user: newUser, profile: newProfile };
};

// Lockout tracker for security rule: 3 failed attempts = block login
interface LockoutData {
  count: number;
  lockUntil: number;
}

const getLockoutDB = (): Record<string, LockoutData> => {
  try {
    return JSON.parse(localStorage.getItem("opdflow_login_lockouts") ?? "{}");
  } catch {
    return {};
  }
};

const saveLockoutDB = (db: Record<string, LockoutData>) => {
  localStorage.setItem("opdflow_login_lockouts", JSON.stringify(db));
};

export const mockSignIn = (
  email: string,
  password: string
): { user: MockUser; profile: MockProfile | null } | { error: string } => {
  const db = readAuthDB();
  const lowerEmail = email.toLowerCase();
  const lockouts = getLockoutDB();
  const userLock = lockouts[lowerEmail];

  const now = Date.now();
  if (userLock && userLock.lockUntil > now) {
    const minsLeft = Math.ceil((userLock.lockUntil - now) / 60000);
    return { error: `Account locked due to 3 failed attempts. Try again in ${minsLeft} minute(s).` };
  }

  const user = db.users.find(u => u.email === lowerEmail);
  const storedPw = db.passwords[lowerEmail];
  const isValid = user && storedPw && (storedPw === password || storedPw === hashPw(password));

  if (!isValid) {
    const newCount = (userLock?.count ?? 0) + 1;
    if (newCount >= 3) {
      lockouts[lowerEmail] = { count: 3, lockUntil: now + 15 * 60 * 1000 };
      saveLockoutDB(lockouts);
      return {
        error: "ACCOUNT BLOCKED: Maximum limit of 3 failed login attempts reached. Dashboard access is locked for 15 minutes."
      };
    } else {
      lockouts[lowerEmail] = { count: newCount, lockUntil: 0 };
      saveLockoutDB(lockouts);
      return { error: `Invalid credentials. Failed attempt ${newCount} of 3. Reaching 3 failed attempts will block login.` };
    }
  }

  // Clear failed login attempts on success
  delete lockouts[lowerEmail];
  saveLockoutDB(lockouts);

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
