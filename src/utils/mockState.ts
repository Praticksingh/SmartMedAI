// Shared Mock Database State Synchronizer using localStorage

export interface DepartmentData {
  id: number;
  name: string;
  code: string;
  room: string;
  waiting: number;
  treating: number;
  maxCapacity: number;
  currentCapacity: number;
  status: "ACTIVE" | "PAUSED" | "ON_BREAK";
  wait: string;
  nowServing: string | null;
  nextTokens: string[];
}

export interface PatientVisit {
  id: string;
  patientName: string;
  departmentCode: string;
  priority: "p1" | "p2" | "p3" | "p4";
  priorityText: string;
  tokenNumber: string;
  qrCodeReference: string;
  status: "WAITING" | "CHECKED_IN" | "IN_TREATMENT" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  mainSymptom: string;
  submittedAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: "DOCTOR" | "NURSE";
  assignedDeptCode: string;
  status: "ACTIVE" | "ON_BREAK" | "OFF_DUTY";
}

export interface AuditLog {
  time: string;
  actor: string;
  action: string;
  desc: string;
}

const STORAGE_KEY = "opdflow_mock_db";
const CUSTOM_EVENT_TYPE = "opdflow_db_update";

// Initial mock staff dataset
export const INITIAL_STAFF: StaffMember[] = [
  { id: "s_1", name: "Dr. Alok Sen",        role: "DOCTOR", assignedDeptCode: "CARD",   status: "ACTIVE" },
  { id: "s_2", name: "Dr. Sunita Rao",      role: "DOCTOR", assignedDeptCode: "PEDI",   status: "ACTIVE" },
  { id: "s_3", name: "Dr. Ramesh Patel",    role: "DOCTOR", assignedDeptCode: "DERM",   status: "ON_BREAK" },
  { id: "s_4", name: "Dr. Kavita Sharma",   role: "DOCTOR", assignedDeptCode: "GENMED", status: "ACTIVE" },
  { id: "s_5", name: "Dr. Rajesh Gupta",    role: "DOCTOR", assignedDeptCode: "ORTHO",  status: "ACTIVE" },
  { id: "s_6", name: "Sister Priya Nair",   role: "NURSE",  assignedDeptCode: "CARD",   status: "ACTIVE" },
  { id: "s_7", name: "Nurse Vikram Mehta",  role: "NURSE",  assignedDeptCode: "PEDI",   status: "ACTIVE" },
  { id: "s_8", name: "Nurse Ananya Roy",    role: "NURSE",  assignedDeptCode: "RESP",   status: "ACTIVE" },
];

// Initial mock dataset — covers all departments the triage engine can recommend
const INITIAL_DEPARTMENTS: DepartmentData[] = [
  { id: 1,  name: "Cardiology",              code: "CARD",   room: "Room 204", waiting: 3, treating: 1, maxCapacity: 3, currentCapacity: 1, status: "ACTIVE", wait: "14 min",     nowServing: "C-027", nextTokens: ["C-028", "C-031", "C-033"] },
  { id: 2,  name: "Paediatrics",             code: "PEDI",   room: "Room 105", waiting: 3, treating: 1, maxCapacity: 4, currentCapacity: 1, status: "ACTIVE", wait: "28 min",     nowServing: "P-044", nextTokens: ["P-045", "P-048", "P-050"] },
  { id: 3,  name: "Dermatology",             code: "DERM",   room: "Room 310", waiting: 2, treating: 0, maxCapacity: 2, currentCapacity: 0, status: "PAUSED", wait: "Queue Paused", nowServing: null,    nextTokens: ["D-009", "D-010"] },
  { id: 4,  name: "Orthopaedics",            code: "ORTHO",  room: "Room 112", waiting: 4, treating: 1, maxCapacity: 3, currentCapacity: 1, status: "ACTIVE", wait: "9 min",      nowServing: "O-018", nextTokens: ["O-021", "O-022", "O-025", "O-026"] },
  { id: 5,  name: "Neurology",               code: "NEURO",  room: "Room 301", waiting: 1, treating: 1, maxCapacity: 3, currentCapacity: 1, status: "ACTIVE", wait: "20 min",     nowServing: "N-003", nextTokens: ["N-004"] },
  { id: 6,  name: "Respiratory Medicine",    code: "RESP",   room: "Room 208", waiting: 2, treating: 1, maxCapacity: 3, currentCapacity: 1, status: "ACTIVE", wait: "18 min",     nowServing: "R-011", nextTokens: ["R-012", "R-013"] },
  { id: 7,  name: "Gastroenterology",        code: "GASTRO", room: "Room 216", waiting: 2, treating: 0, maxCapacity: 3, currentCapacity: 0, status: "ACTIVE", wait: "35 min",     nowServing: null,    nextTokens: ["G-006", "G-007"] },
  { id: 8,  name: "Urology",                 code: "UROL",   room: "Room 140", waiting: 1, treating: 0, maxCapacity: 2, currentCapacity: 0, status: "ACTIVE", wait: "40 min",     nowServing: null,    nextTokens: ["U-002"] },
  { id: 9,  name: "Psychiatry",              code: "PSYCH",  room: "Room 402", waiting: 1, treating: 1, maxCapacity: 2, currentCapacity: 1, status: "ACTIVE", wait: "30 min",     nowServing: "PS-001",nextTokens: ["PS-002"] },
  { id: 10, name: "General Medicine",        code: "GENMED", room: "Room 101", waiting: 5, treating: 1, maxCapacity: 5, currentCapacity: 1, status: "ACTIVE", wait: "45 min",     nowServing: "GM-018",nextTokens: ["GM-019","GM-020","GM-021","GM-022","GM-023"] },
  { id: 11, name: "Obstetrics & Gynaecology",code: "OBS",    room: "Room 501", waiting: 2, treating: 1, maxCapacity: 3, currentCapacity: 1, status: "ACTIVE", wait: "25 min",     nowServing: "OB-004",nextTokens: ["OB-005","OB-006"] },
];

