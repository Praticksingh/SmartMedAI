import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const invoiceSchema = z.object({
  patientId: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  category: z.enum(["CONSULTATION", "LAB", "PHARMACY", "MISCELLANEOUS"]).default("CONSULTATION"),
  status: z.enum(["PENDING", "PAID", "FAILED", "CANCELLED"]).default("PENDING"),
  paymentMethod: z.enum(["UPI", "CARD", "NET_BANKING", "CASH"]).default("UPI"),
  reference: z.string().optional().default(""),
});

const paymentUpdateSchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "CANCELLED"]),
  reference: z.string().optional().default(""),
});

type InvoiceItem = {
  id: string;
  patientId: string;
  amount: number;
  currency: string;
  category: "CONSULTATION" | "LAB" | "PHARMACY" | "MISCELLANEOUS";
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  paymentMethod: "UPI" | "CARD" | "NET_BANKING" | "CASH";
  reference: string;
  createdAt: string;
  updatedAt: string;
};

const invoiceStore: InvoiceItem[] = [
  {
    id: "inv_1",
    patientId: "patient_demo_1",
    amount: 1850,
    currency: "INR",
    category: "CONSULTATION",
    status: "PENDING",
    paymentMethod: "UPI",
    reference: "demo-upi-ref-001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const billingRouter = Router();

billingRouter.use(requireAuth);

billingRouter.get("/invoices", requireRole(["ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "PATIENT", "DOCTOR", "DEPARTMENT_STAFF"]), async (_req, res) => {
  try {
    const dbInvoices = await prisma.invoice.findMany({
      include: { payments: true, patient: true },
      orderBy: { createdAt: "desc" },
    });
    if (dbInvoices.length > 0) {
      const formatted = dbInvoices.map((inv) => ({
        id: inv.id,
        patientId: inv.patientId,
        amount: inv.totalAmount,
        currency: "INR",
        category: (inv.description?.includes("LAB") ? "LAB" : inv.description?.includes("PHARMACY") ? "PHARMACY" : "CONSULTATION") as any,
        status: inv.status as any,
        paymentMethod: (inv.payments[0]?.method ?? "UPI") as any,
        reference: inv.payments[0]?.reference ?? inv.invoiceNumber,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      }));
      res.json({ invoices: formatted });
      return;
    }
  } catch {
    // Database fallback
  }
  res.json({ invoices: invoiceStore });
});

billingRouter.post("/invoices", requireRole(["RECEPTIONIST", "ADMIN", "HOSPITAL_ADMIN", "DOCTOR"]), async (req, res) => {
  const parsed = invoiceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid invoice payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const invoiceId = `inv_${Date.now()}`;
  const now = new Date().toISOString();

  try {
    let patient = await prisma.patientProfile.findUnique({
      where: { id: parsed.data.patientId },
    });
    if (!patient) {
      patient = await prisma.patientProfile.findUnique({
        where: { userId: parsed.data.patientId },
      });
    }

    if (patient) {
      const created = await prisma.invoice.create({
        data: {
          id: invoiceId,
          patientId: patient.id,
          invoiceNumber: `INV-${Date.now()}`,
          subtotal: parsed.data.amount,
          totalAmount: parsed.data.amount,
          status: parsed.data.status === "PAID" ? "PAID" : "PENDING",
          description: `${parsed.data.category} Fee`,
        },
      });

      if (parsed.data.reference || parsed.data.status === "PAID") {
        await prisma.payment.create({
          data: {
            invoiceId: created.id,
            amount: parsed.data.amount,
            method: parsed.data.paymentMethod === "CARD" ? "DEBIT_CARD" : (parsed.data.paymentMethod as any),
            status: parsed.data.status === "PAID" ? "SUCCESS" : "PENDING",
            reference: parsed.data.reference || "DIRECT",
          },
        });
      }
    }
  } catch {
    // If DB write failed, retain memory copy
  }

  const invoice: InvoiceItem = {
    id: invoiceId,
    patientId: parsed.data.patientId,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    category: parsed.data.category,
    status: parsed.data.status,
    paymentMethod: parsed.data.paymentMethod,
    reference: parsed.data.reference,
    createdAt: now,
    updatedAt: now,
  };

  invoiceStore.push(invoice);
  res.status(201).json({ invoice });
});

billingRouter.get("/invoices/:invoiceId", requireRole(["ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "PATIENT", "DOCTOR", "DEPARTMENT_STAFF"]), async (req, res) => {
  const invoiceId = Array.isArray(req.params.invoiceId) ? req.params.invoiceId[0] : req.params.invoiceId;
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true, patient: true },
    });
    if (inv) {
      res.json({
        invoice: {
          id: inv.id,
          patientId: inv.patientId,
          amount: inv.totalAmount,
          currency: "INR",
          category: "CONSULTATION",
          status: inv.status,
          paymentMethod: inv.payments[0]?.method ?? "UPI",
          reference: inv.payments[0]?.reference ?? inv.invoiceNumber,
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt.toISOString(),
        },
      });
      return;
    }
  } catch {
    // fallback
  }

  const invoice = invoiceStore.find((entry) => entry.id === invoiceId);
  if (!invoice) {
    res.status(404).json({
      error: {
        code: "INVOICE_NOT_FOUND",
        message: "Invoice not found",
        details: null,
      },
    });
    return;
  }

  res.json({ invoice });
});

billingRouter.patch("/invoices/:invoiceId/payment", requireRole(["ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "PATIENT"]), async (req, res) => {
  const parsed = paymentUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid payment update payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const invoiceId = Array.isArray(req.params.invoiceId) ? req.params.invoiceId[0] : req.params.invoiceId;
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: parsed.data.status === "PAID" ? "PAID" : "PENDING" },
    });
  } catch {
    // fallback
  }

  const invoice = invoiceStore.find((entry) => entry.id === invoiceId);
  if (!invoice) {
    res.status(404).json({
      error: {
        code: "INVOICE_NOT_FOUND",
        message: "Invoice not found",
        details: null,
      },
    });
    return;
  }

  invoice.status = parsed.data.status;
  invoice.reference = parsed.data.reference || invoice.reference;
  invoice.updatedAt = new Date().toISOString();

  res.json({ invoice });
});

billingRouter.get("/patient/:patientId", requireRole(["PATIENT", "ADMIN", "HOSPITAL_ADMIN", "RECEPTIONIST", "DOCTOR"]), async (req, res) => {
  const patientId = Array.isArray(req.params.patientId) ? req.params.patientId[0] : req.params.patientId;
  try {
    const dbInvoices = await prisma.invoice.findMany({
      where: { patientId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    });
    if (dbInvoices.length > 0) {
      res.json({
        invoices: dbInvoices.map((inv) => ({
          id: inv.id,
          patientId: inv.patientId,
          amount: inv.totalAmount,
          currency: "INR",
          category: "CONSULTATION",
          status: inv.status,
          paymentMethod: inv.payments[0]?.method ?? "UPI",
          reference: inv.payments[0]?.reference ?? inv.invoiceNumber,
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt.toISOString(),
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  const patientInvoices = invoiceStore.filter((entry) => entry.patientId === patientId);
  res.json({ invoices: patientInvoices });
});

export const getInvoices = () => invoiceStore;
