import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { prisma } from "../db.js";

const medicineSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  stock: z.number().int().nonnegative(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.number().nonnegative(),
});

const fulfillmentSchema = z.object({
  prescriptionId: z.string().min(1),
  medicationName: z.string().min(1),
  quantity: z.number().int().positive(),
});

type PharmacyItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  expiryDate: string;
  price: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
};

const inventory: PharmacyItem[] = [
  { id: "med_1", name: "Amlodipine", category: "Cardiology", stock: 42, expiryDate: "2027-09-01", price: 120, status: "IN_STOCK" },
  { id: "med_2", name: "Vitamin D3", category: "Supplement", stock: 9, expiryDate: "2026-12-10", price: 180, status: "LOW_STOCK" },
  { id: "med_3", name: "Paracetamol", category: "Pain Relief", stock: 0, expiryDate: "2026-11-25", price: 35, status: "OUT_OF_STOCK" },
];

const fulfillmentStore: Array<{ id: string; prescriptionId: string; medicationName: string; quantity: number; status: "FULFILLED" | "PENDING" }> = [];

export const pharmacyRouter = Router();

pharmacyRouter.use(requireAuth);

pharmacyRouter.get("/inventory", requireRole(["PHARMACIST", "ADMIN", "HOSPITAL_ADMIN", "DOCTOR"]), async (_req, res) => {
  try {
    const dbMeds = await prisma.medicine.findMany({ orderBy: { name: "asc" } });
    if (dbMeds.length > 0) {
      res.json({
        inventory: dbMeds.map((m) => ({
          id: m.id,
          name: m.name,
          category: m.genericName || "General",
          stock: m.quantity,
          expiryDate: m.expiryDate.toISOString().slice(0, 10),
          price: m.unitPrice,
          status: m.quantity === 0 ? "OUT_OF_STOCK" : m.quantity < 10 ? "LOW_STOCK" : "IN_STOCK",
        })),
      });
      return;
    }
  } catch {
    // fallback
  }

  res.json({ inventory });
});

pharmacyRouter.post("/inventory", requireRole(["PHARMACIST", "ADMIN", "HOSPITAL_ADMIN"]), async (req, res) => {
  const parsed = medicineSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid medicine payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const medId = `med_${Date.now()}`;
  try {
    await prisma.medicine.create({
      data: {
        id: medId,
        name: parsed.data.name,
        dosage: "Standard",
        genericName: parsed.data.category,
        unitPrice: parsed.data.price,
        quantity: parsed.data.stock,
        expiryDate: new Date(parsed.data.expiryDate),
        purchaseDate: new Date(),
        status: parsed.data.stock === 0 ? "DISCONTINUED" : "ACTIVE",
      },
    });
  } catch {
    // fallback
  }

  const medicine: PharmacyItem = {
    id: medId,
    name: parsed.data.name,
    category: parsed.data.category,
    stock: parsed.data.stock,
    expiryDate: parsed.data.expiryDate,
    price: parsed.data.price,
    status: parsed.data.stock === 0 ? "OUT_OF_STOCK" : parsed.data.stock < 10 ? "LOW_STOCK" : "IN_STOCK",
  };

  inventory.push(medicine);
  res.status(201).json({ medicine });
});

pharmacyRouter.post("/fulfill", requireRole(["PHARMACIST", "ADMIN", "HOSPITAL_ADMIN"]), async (req, res) => {
  const parsed = fulfillmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid fulfillment payload",
        details: parsed.error.flatten(),
      },
    });
    return;
  }

  const item = inventory.find((entry) => entry.name.toLowerCase() === parsed.data.medicationName.toLowerCase());
  if (!item) {
    res.status(404).json({
      error: {
        code: "MEDICINE_NOT_FOUND",
        message: "Medicine not found in inventory",
        details: null,
      },
    });
    return;
  }

  if (item.stock < parsed.data.quantity) {
    res.status(409).json({
      error: {
        code: "INSUFFICIENT_STOCK",
        message: "Requested quantity exceeds current stock",
        details: null,
      },
    });
    return;
  }

  item.stock -= parsed.data.quantity;
  item.status = item.stock === 0 ? "OUT_OF_STOCK" : item.stock < 10 ? "LOW_STOCK" : "IN_STOCK";

  const fulfillment = {
    id: `fill_${Date.now()}`,
    prescriptionId: parsed.data.prescriptionId,
    medicationName: parsed.data.medicationName,
    quantity: parsed.data.quantity,
    status: "FULFILLED" as const,
  };

  fulfillmentStore.push(fulfillment);
  res.status(201).json({ fulfillment, inventory });
});

pharmacyRouter.get("/fulfillment", requireRole(["PHARMACIST", "ADMIN", "HOSPITAL_ADMIN", "DOCTOR"]), async (_req, res) => {
  res.json({ fulfillment: fulfillmentStore });
});

export const getInventory = () => inventory;
export const getFulfillments = () => fulfillmentStore;
