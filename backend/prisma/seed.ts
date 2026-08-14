import { PrismaClient, UserRole, DepartmentStatus, ConsultationType, PriorityLevel, MedicineStatus } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data (in reverse order of dependencies)
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.pharmacyFulfillment.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.labRequest.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.emrRecord.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log("Creating departments...");
  const cardiology = await prisma.department.create({
    data: {
      name: "Cardiology",
      code: "CARD",
      status: DepartmentStatus.ACTIVE,
      currentCapacity: 2,
      maxCapacity: 5,
    },
  });

  const pediatrics = await prisma.department.create({
    data: {
      name: "Pediatrics",
      code: "PEDI",
      status: DepartmentStatus.ACTIVE,
      currentCapacity: 1,
      maxCapacity: 4,
    },
  });

  await prisma.department.create({
    data: {
      name: "Orthopedics",
      code: "ORTH",
      status: DepartmentStatus.ACTIVE,
      currentCapacity: 0,
      maxCapacity: 3,
    },
  });

  console.log("Creating users and profiles...");

  // Admin user
  await prisma.user.create({
    data: {
      email: "admin@opdflow.local",
      password: await bcryptjs.hash("Admin@123", 10),
      role: UserRole.ADMIN,
      staffProfile: {
        create: {
          fullName: "System Admin",
          role: UserRole.ADMIN,
        },
      },
    },
  });

  // Patient users
  const patientUser1 = await prisma.user.create({
    data: {
      email: "patient1@opdflow.local",
      password: await bcryptjs.hash("Patient@123", 10),
      role: UserRole.PATIENT,
      patientProfile: {
        create: {
          fullName: "John Doe",
          dob: new Date("1990-05-15"),
          gender: "Male",
          phone: "+91-9876543210",
          email: "john@opdflow.local",
          address: "123 Main Street, City",
          bloodGroup: "O+",
          allergies: ["Penicillin"],
          conditions: ["Hypertension"],
          emergencyContact: "+91-9876543211",
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "patient2@opdflow.local",
      password: await bcryptjs.hash("Patient@123", 10),
      role: UserRole.PATIENT,
      patientProfile: {
        create: {
          fullName: "Jane Smith",
          dob: new Date("1985-08-22"),
          gender: "Female",
          phone: "+91-9876543212",
          email: "jane@opdflow.local",
          address: "456 Oak Avenue, City",
          bloodGroup: "A+",
          allergies: [],
          conditions: ["Diabetes"],
          emergencyContact: "+91-9876543213",
        },
      },
    },
  });

  // Doctor users
  const doctorUser1 = await prisma.user.create({
    data: {
      email: "doctor1@opdflow.local",
      password: await bcryptjs.hash("Doctor@123", 10),
      role: UserRole.DOCTOR,
      doctorProfile: {
        create: {
          fullName: "Dr. Rajesh Kumar",
          specialization: "Cardiology",
          qualifications: ["MBBS", "MD Cardiology"],
          licenseNumber: "LIC001",
          experience: 10,
          fee: 500,
          rating: 4.8,
          languages: ["English", "Hindi"],
          branch: "Main Hospital",
          verified: true,
          departmentId: cardiology.id,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: "doctor2@opdflow.local",
      password: await bcryptjs.hash("Doctor@123", 10),
      role: UserRole.DOCTOR,
      doctorProfile: {
        create: {
          fullName: "Dr. Priya Sharma",
          specialization: "Pediatrics",
          qualifications: ["MBBS", "DCH"],
          licenseNumber: "LIC002",
          experience: 8,
          fee: 400,
          rating: 4.9,
          languages: ["English", "Hindi"],
          branch: "Main Hospital",
          verified: true,
          departmentId: pediatrics.id,
        },
      },
    },
  });

  // Receptionist user
  await prisma.user.create({
    data: {
      email: "receptionist@opdflow.local",
      password: await bcryptjs.hash("Staff@123", 10),
      role: UserRole.RECEPTIONIST,
      staffProfile: {
        create: {
          fullName: "Ramesh Kumar",
          role: UserRole.RECEPTIONIST,
          departmentId: cardiology.id,
        },
      },
    },
  });

  // Lab staff user
  const labStaffUser = await prisma.user.create({
    data: {
      email: "labstaff@opdflow.local",
      password: await bcryptjs.hash("Staff@123", 10),
      role: UserRole.LAB_STAFF,
      staffProfile: {
        create: {
          fullName: "Sarah Johnson",
          role: UserRole.LAB_STAFF,
        },
      },
    },
  });

  // Pharmacist user
  const pharmacistUser = await prisma.user.create({
    data: {
      email: "pharmacist@opdflow.local",
      password: await bcryptjs.hash("Staff@123", 10),
      role: UserRole.PHARMACIST,
      staffProfile: {
        create: {
          fullName: "Michael Brown",
          role: UserRole.PHARMACIST,
        },
      },
    },
  });

  console.log("Creating medicines...");
  const medicine1 = await prisma.medicine.create({
    data: {
      name: "Aspirin 500mg",
      genericName: "Aspirin",
      dosage: "500mg",
      batchNumber: "BATCH001",
      expiryDate: new Date("2026-12-31"),
      supplier: "Pharma Ltd",
      purchaseDate: new Date("2024-01-15"),
      unitPrice: 10,
      quantity: 100,
      status: MedicineStatus.ACTIVE,
    },
  });

  const medicine2 = await prisma.medicine.create({
    data: {
      name: "Metformin 1000mg",
      genericName: "Metformin",
      dosage: "1000mg",
      batchNumber: "BATCH002",
      expiryDate: new Date("2027-06-30"),
      supplier: "Pharma Ltd",
      purchaseDate: new Date("2024-02-01"),
      unitPrice: 15,
      quantity: 50,
      status: MedicineStatus.ACTIVE,
    },
  });

  console.log("Creating appointments...");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const appointment1 = await prisma.appointment.create({
    data: {
      patientId: patientUser1.patientProfile!.id,
      doctorId: doctorUser1.doctorProfile!.id,
      departmentId: cardiology.id,
      appointmentDate: tomorrow,
      startTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      consultationType: ConsultationType.IN_PERSON,
      reason: "Regular checkup",
    },
  });

  console.log("Creating visits and queue entries...");
  const visit1 = await prisma.visit.create({
    data: {
      patientId: patientUser1.patientProfile!.id,
      departmentId: cardiology.id,
      priority: PriorityLevel.P3_MODERATE,
      tokenNumber: "CARD-001",
      qrCodeReference: "qr_code_ref_001",
    },
  });

  await prisma.queueEntry.create({
    data: {
      visitId: visit1.id,
      departmentId: cardiology.id,
      priority: PriorityLevel.P3_MODERATE,
      position: 1,
    },
  });

  console.log("Creating EMR records...");
  const emr1 = await prisma.emrRecord.create({
    data: {
      patientId: patientUser1.patientProfile!.id,
      doctorId: doctorUser1.doctorProfile!.id,
      visitId: visit1.id,
      visitDate: new Date(),
      diagnosis: "Hypertension - Controlled",
      symptoms: ["Mild headache", "Fatigue"],
      notes: "Patient is stable on current medication. Advised to continue routine monitoring.",
    },
  });

  console.log("Creating prescriptions...");
  const prescription1 = await prisma.prescription.create({
    data: {
      patientId: patientUser1.patientProfile!.id,
      doctorId: doctorUser1.doctorProfile!.id,
      emrRecordId: emr1.id,
      medicineName: "Aspirin 500mg",
      dosage: "500mg",
      frequency: "Once daily",
      duration: "30 days",
      instructions: "Take after breakfast with water",
    },
  });

  console.log("Creating pharmacy fulfillments...");
  await prisma.pharmacyFulfillment.create({
    data: {
      prescriptionId: prescription1.id,
      medicineId: medicine1.id,
      quantity: 30,
    },
  });

  console.log("Creating lab requests...");
  await prisma.labRequest.create({
    data: {
      patientId: patientUser1.patientProfile!.id,
      doctorId: doctorUser1.doctorProfile!.id,
      emrRecordId: emr1.id,
      testName: "Blood Test - Complete Blood Count",
      testCode: "CBC",
      description: "Routine CBC to monitor hemoglobin levels",
      priority: PriorityLevel.P3_MODERATE,
    },
  });

  console.log("Creating invoices...");
  const invoice1 = await prisma.invoice.create({
    data: {
      patientId: patientUser1.patientProfile!.id,
      invoiceNumber: "INV-2026-001",
      consultationFee: 500,
      labFee: 1200,
      pharmacyFee: 300,
      subtotal: 2000,
      taxAmount: 360,
      totalAmount: 2360,
    },
  });

  console.log("Creating notifications...");
  await prisma.notification.create({
    data: {
      userId: patientUser1.id,
      title: "Appointment Reminder",
      message: "Your appointment with Dr. Rajesh Kumar is tomorrow at 10:00 AM",
      category: "APPOINTMENT",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