const INITIAL_LOGS: AuditLog[] = [
  { time: "16:34", actor: "Dr. Alok Sen (Admin)", action: "DEPARTMENT_PAUSED", desc: "Paused Dermatology queue due to clinic room maintenance." },
  { time: "15:12", actor: "Sister Priya Nair (Staff)", action: "QUEUE_OVERRIDE", desc: "Manually upgraded C-028 to P1 Critical (Patient showing signs of acute dyspnea)." },
  { time: "14:45", actor: "System AI", action: "TRIAGE_CREATED", desc: "Symptom assessment processed. Generated token P-045 (Recommended Pediatrics, P2 High)." }
];

export const INITIAL_VISITS: PatientVisit[] = [
  {
    id: "v_c028",
    patientName: "Rahul Verma",
    departmentCode: "CARD",
    priority: "p1",
    priorityText: "P1 Critical",
    tokenNumber: "C-028",
    qrCodeReference: "qr_sec_c028_card",
    status: "WAITING",
    mainSymptom: "Acute Chest Pain / Radiating Arm Pain",
    submittedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: "v_c031",
    patientName: "Meera Nair",
    departmentCode: "CARD",
    priority: "p2",
    priorityText: "P2 High",
    tokenNumber: "C-031",
    qrCodeReference: "qr_sec_c031_card",
    status: "WAITING",
    mainSymptom: "Tachycardia & Palpitations",
    submittedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "v_c033",
    patientName: "Vikram Singhania",
    departmentCode: "CARD",
    priority: "p3",
    priorityText: "P3 Moderate",
    tokenNumber: "C-033",
    qrCodeReference: "qr_sec_c033_card",
    status: "WAITING",
    mainSymptom: "Leg Oedema / Swollen Feet",
    submittedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: "v_p045",
    patientName: "Baby Aarohi (Guardian: Sunita)",
    departmentCode: "PEDI",
    priority: "p2",
    priorityText: "P2 High",
    tokenNumber: "P-045",
    qrCodeReference: "qr_sec_p045_pedi",
    status: "WAITING",
    mainSymptom: "High Grade Febrile Illness (>39°C)",
    submittedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "v_p048",
    patientName: "Master Kabir (Guardian: Manoj)",
    departmentCode: "PEDI",
    priority: "p2",
    priorityText: "P2 High",
    tokenNumber: "P-048",
    qrCodeReference: "qr_sec_p048_pedi",
    status: "WAITING",
    mainSymptom: "Persistent Wheezing & Cough",
    submittedAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(),
  },
  {
    id: "v_p050",
    patientName: "Baby Ishaan (Guardian: Priya)",
    departmentCode: "PEDI",
    priority: "p3",
    priorityText: "P3 Moderate",
    tokenNumber: "P-050",
    qrCodeReference: "qr_sec_p050_pedi",
    status: "WAITING",
    mainSymptom: "Earache & Rhinorrhea",
    submittedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "v_o021",
    patientName: "Deepak Joshi",
    departmentCode: "ORTHO",
    priority: "p2",
    priorityText: "P2 High",
    tokenNumber: "O-021",
    qrCodeReference: "qr_sec_o021_ortho",
    status: "WAITING",
    mainSymptom: "Acute Ankle Sprain / Suspected Fracture",
    submittedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: "v_o022",
    patientName: "Sunita Deshmukh",
    departmentCode: "ORTHO",
    priority: "p3",
    priorityText: "P3 Moderate",
    tokenNumber: "O-022",
    qrCodeReference: "qr_sec_o022_ortho",
    status: "WAITING",
    mainSymptom: "Lumbar Back Pain",
    submittedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
];

interface MockDB {
  departments: DepartmentData[];
  auditLogs: AuditLog[];
  activeVisits: PatientVisit[];
  staffMembers: StaffMember[];
}

// Read database from localStorage
export const readDB = (): MockDB => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const defaultDB = { 
      departments: INITIAL_DEPARTMENTS, 
      auditLogs: INITIAL_LOGS, 
      activeVisits: INITIAL_VISITS,
      staffMembers: INITIAL_STAFF 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDB));
    return defaultDB;
  }
  try {
    const parsed = JSON.parse(data);
    if (!parsed.staffMembers) parsed.staffMembers = INITIAL_STAFF;
    if (!parsed.activeVisits || parsed.activeVisits.length === 0) {
      parsed.activeVisits = INITIAL_VISITS;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse mock DB", e);
    return { 
      departments: INITIAL_DEPARTMENTS, 
      auditLogs: INITIAL_LOGS, 
      activeVisits: INITIAL_VISITS,
      staffMembers: INITIAL_STAFF 
    };
  }
};

