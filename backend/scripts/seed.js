import pkg from '@prisma/client';
const PrismaClient = pkg?.PrismaClient || pkg?.default?.PrismaClient;
import bcrypt from 'bcryptjs';
import { buildSeed } from '../src/data/seed.js';
import { DEFAULT_DEVICE_MAPPINGS } from '../src/services/analyzerParser.js';

let prisma;
if (PrismaClient) {
  try {
    prisma = new PrismaClient();
  } catch (e) {
    console.warn('Prisma instantiation warning in seed:', e.message);
  }
}

export async function seedDatabase(customPrisma) {
  const db = customPrisma || prisma;
  if (!db) {
    console.log('Prisma client not available. In-memory state will be used.');
    return;
  }

  const seed = buildSeed();

  console.log('Seeding PostgreSQL database for St. Michael Medium Clinic...');

  // 1. Clear existing data in correct FK order
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE 
      "audit_logs",
      "queues",
      "consultations",
      "lab_results",
      "lab_requests",
      "procedures",
      "prescriptions",
      "visits",
      "patients",
      "users",
      "lab_tests",
      "lab_categories",
      "medicines",
      "procedure_types",
      "departments",
      "lab_devices"
    CASCADE;
  `);

  // 2. Catalogs
  await db.department.createMany({
    data: seed.departments.map((name, idx) => ({ id: `DP-${String(idx + 1).padStart(2, '0')}`, name })),
  });

  if (seed.labCategories && db.labCategory) {
    await db.labCategory.createMany({
      data: seed.labCategories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        code: c.code,
        description: c.description || '',
        displayOrder: c.displayOrder || 0,
      })),
    });
  }

  await db.labTest.createMany({
    data: seed.labTests.map((t) => ({
      id: t.id,
      name: t.name,
      group: t.group,
      unit: t.unit || '',
      referenceRange: t.referenceRange || '',
    })),
  });

  // Enrich lab_tests table with full price, code, and bundle fields
  try {
    for (const t of seed.labTests) {
      await db.$executeRawUnsafe(
        `UPDATE "lab_tests" SET 
          "code" = $1, "full_name" = $2, "category_id" = $3, 
          "price" = $4, "currency" = $5, "specimen_type" = $6, 
          "input_type" = $7, "is_quantitative" = $8, "is_panel" = $9, 
          "bundle_key" = $10, "bundle_note" = $11, 
          "options" = $12::jsonb, "sub_parameters" = $13::jsonb, "description" = $14 
        WHERE "id" = $15`,
        t.code || '',
        t.fullName || t.name,
        t.categoryId || null,
        t.price || 0,
        t.currency || 'ETB',
        t.specimenType || '',
        t.inputType || 'number',
        t.isQuantitative ?? true,
        t.isPanel ?? false,
        t.bundleKey || null,
        t.bundleNote || null,
        JSON.stringify(t.options || []),
        JSON.stringify(t.subParameters || []),
        t.description || '',
        t.id
      );
    }
  } catch (enrichErr) {
    console.warn('Lab test metadata enrichment warning:', enrichErr.message);
  }

  await db.medicine.createMany({
    data: seed.medicines.map((m) => ({
      id: m.id,
      name: m.name,
      form: m.form,
      defaultDosage: m.defaultDosage || null,
      defaultRoute: m.defaultRoute || null,
    })),
  });

  await db.procedureType.createMany({
    data: seed.procedureTypes.map((p) => ({
      id: p.id,
      name: p.name,
    })),
  });

  // 3. Laboratory Devices (CVC / CBC Analyzer & Chemistry Analyzer Integration)
  await db.labDevice.createMany({
    data: [
      {
        id: 'DEV-CBC-01',
        deviceCode: 'DEV-CBC-01',
        name: 'Mindray BC-5000 / Sysmex XN-550 (Hematology / CBC Analyzer)',
        analyzerType: 'CBC',
        protocol: 'HL7',
        ipAddress: '192.168.1.120',
        port: 5100,
        mappings: {
          HGB: 'LT-01',
          HB: 'LT-01',
          WBC: 'LT-02',
          PLT: 'LT-03',
        },
      },
      {
        id: 'DEV-CHEM-01',
        deviceCode: 'DEV-CHEM-01',
        name: 'Roche Cobas c311 / Mindray BS-240 (Clinical Chemistry Analyzer)',
        analyzerType: 'CHEMISTRY',
        protocol: 'ASTM',
        ipAddress: '192.168.1.125',
        port: 5200,
        mappings: {
          GLU: 'LT-04',
          FBS: 'LT-04',
          RBS: 'LT-05',
          CHOL: 'LT-06',
          CREA: 'LT-07',
          ALT: 'LT-08',
          SGPT: 'LT-08',
        },
      },
    ],
  });

  // 4. Users (with bcrypt hashed passwords)
  const hashedUsers = seed.users.map((u) => ({
    id: u.id,
    username: u.username.toLowerCase(),
    passwordHash: bcrypt.hashSync(u.password, 10),
    fullName: u.name,
    role: u.role,
    title: u.title || '',
    active: true,
  }));

  await db.user.createMany({
    data: hashedUsers,
  });

  // 5. Patients
  await db.patient.createMany({
    data: seed.patients.map((p) => ({
      id: p.id,
      patientNumber: p.patientNumber || p.id,
      fullName: p.fullName,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth || null,
      phone: p.phone,
      address: p.address || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactPhone: p.emergencyContactPhone || '',
      relationshipToPatient: p.relationshipToPatient || '',
      allergies: p.allergies || [],
      registrationDate: new Date(p.registrationDate || p.createdAt),
      createdAt: new Date(p.createdAt),
    })),
  });

  // 6. Visits
  await db.visit.createMany({
    data: seed.visits.map((v) => ({
      id: v.id,
      visitNumber: v.visitNumber,
      patientId: v.patientId,
      service: v.service,
      reason: v.reason || '',
      status: v.status || 'completed',
      createdAt: new Date(v.createdAt || v.date),
    })),
  });

  // 7. Queues
  await db.queue.createMany({
    data: seed.queue.map((q) => ({
      id: q.id,
      queueNumber: q.queueNumber,
      visitId: q.visitId,
      patientId: q.patientId,
      department: q.department || 'OPD',
      queueStatus: q.status || 'waiting',
      priority: q.priority || 'NORMAL',
      createdAt: new Date(q.time),
      calledAt: q.calledAt ? new Date(q.calledAt) : null,
      completedAt: q.completedAt ? new Date(q.completedAt) : null,
    })),
  });

  // 8. Consultations
  await db.consultation.createMany({
    data: seed.consultations.map((c) => ({
      id: c.id,
      consultationNumber: c.consultationNumber,
      visitId: c.visitId,
      visitNumber: c.visitNumber,
      patientId: c.patientId,
      patientName: c.patientName,
      doctor: c.doctor,
      doctorId: c.doctorId || 'U-DOCTOR',
      date: new Date(c.date),
      status: c.status || 'in_progress',
      vitals: c.vitals || {},
      chiefComplaint: c.chiefComplaint || '',
      medicalHistory: c.medicalHistory || '',
      clinicalExamination: c.clinicalExamination || '',
      diagnosis: c.diagnosis || '',
      treatmentRecommendation: c.treatmentRecommendation || '',
      doctorNotes: c.doctorNotes || '',
      followUp: c.followUp || '',
      referral: c.referral || null,
    })),
  });

  // 9. Lab Requests
  await db.labRequest.createMany({
    data: seed.labRequests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      visitId: r.visitId,
      visitNumber: r.visitNumber,
      patientId: r.patientId,
      patientName: r.patientName,
      requestingDoctor: r.requestingDoctor,
      date: new Date(r.date),
      tests: r.tests || [],
      status: r.status || 'pending',
    })),
  });

  // 10. Lab Results
  await db.labResult.createMany({
    data: seed.labResults.map((res) => ({
      id: res.id,
      requestId: res.requestId,
      requestNumber: res.requestNumber,
      patientId: res.patientId,
      visitId: res.visitId,
      status: res.status || 'pending',
      date: new Date(res.date),
      enteredAt: res.enteredAt ? new Date(res.enteredAt) : null,
      verifiedAt: res.verifiedAt ? new Date(res.verifiedAt) : null,
      enteredBy: res.enteredBy || null,
      verifiedBy: res.verifiedBy || null,
      results: res.results || [],
    })),
  });

  // 11. Procedures
  await db.procedure.createMany({
    data: seed.procedures.map((p) => ({
      id: p.id,
      procedureNumber: p.procedureNumber,
      visitId: p.visitId,
      visitNumber: p.visitNumber,
      patientId: p.patientId,
      patientName: p.patientName,
      requestingDoctor: p.requestingDoctor,
      procedureType: p.procedureType,
      notes: p.notes || '',
      date: new Date(p.date),
      status: p.status || 'requested',
      recording: p.recording || null,
    })),
  });

  // 12. Prescriptions
  await db.prescription.createMany({
    data: seed.prescriptions.map((px) => ({
      id: px.id,
      prescriptionNumber: px.prescriptionNumber,
      visitId: px.visitId,
      visitNumber: px.visitNumber,
      patientId: px.patientId,
      patientName: px.patientName,
      doctor: px.doctor,
      date: new Date(px.date),
      medicines: px.medicines || [],
      status: px.status || 'completed',
    })),
  });

  // 13. Initial Audit Log
  await db.auditLog.create({
    data: {
      id: 'AUD-000001',
      userId: 'U-ADMIN',
      userName: 'Amanuel Berhe',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: 'SYSTEM',
      details: { version: '1.0.0-phase1', seedPatients: seed.patients.length },
      createdAt: new Date(),
    },
  });

  console.log('PostgreSQL database seeded successfully with full demo and catalog data.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .catch((err) => {
      console.error('Error seeding database:', err);
      process.exit(1);
    })
    .finally(async () => {
      if (prisma) await prisma.$disconnect();
    });
}
