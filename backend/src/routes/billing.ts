import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";

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

type Invoice = {
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

const invoiceStore: Invoice[] = [
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

billingRouter.get("/invoices", requireRole(["ADMIN", "RECEPTIONIST", "PATIENT", "DOCTOR"]), (_req, res) => {
  res.json({ invoices: invoiceStore });
});

billingRouter.post("/invoices", requireRole(["RECEPTIONIST", "ADMIN", "DOCTOR"]), (req, res) => {
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

  const invoice: Invoice = {
    id: `inv_${Date.now()}`,
    patientId: parsed.data.patientId,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    category: parsed.data.category,
    status: parsed.data.status,
    paymentMethod: parsed.data.paymentMethod,
    reference: parsed.data.reference,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  invoiceStore.push(invoice);
  res.status(201).json({ invoice });
});

billingRouter.get("/invoices/:invoiceId", requireRole(["ADMIN", "RECEPTIONIST", "PATIENT", "DOCTOR"]), (req, res) => {
  const invoice = invoiceStore.find((entry) => entry.id === req.params.invoiceId);
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

billingRouter.patch("/invoices/:invoiceId/payment", requireRole(["ADMIN", "RECEPTIONIST", "PATIENT"]), (req, res) => {
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

  const invoice = invoiceStore.find((entry) => entry.id === req.params.invoiceId);
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

billingRouter.get("/patient/:patientId", requireRole(["PATIENT", "ADMIN", "RECEPTIONIST", "DOCTOR"]), (req, res) => {
  const patientInvoices = invoiceStore.filter((entry) => entry.patientId === req.params.patientId);
  res.json({ invoices: patientInvoices });
});

export const getInvoices = () => invoiceStore;