// Write database to localStorage and trigger updates
const writeDB = (db: MockDB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_TYPE));
};

// State listener hook hook setup
export const subscribeToDB = (listener: () => void) => {
  window.addEventListener(CUSTOM_EVENT_TYPE, listener);
  window.addEventListener("storage", listener); // cross-tab synchronization
  return () => {
    window.removeEventListener(CUSTOM_EVENT_TYPE, listener);
    window.removeEventListener("storage", listener);
  };
};

// --- DATABASE OPERATIONS ---

// Add Audit Log
export const logEvent = (actor: string, action: string, desc: string) => {
  const db = readDB();
  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5); // "HH:MM"
  const newLog: AuditLog = { time: timeStr, actor, action, desc };
  db.auditLogs = [newLog, ...db.auditLogs].slice(0, 20); // Keep last 20 logs
  writeDB(db);
};

// Update Department Status (Active, Paused, On Break)
export const setDepartmentStatus = (code: string, status: "ACTIVE" | "PAUSED" | "ON_BREAK", actor: string) => {
  const db = readDB();
  let oldStatus = "ACTIVE";
  db.departments = db.departments.map((dept) => {
    if (dept.code === code) {
      oldStatus = dept.status;
      const wait = status === "ACTIVE" ? `${Math.floor(Math.random() * 20) + 10} min` : status === "PAUSED" ? "Queue Paused" : "Staff on Break";
      return { ...dept, status, wait };
    }
    return dept;
  });
  logEvent(actor, `DEPARTMENT_${status}`, `Set department ${code} status from ${oldStatus} to ${status}.`);
  writeDB(db);
};

// Add new Department
export const addDepartment = (name: string, code: string, maxCapacity: number, actor: string) => {
  const db = readDB();
  const uppercaseCode = code.toUpperCase();
  const exists = db.departments.some(d => d.code === uppercaseCode);
  if (exists) return false;

  const newDept: DepartmentData = {
    id: db.departments.length + 1,
    name,
    code: uppercaseCode,
    room: `Room ${Math.floor(Math.random() * 200) + 100}`,
    waiting: 0,
    treating: 0,
    maxCapacity,
    currentCapacity: 0,
    status: "ACTIVE",
    wait: "0 min",
    nowServing: null,
    nextTokens: []
  };

  db.departments.push(newDept);
  logEvent(actor, "DEPARTMENT_CREATED", `Created new department ${name} (${uppercaseCode}).`);
  writeDB(db);
  return true;
};

// Call Next Patient in Department
export const callNextPatient = (code: string, actor: string) => {
  const db = readDB();
  let calledToken = "";

  db.departments = db.departments.map((dept) => {
    if (dept.code === code) {
      if (dept.nextTokens.length === 0) return dept;
      
      const nextList = [...dept.nextTokens];
      const nextToken = nextList.shift()!;
      calledToken = nextToken;

      return {
        ...dept,
        nowServing: nextToken,
        nextTokens: nextList,
        waiting: Math.max(0, dept.waiting - 1),
        treating: 1,
        currentCapacity: Math.min(dept.maxCapacity, dept.currentCapacity + 1)
      };
    }
    return dept;
  });

  if (calledToken) {
    // If the patient is Aarav (our mock patient) update active visit status
    db.activeVisits = db.activeVisits.map(visit => {
      if (visit.tokenNumber === calledToken) {
        return { ...visit, status: "IN_TREATMENT" };
      }
      return visit;
    });

    logEvent(actor, "QUEUE_CALL", `Called token ${calledToken} to treatment room in ${code}.`);
    writeDB(db);
    return calledToken;
  }
  return null;
};

// Complete current patient treatment
export const completeCurrentPatient = (code: string, actor: string) => {
  const db = readDB();
  let completedToken = "";

  db.departments = db.departments.map((dept) => {
    if (dept.code === code) {
      if (!dept.nowServing) return dept;
      completedToken = dept.nowServing;
      return {
        ...dept,
        nowServing: null,
        treating: 0,
        currentCapacity: Math.max(0, dept.currentCapacity - 1)
      };
    }
    return dept;
  });

  if (completedToken) {
    db.activeVisits = db.activeVisits.map(visit => {
      if (visit.tokenNumber === completedToken) {
        return { ...visit, status: "COMPLETED" };
      }
      return visit;
    });

    logEvent(actor, "VISIT_COMPLETED", `Concluded consultation for token ${completedToken} in ${code}.`);
    writeDB(db);
    return completedToken;
  }
  return null;
};

// Mark patient as No-Show
export const markPatientNoShow = (code: string, actor: string) => {
  const db = readDB();
  let noShowToken = "";

  db.departments = db.departments.map((dept) => {
    if (dept.code === code) {
      if (!dept.nowServing) return dept;
      noShowToken = dept.nowServing;
      return {
        ...dept,
        nowServing: null,
        treating: 0,
        currentCapacity: Math.max(0, dept.currentCapacity - 1)
      };
    }
    return dept;
  });

  if (noShowToken) {
    db.activeVisits = db.activeVisits.map(visit => {
      if (visit.tokenNumber === noShowToken) {
        return { ...visit, status: "NO_SHOW" };
      }
      return visit;
    });

    logEvent(actor, "QUEUE_NOSHOW", `Marked called token ${noShowToken} as No-Show in ${code}.`);
    writeDB(db);
    return noShowToken;
  }
  return null;
};

export const getTokenPriority = (token: string, activeVisits: PatientVisit[]): "p1" | "p2" | "p3" | "p4" => {
  const visit = activeVisits.find(v => v.tokenNumber === token);
  if (visit) return visit.priority;

  // Fallback defaults for mock seed data
  if (token === "C-028" || token.endsWith("8")) return "p1";
  if (token === "C-031" || token === "P-045" || token === "P-048" || token === "O-021") return "p2";
  if (token === "C-033" || token === "P-050" || token === "O-022" || token === "O-025") return "p3";

  return "p4";
};

// Create a Patient Visit after Symptom Intake
export const addPatientVisit = (
  patientName: string,
  departmentCode: string,
  priority: "p1" | "p2" | "p3" | "p4",
  mainSymptom: string
) => {
  const db = readDB();
  let dept = db.departments.find((d) => d.code === departmentCode);
  if (!dept) dept = db.departments.find((d) => d.code === "GENMED") ?? db.departments[0];
  if (!dept) return null;
  const resolvedDeptCode = dept.code;

  const prefix = resolvedDeptCode.slice(0, 2).toUpperCase();
  const num = dept.nextTokens.length + (dept.nowServing ? 1 : 0) + 28;
  const tokenNumber = `${prefix}-${num.toString().padStart(3, "0")}`;

  const priorityTexts = {
    p1: "P1 Critical",
    p2: "P2 High",
    p3: "P3 Moderate",
    p4: "P4 Routine"
  };

  const newVisit: PatientVisit = {
    id: `visit_${Date.now()}`,
    patientName,
    departmentCode: resolvedDeptCode,
    priority,
    priorityText: priorityTexts[priority],
    tokenNumber,
    qrCodeReference: `qr_sec_${Math.random().toString(36).slice(2, 10)}`,
    status: "WAITING",
    mainSymptom,
    submittedAt: new Date().toISOString()
  };

  db.departments = db.departments.map((d) => {
    if (d.code === resolvedDeptCode) {
      const priorityWeights = { p1: 4, p2: 3, p3: 2, p4: 1 };
      const sortedTokens = [...d.nextTokens, tokenNumber].sort((a, b) => {
        const weightA = priorityWeights[getTokenPriority(a, db.activeVisits)];
        const weightB = priorityWeights[getTokenPriority(b, db.activeVisits)];
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        const numA = parseInt(a.split("-")[1], 10) || 999;
        const numB = parseInt(b.split("-")[1], 10) || 999;
        return numA - numB;
      });

      return {
        ...d,
        waiting: d.waiting + 1,
        nextTokens: sortedTokens
      };
    }
    return d;
  });

  db.activeVisits.push(newVisit);
  logEvent(patientName, "TRIAGE_CREATED", `Symptom assessment processed. Generated token ${tokenNumber} for ${dept.name} (${priorityTexts[priority]}).`);
  writeDB(db);

  return newVisit;
};

// Override Patient Priority from Clinical Station
export const overridePatientPriority = (
  tokenNumber: string,
  newPriority: "p1" | "p2" | "p3" | "p4",
  reason: string,
  staffName: string
) => {
  const db = readDB();
  const priorityTexts = {
    p1: "P1 Critical",
    p2: "P2 High",
    p3: "P3 Moderate",
    p4: "P4 Routine"
  };

  let oldPriorityText = "";

  // Update active visit record if present
  db.activeVisits = db.activeVisits.map((v) => {
    if (v.tokenNumber === tokenNumber) {
      oldPriorityText = v.priorityText;
      return {
        ...v,
        priority: newPriority,
        priorityText: priorityTexts[newPriority],
      };
    }
    return v;
  });

  // Re-sort department nextTokens using queueEngine logic
  const priorityWeights = { p1: 4, p2: 3, p3: 2, p4: 1 };

  db.departments = db.departments.map((dept) => {
    if (dept.nextTokens.includes(tokenNumber)) {
      const sortedTokens = [...dept.nextTokens].sort((a, b) => {
        const wA = priorityWeights[getTokenPriority(a, db.activeVisits)];
        const wB = priorityWeights[getTokenPriority(b, db.activeVisits)];
        if (wA !== wB) return wB - wA;
        const nA = parseInt(a.split("-")[1] || "999", 10);
        const nB = parseInt(b.split("-")[1] || "999", 10);
        return nA - nB;
      });
      return { ...dept, nextTokens: sortedTokens };
    }
    return dept;
  });

  logEvent(
    staffName,
    "QUEUE_OVERRIDE",
    `Clinical override for token ${tokenNumber}: Changed priority from ${oldPriorityText || "Default"} to ${priorityTexts[newPriority]}. Reason: ${reason}`
  );

  writeDB(db);
  return true;
};

// Reassign Staff Member to a Department
export const reassignStaffMember = (
  staffId: string,
  newDeptCode: string,
  adminName: string
) => {
  const db = readDB();
  let staffMemberName = "";
  let oldDeptCode = "";

  db.staffMembers = db.staffMembers.map((staff) => {
    if (staff.id === staffId) {
      staffMemberName = staff.name;
      oldDeptCode = staff.assignedDeptCode;
      return { ...staff, assignedDeptCode: newDeptCode };
    }
    return staff;
  });

  const targetDept = db.departments.find((d) => d.code === newDeptCode);
  const targetName = targetDept?.name || newDeptCode;

  // Dynamically boost department capacity when doctor is assigned
  db.departments = db.departments.map((dept) => {
    if (dept.code === newDeptCode) {
      return { ...dept, maxCapacity: dept.maxCapacity + 1 };
    }
    return dept;
  });

  logEvent(
    adminName,
    "STAFF_REASSIGNED",
    `Re-allocated ${staffMemberName} from ${oldDeptCode} to ${targetName} (${newDeptCode}). Clinic room capacity boosted.`
  );

  writeDB(db);
  return true;
};

// Update Department Max Capacity
export const updateDepartmentCapacity = (
  deptCode: string,
  newCapacity: number,
  adminName: string
) => {
  const db = readDB();
  db.departments = db.departments.map((dept) => {
    if (dept.code === deptCode) {
      return { ...dept, maxCapacity: newCapacity };
    }
    return dept;
  });

  logEvent(
    adminName,
    "CAPACITY_UPDATED",
    `Adjusted maximum room capacity for ${deptCode} to ${newCapacity} rooms.`
  );

  writeDB(db);
  return true;
};

// Reset Database to Initial State
export const resetDB = () => {
  const defaultDB = { 
    departments: INITIAL_DEPARTMENTS, 
    auditLogs: INITIAL_LOGS, 
    activeVisits: [],
    staffMembers: INITIAL_STAFF 
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDB));
  window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_TYPE));
};

