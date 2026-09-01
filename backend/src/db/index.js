let PrismaClient;
try {
  const pkg = await import('@prisma/client');
  PrismaClient = pkg?.PrismaClient || pkg?.default?.PrismaClient;
} catch {
  // Prisma client not generated yet
}

import { buildSeed } from '../data/seed.js';
import { computeAge, toDateKey, isToday, now, formatDate, waitingMinutes } from '../utils/helpers.js';
import {
  nextPatientId,
  nextVisitNumber,
  nextQueueNumber,
  nextConsultationNumber,
  nextLaboratoryRequestNumber,
  nextProcedureNumber,
  nextPrescriptionNumber,
  nextInjectionOrderNumber,
  nextInjectionAdminNumber,
  nextInvoiceNumber,
  nextPaymentNumber,
  nextReceiptNumber,
  nextSampleNumber,
  nextDeviceCode,
  nextUserId,
  resetCounters,
  seedCounter,
} from '../utils/idGenerator.js';
import { parseAnalyzerPayload, evaluateReferenceRange, DEFAULT_DEVICE_MAPPINGS } from '../services/analyzerParser.js';
import { hashPassword, comparePassword } from '../utils/password.js';

let prisma;
let isPostgresConnected = false;

if (PrismaClient) {
  try {
    prisma = new PrismaClient({
      log: ['error'],
    });
  } catch (e) {
    console.warn('Prisma client initialized with warning:', e.message);
  }
}

// In-memory shadow state for deterministic seed resets and fallback
let inMemoryState = buildSeed();

function seedAllCounters() {
  resetCounters();
  seedCounter('patient', inMemoryState.patients.length);
  seedCounter('visit', inMemoryState.visits.length);
  seedCounter('consultation', inMemoryState.consultations.length);
  seedCounter('laboratoryRequest', inMemoryState.labRequests.length);
  seedCounter('procedure', inMemoryState.procedures.length);
  seedCounter('prescription', inMemoryState.prescriptions.length);
  seedCounter('injectionOrder', (inMemoryState.injectionOrders || []).length);
  seedCounter('injectionAdmin', (inMemoryState.injectionAdministrations || []).length);
  seedCounter('invoice', (inMemoryState.invoices || []).length);
  seedCounter('payment', (inMemoryState.payments || []).length);
  seedCounter('receipt', (inMemoryState.payments || []).length);
  seedCounter('sample', (inMemoryState.labSamples || []).length);
  seedCounter('device', (inMemoryState.labDevices || []).length);
  seedCounter('user', inMemoryState.users.length);
}

seedAllCounters();

export async function checkDatabaseConnection() {
  if (!prisma) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPostgresConnected = true;
    return true;
  } catch {
    isPostgresConnected = false;
    return false;
  }
}

// Initial probe
checkDatabaseConnection().catch(() => {});

// Normalize role names
export function normalizeRole(role) {
  if (!role) return 'receptionist';
  const r = String(role).toUpperCase().trim();
  if (r === 'ADMINISTRATOR' || r === 'ADMIN') return 'administrator';
  if (r === 'RECEPTIONIST' || r === 'RECEPTION') return 'receptionist';
  if (r === 'DOCTOR' || r === 'OPD_DOCTOR') return 'doctor';
  if (r === 'LAB_TECHNICIAN' || r === 'LABORATORY' || r === 'LAB') return 'laboratory';
  if (r === 'PROCEDURE_NURSE' || r === 'PROCEDURE' || r === 'NURSE') return 'procedure';
  if (r === 'PHARMACY' || r === 'PHARMACIST') return 'pharmacy';
  return String(role).toLowerCase().trim();
}

export const db = {
  get isPostgres() {
    return isPostgresConnected;
  },

  // ---------------------------------------------------------------- AUDIT LOGS
  async createAuditLog(data) {
    const record = {
      id: data.id || `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: data.userId || null,
      userName: data.userName || 'System',
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      details: data.details || {},
      ipAddress: data.ipAddress || null,
      createdAt: new Date(),
    };
    if (isPostgresConnected) {
      try {
        await prisma.auditLog.create({ data: record });
      } catch (e) {
        console.warn('PG audit log fallback:', e.message);
      }
    }
    inMemoryState.auditLogs = inMemoryState.auditLogs || [];
    inMemoryState.auditLogs.unshift(record);
    return record;
  },

  async listAuditLogs(limit = 100) {
    if (isPostgresConnected) {
      try {
        return await prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      } catch (e) {
        console.warn('PG list audit logs fallback:', e.message);
      }
    }
    inMemoryState.auditLogs = inMemoryState.auditLogs || [];
    return inMemoryState.auditLogs.slice(0, limit);
  },

  // ---------------------------------------------------------------- AUTH & USERS
  async findUserByUsername(username) {
    const uname = String(username || '').toLowerCase().trim();
    if (isPostgresConnected) {
      try {
        const u = await prisma.user.findFirst({
          where: { username: { equals: uname, mode: 'insensitive' } },
        });
        if (u) {
          return {
            ...u,
            name: u.fullName || u.name,
            password: u.passwordHash || u.password,
            role: normalizeRole(u.role),
            rawRole: u.role,
          };
        }
      } catch (e) {
        console.warn('PG query fallback:', e.message);
      }
    }
    const memUser = inMemoryState.users.find((u) => u.username.toLowerCase() === uname);
    if (!memUser) return null;
    return {
      ...memUser,
      role: normalizeRole(memUser.role),
      rawRole: memUser.role,
    };
  },

  async findUserById(id) {
    if (isPostgresConnected) {
      try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (u) {
          return {
            ...u,
            name: u.fullName || u.name,
            password: u.passwordHash || u.password,
            role: normalizeRole(u.role),
            rawRole: u.role,
          };
        }
      } catch (e) {
        console.warn('PG query fallback:', e.message);
      }
    }
    const memUser = inMemoryState.users.find((u) => u.id === id);
    if (!memUser) return null;
    return {
      ...memUser,
      role: normalizeRole(memUser.role),
      rawRole: memUser.role,
    };
  },

  async listUsers() {
    if (isPostgresConnected) {
      try {
        const list = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
        return list.map((u) => ({
          ...u,
          name: u.fullName || u.name,
          role: normalizeRole(u.role),
          rawRole: u.role,
        }));
      } catch (e) {
        console.warn('PG query fallback:', e.message);
      }
    }
    return inMemoryState.users.map((u) => ({
      ...u,
      role: normalizeRole(u.role),
      rawRole: u.role,
    }));
  },

  async createUser(data, creator = null) {
    const id = data.id || nextUserId();
    const hashedPassword = data.password ? await hashPassword(data.password) : '';
    const record = {
      id,
      username: String(data.username).trim().toLowerCase(),
      passwordHash: hashedPassword,
      fullName: String(data.name || data.fullName).trim(),
      title: data.title || '',
      role: data.role,
      active: data.active !== false && !data.banned,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (isPostgresConnected) {
      try {
        await prisma.user.create({ data: record });
      } catch (e) {
        console.warn('PG create fallback:', e.message);
      }
    }

    const memRecord = {
      ...record,
      name: record.fullName,
      password: hashedPassword || data.password,
      banned: !record.active,
    };
    inMemoryState.users.push(memRecord);

    await this.createAuditLog({
      userId: creator?.id || null,
      userName: creator?.name || 'System',
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: id,
      details: { username: record.username, role: record.role },
    });

    return memRecord;
  },

  async updateUser(id, updates, updater = null) {
    const user = inMemoryState.users.find((u) => u.id === id);
    if (!user) return null;

    const pgUpdates = {};
    if (updates.name) pgUpdates.fullName = updates.name;
    if (updates.fullName) pgUpdates.fullName = updates.fullName;
    if (updates.title !== undefined) pgUpdates.title = updates.title;
    if (updates.role !== undefined) pgUpdates.role = updates.role;
    if (updates.banned !== undefined) pgUpdates.active = !updates.banned;
    if (updates.active !== undefined) pgUpdates.active = updates.active;
    if (updates.password) pgUpdates.passwordHash = await hashPassword(updates.password);

    if (isPostgresConnected) {
      try {
        await prisma.user.update({ where: { id }, data: pgUpdates });
      } catch (e) {
        console.warn('PG update fallback:', e.message);
      }
    }

    Object.assign(user, updates);
    if (updates.name) user.name = updates.name;
    if (updates.banned !== undefined) user.banned = updates.banned;

    await this.createAuditLog({
      userId: updater?.id || null,
      userName: updater?.name || 'System',
      action: 'UPDATE_USER',
      entityType: 'USER',
      entityId: id,
      details: { updates },
    });

    return user;
  },

  async deleteUser(id, deleter = null) {
    const memUser = inMemoryState.users.find((u) => u.id === id);
    if (isPostgresConnected) {
      try {
        await prisma.user.delete({ where: { id } });
      } catch (e) {
        console.warn('PG delete fallback:', e.message);
      }
    }
    const idx = inMemoryState.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const removed = inMemoryState.users.splice(idx, 1)[0];
      await this.moveToRecycleBin({
        entityType: 'USER',
        entityId: id,
        title: `${removed.name} (@${removed.username}) - ${removed.role}`,
        details: { username: removed.username, role: removed.role, title: removed.title },
        data: removed,
        user: deleter,
      });

      await this.createAuditLog({
        userId: deleter?.id || null,
        userName: deleter?.name || 'System',
        action: 'DELETE_USER',
        entityType: 'USER',
        entityId: id,
        details: { username: removed.username },
      });
    }
    return true;
  },

  // ---------------------------------------------------------------- PATIENTS
  async listPatients(q = '') {
    const query = String(q || '').trim().toLowerCase();
    let patients = [...inMemoryState.patients].sort(
      (a, b) => new Date(b.registrationDate || b.createdAt) - new Date(a.registrationDate || a.createdAt)
    );

    if (query) {
      patients = patients.filter((p) =>
        [p.id, p.patientNumber, p.fullName, p.phone].some((f) => (f || '').toLowerCase().includes(query))
      );
    }

    const enriched = patients.map((p) => {
      const pv = inMemoryState.visits
        .filter((v) => v.patientId === p.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const pc = inMemoryState.consultations
        .filter((c) => c.patientId === p.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return {
        ...p,
        age: computeAge(p.dateOfBirth),
        services: [...new Set(pv.map((v) => v.service))],
        doctors: [...new Set(pc.map((c) => c.doctor))],
        visitStatuses: [...new Set(pv.map((v) => v.status))],
        lastVisitDate: pv[0]?.date || null,
        lastService: pv[0]?.service || null,
        lastStatus: pv[0]?.status || null,
        lastDoctor: pc[0]?.doctor || null,
      };
    });
    return enriched;
  },

  async getPatient(id) {
    const patient = inMemoryState.patients.find((p) => p.id === id || p.patientNumber === id);
    if (!patient) return null;
    return { ...patient, age: computeAge(patient.dateOfBirth) };
  },

  async createPatient(data, creator = null) {
    const id = nextPatientId();
    const record = {
      id,
      patientNumber: id,
      fullName: String(data.fullName || data.name).trim(),
      gender: data.gender || 'Unknown',
      dateOfBirth: data.dateOfBirth || null,
      phone: String(data.phone || '').trim(),
      address: data.address || '',
      emergencyContactName: String(data.emergencyContactName || '').trim(),
      emergencyContactPhone: String(data.emergencyContactPhone || '').trim(),
      relationshipToPatient: String(data.relationshipToPatient || '').trim(),
      allergies: Array.isArray(data.allergies) ? data.allergies : (data.allergies ? [data.allergies] : []),
      registrationDate: now(),
      createdAt: now(),
      updatedAt: now(),
    };

    if (isPostgresConnected) {
      try {
        await prisma.patient.create({
          data: {
            id: record.id,
            patientNumber: record.patientNumber,
            fullName: record.fullName,
            gender: record.gender,
            dateOfBirth: record.dateOfBirth,
            phone: record.phone,
            address: record.address,
            emergencyContactName: record.emergencyContactName,
            emergencyContactPhone: record.emergencyContactPhone,
            relationshipToPatient: record.relationshipToPatient,
            allergies: record.allergies,
            registrationDate: new Date(record.registrationDate),
            createdAt: new Date(record.createdAt),
          },
        });
      } catch (e) {
        console.warn('PG create patient fallback:', e.message);
      }
    }

    inMemoryState.patients.push(record);

    await this.createAuditLog({
      userId: creator?.id || null,
      userName: creator?.name || 'Reception',
      action: 'CREATE_PATIENT',
      entityType: 'PATIENT',
      entityId: id,
      details: { fullName: record.fullName, phone: record.phone },
    });

    return { ...record, age: computeAge(record.dateOfBirth) };
  },

  async getPatientHistory(id) {
    const patient = inMemoryState.patients.find((p) => p.id === id || p.patientNumber === id);
    if (!patient) return null;

    const visits = inMemoryState.visits
      .filter((v) => v.patientId === patient.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const consultations = inMemoryState.consultations
      .filter((c) => c.patientId === patient.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const laboratory = inMemoryState.labRequests
      .filter((l) => l.patientId === patient.id)
      .map((l) => {
        const result = inMemoryState.labResults.find((r) => r.requestId === l.id);
        return { ...l, result: result || null };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const procedures = inMemoryState.procedures
      .filter((p) => p.patientId === patient.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const prescriptions = inMemoryState.prescriptions
      .filter((p) => p.patientId === patient.id)
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    const injectionOrders = (inMemoryState.injectionOrders || [])
      .filter((i) => i.patientId === patient.id)
      .map((inj) => ({
        ...inj,
        administrations: (inMemoryState.injectionAdministrations || []).filter((a) => a.injectionOrderId === inj.id),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const activeVisit = visits.find((v) => v.status === 'active');
    const activeQueue = activeVisit
      ? inMemoryState.queue.find((q) => q.visitId === activeVisit.id && q.status !== 'completed')
      : null;

    return {
      patient: { ...patient, age: computeAge(patient.dateOfBirth), registrationDate: formatDate(patient.registrationDate) },
      visits,
      consultations,
      laboratory,
      procedures,
      prescriptions,
      injections: injectionOrders,
      activeVisit: activeVisit || null,
      activeQueue: activeQueue || null,
      visitCount: visits.length,
    };
  },

  async getPatientTimeline(patientId) {
    const patient = inMemoryState.patients.find((p) => p.id === patientId || p.patientNumber === patientId);
    if (!patient) return null;

    const events = [];

    // 1. Patient Registration
    if (patient.registrationDate || patient.createdAt) {
      events.push({
        id: `EV-REG-${patient.id}`,
        type: 'REGISTRATION',
        category: 'ADMINISTRATIVE',
        title: 'Patient Registered',
        description: `Enrolled into clinic record system with ID #${patient.patientNumber || patient.id}`,
        performer: 'Reception Desk',
        role: 'receptionist',
        timestamp: patient.registrationDate || patient.createdAt,
        status: 'COMPLETED',
        details: { patientNumber: patient.patientNumber, phone: patient.phone, allergies: patient.allergies },
      });
    }

    // 2. Encounters / Visits
    const visits = inMemoryState.visits.filter((v) => v.patientId === patient.id);
    visits.forEach((v) => {
      events.push({
        id: `EV-VISIT-${v.id}`,
        type: 'VISIT_CREATED',
        category: 'CLINICAL_FLOW',
        title: `Encounter Created: ${v.service || 'General OPD'}`,
        description: v.reason ? `Reason: ${v.reason}` : 'General consultation and outpatient assessment',
        performer: 'Reception Staff',
        role: 'receptionist',
        timestamp: v.date || v.createdAt,
        status: (v.status || 'active').toUpperCase(),
        details: { visitNumber: v.visitNumber, service: v.service, reason: v.reason },
      });
    });

    // 3. Consultations & Vitals
    const consultations = inMemoryState.consultations.filter((c) => c.patientId === patient.id);
    consultations.forEach((c) => {
      if (c.vitals && (c.vitals.bloodPressure || c.vitals.pulseRate || c.vitals.temperature)) {
        events.push({
          id: `EV-VITALS-${c.id}`,
          type: 'TRIAGE_VITALS',
          category: 'NURSING',
          title: 'Triage & Vital Signs Recorded',
          description: `BP: ${c.vitals.bloodPressure || 'N/A'}, Pulse: ${c.vitals.pulseRate || 'N/A'} bpm, Temp: ${c.vitals.temperature || 'N/A'} °C, SpO2: ${c.vitals.oxygenSaturation || 'N/A'}%`,
          performer: c.doctor || 'Triage Nurse',
          role: 'doctor',
          timestamp: c.date || c.createdAt,
          status: 'RECORDED',
          details: c.vitals,
        });
      }

      events.push({
        id: `EV-CONSULT-${c.id}`,
        type: 'CONSULTATION',
        category: 'CLINICAL',
        title: `OPD Clinical Consultation: ${c.diagnosis || 'Clinical Assessment'}`,
        description: c.chiefComplaint ? `Complaint: "${c.chiefComplaint}". ${c.notes || ''}` : c.notes || 'Clinical examination conducted.',
        performer: c.doctor,
        role: 'doctor',
        timestamp: c.date || c.createdAt,
        status: (c.status || 'completed').toUpperCase(),
        details: {
          consultationNumber: c.consultationNumber,
          diagnosis: c.diagnosis,
          chiefComplaint: c.chiefComplaint,
          physicalExam: c.physicalExam,
        },
      });
    });

    // 4. Laboratory Requests, Samples, Results
    const labRequests = inMemoryState.labRequests.filter((l) => l.patientId === patient.id);
    labRequests.forEach((l) => {
      events.push({
        id: `EV-LABREQ-${l.id}`,
        type: 'LAB_ORDER',
        category: 'DIAGNOSTIC',
        title: `Laboratory Requested: ${(l.tests || []).map((t) => t.name).join(', ')}`,
        description: `Ordered by ${l.requestingDoctor} (${l.tests?.length || 0} diagnostic parameter[s])`,
        performer: l.requestingDoctor,
        role: 'doctor',
        timestamp: l.date || l.createdAt,
        status: (l.status || 'REQUESTED').toUpperCase(),
        details: { requestNumber: l.requestNumber, tests: l.tests },
      });

      if (l.sampleId) {
        const sample = (inMemoryState.labSamples || []).find((s) => s.id === l.sampleId || s.requestId === l.id);
        if (sample) {
          events.push({
            id: `EV-SAMPLE-${sample.id}`,
            type: 'SPECIMEN_COLLECTED',
            category: 'LABORATORY',
            title: `Specimen Collected: ${sample.specimenType} (Barcode #${sample.barcode})`,
            description: sample.notes || 'Sample phlebotomy completed and assigned vacutainer tube.',
            performer: sample.collectedBy || 'Lab Phlebotomist',
            role: 'laboratory',
            timestamp: sample.collectedAt || sample.createdAt,
            status: 'COLLECTED',
            details: sample,
          });
        }
      }

      const result = (inMemoryState.labResults || []).find((r) => r.requestId === l.id);
      if (result && result.status !== 'DRAFT') {
        const isReleased = result.status === 'RELEASED_TO_DOCTOR';
        events.push({
          id: `EV-LABRES-${result.id}`,
          type: isReleased ? 'LAB_RELEASED' : 'LAB_VERIFIED',
          category: 'LABORATORY',
          title: `Lab Results ${isReleased ? 'Released to Doctor' : 'Technician Verified'} (${result.instrumentName || 'Analyzer'})`,
          description: `Observations verified by ${result.verifiedBy || 'Technician'}. ${result.results?.length || 0} tests analyzed.`,
          performer: result.releasedBy || result.verifiedBy || result.enteredBy || 'Lab Technician',
          role: 'laboratory',
          timestamp: result.releasedToDoctorAt || result.verifiedAt || result.enteredAt || result.date,
          status: result.status,
          details: {
            resultId: result.id,
            results: result.results,
            instrumentName: result.instrumentName,
          },
        });
      }
    });

    // 5. Invoices & Payments
    const invoices = (inMemoryState.invoices || []).filter((i) => i.patientId === patient.id);
    invoices.forEach((inv) => {
      events.push({
        id: `EV-INV-${inv.id}`,
        type: 'INVOICE_GENERATED',
        category: 'BILLING',
        title: `Invoice Generated: #${inv.invoiceNumber} (${inv.totalAmount} ETB)`,
        description: `Charges computed for consultation, diagnostic tests, and requested treatments.`,
        performer: 'Reception Billing',
        role: 'receptionist',
        timestamp: inv.createdAt,
        status: inv.status,
        details: { invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount, balance: inv.balance },
      });

      const payments = (inMemoryState.payments || []).filter((p) => p.invoiceId === inv.id && p.status !== 'CANCELLED');
      payments.forEach((pay) => {
        events.push({
          id: `EV-PAY-${pay.id}`,
          type: 'PAYMENT_RECEIVED',
          category: 'BILLING',
          title: `Payment Received: ${pay.amount} ETB via ${pay.paymentMethod} (Receipt #${pay.receiptNumber})`,
          description: `Cashier payment confirmed by ${pay.receivedBy}.`,
          performer: pay.receivedBy,
          role: 'receptionist',
          timestamp: pay.receivedAt,
          status: pay.status,
          details: pay,
        });
      });

      const verifications = (inMemoryState.paymentVerifications || []).filter((pv) => pv.invoiceId === inv.id);
      verifications.forEach((ver) => {
        events.push({
          id: `EV-VERIF-${ver.id}`,
          type: 'PAYMENT_VERIFIED',
          category: 'BILLING',
          title: `Payment Verified at Reception Desk`,
          description: `All clinical department worklists unlocked and authorized for service execution.`,
          performer: ver.verifiedBy,
          role: 'receptionist',
          timestamp: ver.verifiedAt,
          status: 'VERIFIED',
          details: ver,
        });
      });
    });

    // 6. Injection Orders & Administrations
    const injectionOrders = (inMemoryState.injectionOrders || []).filter((inj) => inj.patientId === patient.id);
    injectionOrders.forEach((inj) => {
      events.push({
        id: `EV-INJORD-${inj.id}`,
        type: 'INJECTION_ORDER',
        category: 'TREATMENT',
        title: `Injection Ordered: ${inj.medication} (${inj.prescribedDose} ${inj.route})`,
        description: `Ordered by ${inj.doctorName} with frequency ${inj.frequency}. ${inj.instructions || ''}`,
        performer: inj.doctorName,
        role: 'doctor',
        timestamp: inj.createdAt,
        status: inj.status,
        details: inj,
      });

      const admins = (inMemoryState.injectionAdministrations || []).filter((a) => a.injectionOrderId === inj.id);
      admins.forEach((adm) => {
        events.push({
          id: `EV-INJADM-${adm.id}`,
          type: 'INJECTION_ADMINISTERED',
          category: 'TREATMENT',
          title: `Injection Administered: ${adm.actualMedication} ${adm.actualDose} at ${adm.administrationSite}`,
          description: `Administered via ${adm.route} route by ${adm.administeredBy}. Notes: "${adm.notes || 'Aseptic technique applied.'}"`,
          performer: adm.administeredBy,
          role: 'procedure',
          timestamp: adm.administeredAt,
          status: adm.status,
          details: adm,
        });
      });
    });

    // 7. Procedure Orders & Executions
    const procedures = inMemoryState.procedures.filter((p) => p.patientId === patient.id);
    procedures.forEach((p) => {
      events.push({
        id: `EV-PROCORD-${p.id}`,
        type: 'PROCEDURE_ORDER',
        category: 'TREATMENT',
        title: `Procedure Ordered: ${p.procedureType}`,
        description: `Requested by ${p.requestingDoctor}. ${p.notes || ''}`,
        performer: p.requestingDoctor,
        role: 'doctor',
        timestamp: p.date || p.createdAt,
        status: (p.status || 'requested').toUpperCase(),
        details: p,
      });

      if (p.recording) {
        events.push({
          id: `EV-PROCEXEC-${p.id}`,
          type: 'PROCEDURE_PERFORMED',
          category: 'TREATMENT',
          title: `Procedure Executed: ${p.procedureType}`,
          description: `Performed by ${p.recording.responsibleStaff || 'Nurse'}. Details: "${p.recording.administrationDetails || p.recording.notes || 'Completed successfully'}"`,
          performer: p.recording.responsibleStaff || 'Procedure Nurse',
          role: 'procedure',
          timestamp: p.recording.date || p.updatedAt || now(),
          status: 'COMPLETED',
          details: p.recording,
        });
      }
    });

    // 8. Prescriptions & Pharmacy Dispensing
    const prescriptions = (inMemoryState.prescriptions || []).filter((rx) => rx.patientId === patient.id);
    prescriptions.forEach((rx) => {
      events.push({
        id: `EV-RX-${rx.id}`,
        type: 'PRESCRIPTION_ORDER',
        category: 'TREATMENT',
        title: `Prescription Created: ${(rx.medicines || []).map((m) => m.medicine).join(', ')}`,
        description: `Prescribed by ${rx.doctor} (${rx.medicines?.length || 0} items)`,
        performer: rx.doctor,
        role: 'doctor',
        timestamp: rx.date || rx.createdAt,
        status: (rx.status || 'PRESCRIBED').toUpperCase(),
        details: { prescriptionNumber: rx.prescriptionNumber, medicines: rx.medicines },
      });

      if (rx.dispensedAt) {
        events.push({
          id: `EV-DISPENSE-${rx.id}`,
          type: 'PHARMACY_DISPENSED',
          category: 'PHARMACY',
          title: `Medication Dispensed by Pharmacy (${rx.medicines?.length || 0} items)`,
          description: `Dispensed and verified by ${rx.dispensedBy || 'Pharmacist'}. Notes: "${rx.dispensingNotes || 'Instructions reviewed with patient.'}"`,
          performer: rx.dispensedBy || 'Pharmacist',
          role: 'pharmacy',
          timestamp: rx.dispensedAt,
          status: (rx.status || 'DISPENSED').toUpperCase(),
          details: {
            prescriptionNumber: rx.prescriptionNumber,
            medicines: rx.medicines,
            dispensingNotes: rx.dispensingNotes,
          },
        });
      }
    });

    // Sort timeline chronologically (latest first or earliest first as needed)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      patient: { ...patient, age: computeAge(patient.dateOfBirth) },
      totalEvents: events.length,
      events,
    };
  },

  async getVisitTimeline(visitId) {
    const visit = inMemoryState.visits.find((v) => v.id === visitId || v.visitNumber === visitId);
    if (!visit) return null;
    const timeline = await this.getPatientTimeline(visit.patientId);
    if (!timeline) return null;

    // Filter events to this visit
    const visitEvents = timeline.events.filter((e) => {
      const d = e.details || {};
      return d.visitId === visit.id || d.visitNumber === visit.visitNumber || e.id.includes(visit.id);
    });

    return {
      visit,
      patient: timeline.patient,
      totalEvents: visitEvents.length,
      events: visitEvents,
    };
  },

  // ---------------------------------------------------------------- VISITS
  async listVisits(patientId, date) {
    let visits = [...inMemoryState.visits].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (patientId) visits = visits.filter((v) => v.patientId === patientId);
    if (date) visits = visits.filter((v) => toDateKey(v.date) === date);
    const enriched = visits.map((v) => {
      const p = inMemoryState.patients.find((pt) => pt.id === v.patientId);
      return { ...v, patient: p ? { ...p, age: computeAge(p.dateOfBirth) } : null };
    });
    return enriched;
  },

  async getVisit(id) {
    const visit = inMemoryState.visits.find((v) => v.id === id);
    if (!visit) return null;
    const patient = inMemoryState.patients.find((p) => p.id === visit.patientId);
    const queueEntry = inMemoryState.queue.find((q) => q.visitId === visit.id);
    const consultation = inMemoryState.consultations.find((c) => c.visitId === visit.id) || null;
    const labRequests = inMemoryState.labRequests.filter((l) => l.visitId === visit.id);
    const procedures = inMemoryState.procedures.filter((p) => p.visitId === visit.id);
    const prescriptions = inMemoryState.prescriptions.filter((p) => p.visitId === visit.id);
    const injectionOrders = (inMemoryState.injectionOrders || [])
      .filter((i) => i.visitId === visit.id)
      .map((inj) => ({
        ...inj,
        administrations: (inMemoryState.injectionAdministrations || []).filter((a) => a.injectionOrderId === inj.id),
      }));

    return {
      visit: {
        ...visit,
        patient: patient ? { ...patient, age: computeAge(patient.dateOfBirth) } : null,
      },
      queueEntry: queueEntry || null,
      consultation,
      labRequests,
      procedures,
      prescriptions,
      injections: injectionOrders,
    };
  },

  async createVisit(data, creator = null) {
    const patient = inMemoryState.patients.find((p) => p.id === data.patientId || p.patientNumber === data.patientId);
    if (!patient) return null;

    const num = nextVisitNumber();
    const visit = {
      id: `V-${num.slice(3)}`,
      visitNumber: num,
      patientId: patient.id,
      patientName: patient.fullName,
      service: data.service || 'General OPD',
      reason: data.reason || '',
      date: now(),
      createdAt: now(),
      updatedAt: now(),
      status: 'active',
    };

    if (isPostgresConnected) {
      try {
        await prisma.visit.create({
          data: {
            id: visit.id,
            visitNumber: visit.visitNumber,
            patientId: visit.patientId,
            service: visit.service,
            reason: visit.reason,
            status: visit.status,
            createdAt: new Date(visit.createdAt),
          },
        });
      } catch (e) {
        console.warn('PG create visit fallback:', e.message);
      }
    }

    inMemoryState.visits.push(visit);

    await this.createAuditLog({
      userId: creator?.id || null,
      userName: creator?.name || 'Reception',
      action: 'CREATE_VISIT',
      entityType: 'VISIT',
      entityId: visit.id,
      details: { patientId: patient.id, service: visit.service },
    });

    try {
      await this.syncVisitInvoice(visit.id, creator);
    } catch (e) {
      console.warn('Sync visit invoice fallback:', e.message);
    }

    return visit;
  },

  // ---------------------------------------------------------------- QUEUE
  async listQueue(status) {
    let queue = [...inMemoryState.queue]
      .filter((q) => isToday(q.date))
      .sort((a, b) => Number(a.queueNumber) - Number(b.queueNumber));
    if (status) queue = queue.filter((q) => q.status === status);
    return queue;
  },

  async addToQueue(visitId, priority = 'NORMAL', department = 'OPD', user = null) {
    const visit = inMemoryState.visits.find((v) => v.id === visitId);
    if (!visit) return { error: 'Visit not found.', status: 404 };

    const existing = inMemoryState.queue.find(
      (q) => q.visitId === visitId && q.status !== 'completed'
    );
    if (existing) {
      return { error: 'Patient is already in the queue.', status: 400 };
    }

    const qnum = nextQueueNumber();
    const entry = {
      id: `Q-${qnum}`,
      queueNumber: qnum,
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      patientId: visit.patientId,
      patientName: visit.patientName,
      service: visit.service,
      department: department || 'OPD',
      priority: ['NORMAL', 'URGENT', 'EMERGENCY'].includes(priority) ? priority : 'NORMAL',
      time: now(),
      date: toDateKey(now()),
      status: 'waiting',
      calledAt: null,
      completedAt: null,
    };

    if (isPostgresConnected) {
      try {
        await prisma.queue.create({
          data: {
            id: entry.id,
            queueNumber: entry.queueNumber,
            visitId: entry.visitId,
            patientId: entry.patientId,
            department: entry.department,
            queueStatus: entry.status,
            priority: entry.priority,
            createdAt: new Date(),
          },
        });
      } catch (e) {
        console.warn('PG create queue fallback:', e.message);
      }
    }

    inMemoryState.queue.push(entry);

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'Reception',
      action: 'ADD_TO_QUEUE',
      entityType: 'QUEUE',
      entityId: entry.id,
      details: { visitId: visit.id, patientId: visit.patientId, priority: entry.priority },
    });

    return { entry };
  },

  async updateQueueStatus(id, status, user = null) {
    const entry = inMemoryState.queue.find((q) => q.id === id);
    if (!entry) return null;

    entry.status = status;
    if (status === 'called') {
      entry.calledAt = now();
    }
    if (status === 'completed') {
      entry.completedAt = now();
      const visit = inMemoryState.visits.find((v) => v.id === entry.visitId);
      if (visit) visit.status = 'completed';
    }

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          const updateData = { queueStatus: status };
          if (status === 'called') updateData.calledAt = new Date();
          if (status === 'completed') updateData.completedAt = new Date();
          await tx.queue.update({ where: { id }, data: updateData });
          if (status === 'completed') {
            await tx.visit.update({ where: { id: entry.visitId }, data: { status: 'completed' } });
          }
        });
      } catch (e) {
        console.warn('PG update queue fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'Staff',
      action: 'UPDATE_QUEUE_STATUS',
      entityType: 'QUEUE',
      entityId: id,
      details: { newStatus: status },
    });

    return entry;
  },

  // ---------------------------------------------------------------- OPD & CONSULTATION
  async getOpdQueue() {
    const today = new Date().toISOString().slice(0, 10);
    const PRIORITY_RANK = { EMERGENCY: 1, URGENT: 2, NORMAL: 3 };

    const queue = [...inMemoryState.queue]
      .filter((q) => q.status !== 'completed')
      .sort((a, b) => {
        const rankA = PRIORITY_RANK[a.priority] || 3;
        const rankB = PRIORITY_RANK[b.priority] || 3;
        if (rankA !== rankB) return rankA - rankB;
        return Number(a.queueNumber) - Number(b.queueNumber);
      })
      .map((q) => {
        const patient = inMemoryState.patients.find((pt) => pt.id === q.patientId) || null;
        const visit = inMemoryState.visits.find((v) => v.id === q.visitId) || null;
        const consultation = inMemoryState.consultations.find((c) => c.visitId === q.visitId) || null;
        return {
          ...q,
          patient: patient ? { ...patient, age: computeAge(patient.dateOfBirth) } : null,
          visit,
          consultation,
          waitingMinutes: waitingMinutes(q.time),
        };
      });
    return queue;
  },

  async getConsultation(id) {
    let consultation = inMemoryState.consultations.find((c) => c.id === id || c.visitId === id);
    if (!consultation) return null;

    const visit = inMemoryState.visits.find((v) => v.id === consultation.visitId);
    const patient = inMemoryState.patients.find((pt) => pt.id === consultation.patientId) || null;
    const labRequests = inMemoryState.labRequests
      .filter((l) => l.visitId === consultation.visitId)
      .map((r) => {
        const result = inMemoryState.labResults.find((x) => x.requestId === r.id);
        return { ...r, result: result || null };
      });
    const procedures = inMemoryState.procedures.filter((p) => p.visitId === consultation.visitId);
    const prescriptions = inMemoryState.prescriptions.filter((p) => p.visitId === consultation.visitId);

    // Patient historical record for timeline panel
    const pastVisits = inMemoryState.visits
      .filter((v) => v.patientId === consultation.patientId && v.id !== consultation.visitId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const pastConsultations = inMemoryState.consultations
      .filter((c) => c.patientId === consultation.patientId && c.id !== consultation.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const pastLabResults = inMemoryState.labResults
      .filter((r) => r.patientId === consultation.patientId && r.visitId !== consultation.visitId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const pastProcedures = inMemoryState.procedures
      .filter((p) => p.patientId === consultation.patientId && p.visitId !== consultation.visitId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const pastPrescriptions = inMemoryState.prescriptions
      .filter((p) => p.patientId === consultation.patientId && p.visitId !== consultation.visitId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      consultation,
      visit: visit || null,
      patient: patient ? { ...patient, age: computeAge(patient.dateOfBirth) } : null,
      orders: {
        labRequests,
        procedures,
        prescriptions,
      },
      history: {
        visits: pastVisits,
        consultations: pastConsultations,
        labResults: pastLabResults,
        procedures: pastProcedures,
        prescriptions: pastPrescriptions,
      },
    };
  },

  async listConsultationsByPatient(patientId) {
    return inMemoryState.consultations
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createConsultation(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    // Check if consultation already started for this visit to avoid duplicate or losing data
    let consultation = inMemoryState.consultations.find((c) => c.visitId === visit.id);
    if (consultation && consultation.status !== 'completed') {
      if (data.vitals) consultation.vitals = this.computeBmi(data.vitals);
      const queueEntry = inMemoryState.queue.find((q) => q.visitId === visit.id && q.status !== 'completed');
      if (queueEntry && queueEntry.status === 'waiting') queueEntry.status = 'in_consultation';
      return consultation;
    }

    const num = nextConsultationNumber();
    const vitals = this.computeBmi(data.vitals || {});

    consultation = {
      id: `C-${num.slice(3)}`,
      consultationNumber: num,
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      patientId: visit.patientId,
      patientName: visit.patientName,
      doctor: user?.name || 'Dr. Doctor',
      doctorId: user?.id || 'U-DOCTOR',
      date: now(),
      status: 'in_progress',
      vitals,
      chiefComplaint: data.chiefComplaint || '',
      medicalHistory: data.medicalHistory || '',
      clinicalExamination: data.clinicalExamination || '',
      diagnosis: data.diagnosis || '',
      secondaryDiagnosis: data.secondaryDiagnosis || '',
      treatmentRecommendation: data.treatmentRecommendation || '',
      doctorNotes: data.doctorNotes || '',
      followUp: data.followUp || '',
      referral: data.referral || null,
      createdAt: now(),
      updatedAt: now(),
    };

    inMemoryState.consultations.push(consultation);

    const queueEntry = inMemoryState.queue.find((q) => q.visitId === visit.id && q.status !== 'completed');
    if (queueEntry) {
      queueEntry.status = 'in_consultation';
    }

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.consultation.create({
            data: {
              ...consultation,
              date: new Date(consultation.date),
              createdAt: new Date(consultation.createdAt),
              updatedAt: new Date(consultation.updatedAt),
            },
          });
          if (queueEntry) {
            await tx.queue.update({ where: { id: queueEntry.id }, data: { queueStatus: 'in_consultation' } });
          }
        });
      } catch (e) {
        console.warn('PG create consultation fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'Doctor',
      action: 'START_CONSULTATION',
      entityType: 'CONSULTATION',
      entityId: consultation.id,
      details: { visitId: visit.id, patientId: visit.patientId },
    });

    return consultation;
  },

  computeBmi(vitals = {}) {
    const height = parseFloat(vitals.height);
    const weight = parseFloat(vitals.weight);
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      const bmiVal = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
      let category = 'Normal';
      if (bmiVal < 18.5) category = 'Underweight';
      else if (bmiVal < 25.0) category = 'Normal';
      else if (bmiVal < 30.0) category = 'Overweight';
      else category = 'Obese';
      return { ...vitals, bmi: bmiVal, bmiCategory: category };
    }
    return vitals;
  },

  async updateConsultation(id, updates, user = null) {
    const consultation = inMemoryState.consultations.find((c) => c.id === id || c.visitId === id);
    if (!consultation) return null;

    if (updates.vitals !== undefined) {
      consultation.vitals = this.computeBmi({ ...consultation.vitals, ...updates.vitals });
    }

    const fields = [
      'chiefComplaint', 'medicalHistory', 'clinicalExamination',
      'diagnosis', 'secondaryDiagnosis', 'treatmentRecommendation',
      'doctorNotes', 'followUp', 'referral', 'status',
    ];
    for (const f of fields) {
      if (updates[f] !== undefined) consultation[f] = updates[f];
    }
    consultation.updatedAt = now();

    if (isPostgresConnected) {
      try {
        const clean = {};
        for (const f of fields) {
          if (updates[f] !== undefined) clean[f] = updates[f];
        }
        if (updates.vitals !== undefined) clean.vitals = consultation.vitals;
        clean.updatedAt = new Date();
        await prisma.consultation.update({ where: { id: consultation.id }, data: clean });
      } catch (e) {
        console.warn('PG update consultation fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'Doctor',
      action: 'UPDATE_CONSULTATION',
      entityType: 'CONSULTATION',
      entityId: consultation.id,
      details: { diagnosis: consultation.diagnosis, status: consultation.status },
    });

    return consultation;
  },

  async holdConsultationForLab(id, user = null) {
    const consultation = inMemoryState.consultations.find((c) => c.id === id || c.visitId === id);
    if (!consultation) return null;

    consultation.status = 'awaiting_results';
    consultation.updatedAt = now();

    const queueEntry = inMemoryState.queue.find((q) => q.visitId === consultation.visitId && q.status !== 'completed');
    if (queueEntry) {
      queueEntry.status = 'awaiting_results';
    }

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.consultation.update({ where: { id: consultation.id }, data: { status: 'awaiting_results' } });
          if (queueEntry) {
            await tx.queue.update({ where: { id: queueEntry.id }, data: { queueStatus: 'awaiting_results' } });
          }
        });
      } catch (e) {
        console.warn('PG hold consultation fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'Doctor',
      action: 'HOLD_FOR_LAB',
      entityType: 'CONSULTATION',
      entityId: consultation.id,
      details: { visitId: consultation.visitId },
    });

    return consultation;
  },

  async completeConsultation(id, user = null) {
    const consultation = inMemoryState.consultations.find((c) => c.id === id || c.visitId === id);
    if (!consultation) return null;

    consultation.status = 'completed';
    consultation.updatedAt = now();

    const visit = inMemoryState.visits.find((v) => v.id === consultation.visitId);
    if (visit) visit.status = 'completed';
    const queueEntry = inMemoryState.queue.find((q) => q.visitId === consultation.visitId && q.status !== 'completed');
    if (queueEntry) {
      queueEntry.status = 'completed';
      queueEntry.completedAt = now();
    }

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.consultation.update({ where: { id: consultation.id }, data: { status: 'completed' } });
          if (visit) await tx.visit.update({ where: { id: visit.id }, data: { status: 'completed' } });
          if (queueEntry) await tx.queue.update({ where: { id: queueEntry.id }, data: { queueStatus: 'completed', completedAt: new Date() } });
        });
      } catch (e) {
        console.warn('PG complete consultation fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'Doctor',
      action: 'COMPLETE_CONSULTATION',
      entityType: 'CONSULTATION',
      entityId: consultation.id,
      details: { visitId: consultation.visitId, diagnosis: consultation.diagnosis },
    });

    return consultation;
  },

  // ---------------------------------------------------------------- LABORATORY
  async getTestCatalog() {
    return inMemoryState.labTests;
  },

  async listLabRequests(status, userRole = null) {
    let requests = [...inMemoryState.labRequests].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (status) {
      const s = status.toLowerCase();
      requests = requests.filter((r) => {
        const rs = (r.status || '').toLowerCase();
        if (s === 'pending') return rs === 'pending' || rs === 'requested' || rs === 'payment_verified' || rs === 'ready_for_lab' || rs === 'specimen_collected';
        if (s === 'in_progress') return rs === 'in_progress' || rs === 'specimen_collected' || rs === 'result_received';
        if (s === 'completed') return rs === 'completed' || rs === 'technician_verified' || rs === 'released_to_doctor';
        return rs === s;
      });
    }
    if (userRole === 'laboratory' || userRole === 'lab') {
      requests = requests.filter((r) => r.paymentStatus === 'PAID' || r.paymentStatus === 'VERIFIED');
    }
    return requests.map((r) => {
      const patient = inMemoryState.patients.find((p) => p.id === r.patientId);
      const sample = inMemoryState.labSamples?.find((s) => s.requestId === r.id);
      const result = inMemoryState.labResults.find((x) => x.requestId === r.id);
      return { ...r, patient: patient || null, sample: sample || null, result: result || null };
    });
  },

  async getLabRequest(id) {
    const r = inMemoryState.labRequests.find((x) => x.id === id);
    if (!r) return null;
    const patient = inMemoryState.patients.find((p) => p.id === r.patientId);
    const sample = inMemoryState.labSamples?.find((s) => s.requestId === r.id);
    const result = inMemoryState.labResults.find((x) => x.requestId === r.id);
    return { ...r, patient: patient || null, sample: sample || null, result: result || null };
  },

  async createLabRequest(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    const tests = data.testIds
      .map((id) => inMemoryState.labTests.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({
        id: t.id,
        code: t.code || t.id,
        name: t.name,
        unit: t.unit,
        referenceRange: t.referenceRange,
        specimenType: t.specimenType || 'Whole Blood (EDTA)',
      }));

    const num = nextLaboratoryRequestNumber();
    const request = {
      id: `LR-${num.slice(3)}`,
      requestNumber: num,
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      patientId: visit.patientId,
      patientName: visit.patientName,
      requestingDoctor: user.name,
      date: now(),
      tests,
      status: 'REQUESTED',
      paymentStatus: 'UNPAID',
    };

    inMemoryState.labRequests.push(request);

    if (isPostgresConnected) {
      try {
        await prisma.labRequest.create({
          data: {
            ...request,
            date: new Date(request.date),
          },
        });
      } catch (e) {
        console.warn('PG create lab request fallback:', e.message);
      }
    }

    try {
      await this.syncVisitInvoice(visit.id, user);
    } catch (e) {
      console.warn('Sync invoice after lab request fallback:', e.message);
    }

    return request;
  },

  // ---------------------------------------------------------------- SAMPLE TRACKING
  async collectSample(requestId, specimenData = {}, user) {
    const request = inMemoryState.labRequests.find((r) => r.id === requestId);
    if (!request) return { error: 'Laboratory request not found.', status: 404 };

    if (request.paymentStatus !== 'PAID' && request.paymentStatus !== 'VERIFIED') {
      const err = new Error('Payment must be verified at reception before collecting specimens.');
      err.statusCode = 402;
      throw err;
    }

    const sNum = nextSampleNumber();
    const sample = {
      id: `SMP-${sNum.slice(2)}`,
      sampleNumber: sNum,
      requestId: request.id,
      patientId: request.patientId,
      visitId: request.visitId,
      specimenType: specimenData.specimenType || request.tests[0]?.specimenType || 'Whole Blood (EDTA)',
      barcode: sNum.replace('-', ''),
      status: 'COLLECTED',
      collectedAt: now(),
      collectedBy: user.name,
      notes: specimenData.notes || 'Specimen collected and tube barcode attached.',
    };

    inMemoryState.labSamples = inMemoryState.labSamples || [];
    inMemoryState.labSamples.push(sample);

    request.sampleId = sample.id;
    if (request.status === 'REQUESTED' || request.status === 'pending' || request.status === 'PAYMENT_VERIFIED' || request.status === 'READY_FOR_LAB') {
      request.status = 'SPECIMEN_COLLECTED';
    }

    if (isPostgresConnected) {
      try {
        await prisma.labSample.create({
          data: {
            ...sample,
            collectedAt: new Date(sample.collectedAt),
          },
        });
        await prisma.labRequest.update({
          where: { id: request.id },
          data: { sampleId: sample.id, status: request.status },
        });
      } catch (e) {
        console.warn('PG collect sample fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'COLLECT_SAMPLE',
      entityType: 'LAB_SAMPLE',
      entityId: sample.id,
      details: { sampleNumber: sample.sampleNumber, barcode: sample.barcode, requestId: request.id },
    });

    return { sample, request };
  },

  async getSample(id) {
    inMemoryState.labSamples = inMemoryState.labSamples || [];
    const sample = inMemoryState.labSamples.find((s) => s.id === id || s.sampleNumber === id || s.barcode === id);
    if (!sample) return null;
    const request = inMemoryState.labRequests.find((r) => r.id === sample.requestId);
    const patient = inMemoryState.patients.find((p) => p.id === sample.patientId);
    return { ...sample, request: request || null, patient: patient || null };
  },

  async listSamples(requestId = null) {
    inMemoryState.labSamples = inMemoryState.labSamples || [];
    let list = [...inMemoryState.labSamples];
    if (requestId) list = list.filter((s) => s.requestId === requestId);
    return list.map((s) => {
      const patient = inMemoryState.patients.find((p) => p.id === s.patientId);
      const request = inMemoryState.labRequests.find((r) => r.id === s.requestId);
      return { ...s, patient: patient || null, request: request || null };
    });
  },

  // ---------------------------------------------------------------- LAB RESULTS & INTERPRETATION
  async getLabResult(requestId) {
    const request = inMemoryState.labRequests.find((r) => r.id === requestId);
    if (!request) return null;

    let result = inMemoryState.labResults.find((x) => x.requestId === request.id);
    if (!result) {
      result = {
        id: `R-${request.id.slice(3)}`,
        requestId: request.id,
        requestNumber: request.requestNumber,
        patientId: request.patientId,
        visitId: request.visitId,
        sampleId: request.sampleId || null,
        status: 'DRAFT',
        date: now(),
        enteredAt: null,
        verifiedAt: null,
        releasedToDoctorAt: null,
        enteredBy: null,
        verifiedBy: null,
        releasedBy: null,
        instrumentId: null,
        instrumentName: null,
        rawPayload: null,
        results: request.tests.map((t) => ({
          testId: t.id,
          code: t.code || t.id,
          testName: t.name,
          unit: t.unit,
          referenceRange: t.referenceRange,
          result: '',
          flag: 'NORMAL',
          remarks: '',
          status: 'pending',
        })),
      };
      inMemoryState.labResults.push(result);

      if (isPostgresConnected) {
        try {
          await prisma.labResult.create({
            data: {
              ...result,
              date: new Date(result.date),
            },
          });
        } catch (e) {
          console.warn('PG draft lab result fallback:', e.message);
        }
      }
    }

    const patient = inMemoryState.patients.find((p) => p.id === request.patientId);
    const sample = inMemoryState.labSamples?.find((s) => s.requestId === request.id);
    return { result, request: { ...request, patient: patient || null, sample: sample || null, result } };
  },

  async enterLabResults(requestId, resultsArray, user) {
    const request = inMemoryState.labRequests.find((r) => r.id === requestId);
    if (!request) return null;

    if (request.paymentStatus !== 'PAID' && request.paymentStatus !== 'VERIFIED') {
      const err = new Error('Payment must be verified at reception before entering laboratory results.');
      err.statusCode = 402;
      throw err;
    }

    let result = inMemoryState.labResults.find((x) => x.requestId === request.id);
    if (!result) {
      result = {
        id: `R-${request.id.slice(3)}`,
        requestId: request.id,
        requestNumber: request.requestNumber,
        patientId: request.patientId,
        visitId: request.visitId,
        sampleId: request.sampleId || null,
        date: now(),
        enteredAt: null,
        verifiedAt: null,
        releasedToDoctorAt: null,
        enteredBy: null,
        verifiedBy: null,
        releasedBy: null,
        instrumentId: null,
        instrumentName: null,
        rawPayload: null,
        results: [],
      };
      inMemoryState.labResults.push(result);
    }

    result.results = request.tests.map((t) => {
      const incoming = resultsArray.find((x) => x.testId === t.id || x.code === t.code || x.testName === t.name);
      const val = incoming?.result ?? '';
      const flag = incoming?.flag || evaluateReferenceRange(val, t.referenceRange);
      return {
        testId: t.id,
        code: t.code || t.id,
        testName: t.name,
        unit: incoming?.unit || t.unit,
        referenceRange: incoming?.referenceRange || t.referenceRange,
        result: val,
        flag: flag.toUpperCase(),
        remarks: incoming?.remarks ?? '',
        status: 'entered',
      };
    });

    result.status = 'RESULT_RECEIVED';
    result.enteredBy = user.name;
    result.enteredAt = now();
    request.status = 'RESULT_RECEIVED';

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.labResult.upsert({
            where: { requestId: request.id },
            update: {
              results: result.results,
              status: 'RESULT_RECEIVED',
              enteredBy: user.name,
              enteredAt: new Date(result.enteredAt),
            },
            create: {
              ...result,
              date: new Date(result.date),
              enteredAt: new Date(result.enteredAt),
            },
          });
          await tx.labRequest.update({ where: { id: request.id }, data: { status: 'RESULT_RECEIVED' } });
        });
      } catch (e) {
        console.warn('PG enter lab results fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'ENTER_LAB_RESULTS',
      entityType: 'LAB_RESULT',
      entityId: result.id,
      details: { requestId: request.id, testCount: result.results.length },
    });

    return result;
  },

  async verifyLabResult(requestId, user) {
    const request = inMemoryState.labRequests.find((r) => r.id === requestId);
    if (!request) return { error: 'Laboratory request not found.', status: 404 };

    const result = inMemoryState.labResults.find((x) => x.requestId === request.id);
    if (!result) return { error: 'No results entered yet.', status: 400 };

    result.status = 'TECHNICIAN_VERIFIED';
    result.verifiedBy = user.name;
    result.verifiedAt = now();
    result.results = result.results.map((r) => ({ ...r, status: 'verified' }));
    request.status = 'TECHNICIAN_VERIFIED';

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.labResult.update({
            where: { requestId: request.id },
            data: {
              status: 'TECHNICIAN_VERIFIED',
              verifiedBy: user.name,
              verifiedAt: new Date(result.verifiedAt),
              results: result.results,
            },
          });
          await tx.labRequest.update({
            where: { id: request.id },
            data: { status: 'TECHNICIAN_VERIFIED' },
          });
        });
      } catch (e) {
        console.warn('PG verify lab result fallback:', e.message);
      }
    }

    // Automatically transition consultation to ready_for_review if waiting for lab results
    const waitingConsult = inMemoryState.consultations.find(
      (c) => c.visitId === request.visitId && (c.status === 'awaiting_results' || c.status === 'in_progress')
    );
    if (waitingConsult) {
      waitingConsult.status = 'ready_for_review';
      const queueEntry = inMemoryState.queue.find((q) => q.visitId === request.visitId && q.status !== 'completed');
      if (queueEntry) {
        queueEntry.status = 'ready_for_review';
        if (isPostgresConnected) {
          try {
            await prisma.queue.update({ where: { id: queueEntry.id }, data: { queueStatus: 'ready_for_review' } });
            await prisma.consultation.update({ where: { id: waitingConsult.id }, data: { status: 'ready_for_review' } });
          } catch (e) {
            console.warn('PG transition ready_for_review fallback:', e.message);
          }
        }
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'VERIFY_LAB_RESULT',
      entityType: 'LAB_RESULT',
      entityId: result.id,
      details: { requestId: request.id, verifiedBy: user.name },
    });

    return { result };
  },

  async releaseLabResultToDoctor(requestId, user) {
    const request = inMemoryState.labRequests.find((r) => r.id === requestId);
    if (!request) return { error: 'Laboratory request not found.', status: 404 };

    const result = inMemoryState.labResults.find((x) => x.requestId === request.id);
    if (!result) return { error: 'No results available to release.', status: 400 };

    result.status = 'RELEASED_TO_DOCTOR';
    result.releasedBy = user.name;
    result.releasedToDoctorAt = now();
    request.status = 'RELEASED_TO_DOCTOR';

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.labResult.update({
            where: { requestId: request.id },
            data: {
              status: 'RELEASED_TO_DOCTOR',
              releasedBy: user.name,
              releasedToDoctorAt: new Date(result.releasedToDoctorAt),
            },
          });
          await tx.labRequest.update({
            where: { id: request.id },
            data: { status: 'RELEASED_TO_DOCTOR' },
          });
        });
      } catch (e) {
        console.warn('PG release lab result fallback:', e.message);
      }
    }

    // Automatically transition consultation to ready_for_review
    const waitingConsult = inMemoryState.consultations.find(
      (c) => c.visitId === request.visitId && (c.status === 'awaiting_results' || c.status === 'in_progress')
    );
    if (waitingConsult) {
      waitingConsult.status = 'ready_for_review';
      const queueEntry = inMemoryState.queue.find((q) => q.visitId === request.visitId && q.status !== 'completed');
      if (queueEntry) {
        queueEntry.status = 'ready_for_review';
        if (isPostgresConnected) {
          try {
            await prisma.queue.update({ where: { id: queueEntry.id }, data: { queueStatus: 'ready_for_review' } });
            await prisma.consultation.update({ where: { id: waitingConsult.id }, data: { status: 'ready_for_review' } });
          } catch (e) {
            console.warn('PG transition ready_for_review fallback:', e.message);
          }
        }
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'RELEASE_LAB_RESULT',
      entityType: 'LAB_RESULT',
      entityId: result.id,
      details: { requestId: request.id, releasedToDoctorAt: result.releasedToDoctorAt },
    });

    return { result, request };
  },

  // ---------------------------------------------------------------- LAB INSTRUMENTS & ANALYZERS
  async listDevices() {
    if (isPostgresConnected) {
      try {
        const list = await prisma.labDevice.findMany();
        if (list && list.length > 0) return list;
      } catch (e) {
        console.warn('PG list devices fallback:', e.message);
      }
    }
    return inMemoryState.labDevices || [];
  },

  async getDevice(id) {
    inMemoryState.labDevices = inMemoryState.labDevices || [];
    return inMemoryState.labDevices.find((d) => d.id === id || d.deviceCode === id) || null;
  },

  async createDevice(data, user) {
    const num = nextDeviceCode();
    const device = {
      id: `DEV-${num.slice(4)}`,
      deviceCode: num,
      name: data.name,
      manufacturer: data.manufacturer || '',
      model: data.model || '',
      analyzerType: data.analyzerType || 'CBC',
      protocol: data.protocol || 'HL7',
      connectionType: data.connectionType || 'TCP_IP',
      ipAddress: data.ipAddress || '192.168.1.100',
      port: Number(data.port) || 5100,
      serialPort: data.serialPort || 'COM1',
      baudRate: Number(data.baudRate) || 9600,
      parity: data.parity || 'None',
      dataBits: Number(data.dataBits) || 8,
      stopBits: Number(data.stopBits) || 1,
      status: data.status || 'ONLINE',
      mappings: data.mappings || {},
      createdAt: now(),
      updatedAt: now(),
    };

    inMemoryState.labDevices = inMemoryState.labDevices || [];
    inMemoryState.labDevices.push(device);

    if (isPostgresConnected) {
      try {
        await prisma.labDevice.create({
          data: {
            ...device,
            createdAt: new Date(device.createdAt),
            updatedAt: new Date(device.updatedAt),
          },
        });
      } catch (e) {
        console.warn('PG create device fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_LAB_DEVICE',
      entityType: 'LAB_DEVICE',
      entityId: device.id,
      details: { name: device.name, deviceCode: device.deviceCode, analyzerType: device.analyzerType },
    });

    return device;
  },

  async updateDevice(id, data, user) {
    inMemoryState.labDevices = inMemoryState.labDevices || [];
    const index = inMemoryState.labDevices.findIndex((d) => d.id === id || d.deviceCode === id);
    if (index === -1) return null;

    const current = inMemoryState.labDevices[index];
    const updated = {
      ...current,
      ...data,
      port: data.port !== undefined ? Number(data.port) : current.port,
      baudRate: data.baudRate !== undefined ? Number(data.baudRate) : current.baudRate,
      updatedAt: now(),
    };

    inMemoryState.labDevices[index] = updated;

    if (isPostgresConnected) {
      try {
        await prisma.labDevice.update({
          where: { id: current.id },
          data: {
            ...updated,
            updatedAt: new Date(updated.updatedAt),
          },
        });
      } catch (e) {
        console.warn('PG update device fallback:', e.message);
      }
    }

    return updated;
  },

  async deleteDevice(id, user) {
    inMemoryState.labDevices = inMemoryState.labDevices || [];
    const index = inMemoryState.labDevices.findIndex((d) => d.id === id || d.deviceCode === id);
    if (index === -1) return false;

    const device = inMemoryState.labDevices[index];
    inMemoryState.labDevices.splice(index, 1);

    if (isPostgresConnected) {
      try {
        await prisma.labDevice.delete({ where: { id: device.id } });
      } catch (e) {
        console.warn('PG delete device fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'DELETE_LAB_DEVICE',
      entityType: 'LAB_DEVICE',
      entityId: device.id,
      details: { name: device.name, deviceCode: device.deviceCode },
    });

    return true;
  },

  async ingestAnalyzerData(payload, user = { name: 'Automated Analyzer' }) {
    const parsed = parseAnalyzerPayload(payload);
    const { sampleId, patientId, instrumentId, instrumentName, observations } = parsed;

    // Find pending / active request by Sample barcode, Sample Number, Request ID, or Patient ID
    let sampleMatch = inMemoryState.labSamples?.find(
      (s) => s.sampleNumber === sampleId || s.barcode === sampleId || s.id === sampleId
    );

    let request = null;
    if (sampleMatch) {
      request = inMemoryState.labRequests.find((r) => r.id === sampleMatch.requestId);
    }

    if (!request) {
      request = inMemoryState.labRequests.find(
        (r) =>
          (r.id === sampleId || r.requestNumber === sampleId || (patientId && r.patientId === patientId)) &&
          r.status !== 'RELEASED_TO_DOCTOR' &&
          r.status !== 'completed'
      );
    }

    if (!request && sampleId) {
      request = inMemoryState.labRequests.find((r) => r.id === sampleId || r.requestNumber === sampleId);
    }

    if (!request) {
      return {
        matched: false,
        message: `Machine results parsed for sample "${sampleId || 'UNKNOWN'}", but no matching open lab request was found.`,
        parsed,
      };
    }

    // Resolve mappings from registered device or defaults
    const registeredDevice = inMemoryState.labDevices?.find((d) => d.id === instrumentId || d.deviceCode === instrumentId);
    const activeMappings = registeredDevice?.mappings || DEFAULT_DEVICE_MAPPINGS;

    let result = inMemoryState.labResults.find((x) => x.requestId === request.id);
    if (!result) {
      result = {
        id: `R-${request.id.slice(3)}`,
        requestId: request.id,
        requestNumber: request.requestNumber,
        patientId: request.patientId,
        visitId: request.visitId,
        sampleId: request.sampleId || null,
        date: now(),
        enteredAt: null,
        verifiedAt: null,
        releasedToDoctorAt: null,
        enteredBy: null,
        verifiedBy: null,
        releasedBy: null,
        instrumentId: instrumentId || 'DEV-AUTO',
        instrumentName: instrumentName || 'Automated Laboratory Analyzer',
        rawPayload: payload,
        results: [],
      };
      inMemoryState.labResults.push(result);
    }

    const currentResults = result.results || [];
    let matchedCount = 0;
    const mergedResults = request.tests.map((test) => {
      const match = observations.find((o) => {
        const code = (o.code || '').toUpperCase().trim();
        const mappedId = (activeMappings[code] || DEFAULT_DEVICE_MAPPINGS[code] || code).toUpperCase().trim();
        const testCode = (test.code || '').toUpperCase().trim();
        const testId = (test.id || '').toUpperCase().trim();

        if (mappedId === testId || mappedId === testCode || code === testCode) {
          return true;
        }

        const oName = (o.name || '').toLowerCase().trim();
        const tName = (test.name || '').toLowerCase().trim();
        if (oName && tName && (oName.includes(tName) || tName.includes(oName))) {
          return true;
        }

        return false;
      });

      if (match) {
        matchedCount++;
        const flag = match.flag || evaluateReferenceRange(match.value, test.referenceRange);
        return {
          testId: test.id,
          code: test.code || test.id,
          testName: test.name,
          unit: match.units || test.unit,
          referenceRange: match.referenceRange || test.referenceRange,
          result: String(match.value),
          flag: String(flag).toUpperCase(),
          remarks: `Analyzer Imported [${instrumentName || instrumentId || 'Machine'}]`,
          status: 'entered',
        };
      }

      const existing = currentResults.find((r) => r.testId === test.id || r.code === test.code);
      if (existing && existing.result) return existing;

      return {
        testId: test.id,
        code: test.code || test.id,
        testName: test.name,
        unit: test.unit,
        referenceRange: test.referenceRange,
        result: '',
        flag: 'NORMAL',
        remarks: '',
        status: 'pending',
      };
    });

    result.results = mergedResults;
    result.status = 'RESULT_RECEIVED';
    result.instrumentId = instrumentId || result.instrumentId;
    result.instrumentName = instrumentName || result.instrumentName;
    result.rawPayload = typeof payload === 'object' ? payload : { raw: payload };
    result.enteredAt = now();
    result.enteredBy = instrumentName || user.name || 'Analyzer Integration';
    request.status = 'RESULT_RECEIVED';

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.labResult.upsert({
            where: { requestId: request.id },
            update: {
              results: result.results,
              status: 'RESULT_RECEIVED',
              instrumentId: result.instrumentId,
              instrumentName: result.instrumentName,
              rawPayload: result.rawPayload,
              enteredBy: result.enteredBy,
              enteredAt: new Date(result.enteredAt),
            },
            create: {
              ...result,
              date: new Date(result.date),
              enteredAt: new Date(result.enteredAt),
            },
          });
          await tx.labRequest.update({ where: { id: request.id }, data: { status: 'RESULT_RECEIVED' } });
        });
      } catch (e) {
        console.warn('PG ingest analyzer results fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user.id || 'SYSTEM-ANALYZER',
      userName: instrumentName || 'Analyzer Integration',
      action: 'INGEST_ANALYZER_DATA',
      entityType: 'LAB_RESULT',
      entityId: result.id,
      details: { requestId: request.id, sampleId, matchedCount, format: parsed.format },
    });

    return {
      matched: true,
      requestId: request.id,
      patientId: request.patientId,
      sampleId: request.sampleId || sampleId,
      instrumentName: result.instrumentName,
      resultsCount: matchedCount,
      result,
      request,
    };
  },

  // ---------------------------------------------------------------- PROCEDURES
  async listProcedures(status, userRole = null) {
    let procedures = [...inMemoryState.procedures].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (status) procedures = procedures.filter((p) => p.status === status);
    if (userRole === 'procedure') {
      procedures = procedures.filter((p) => p.paymentStatus === 'PAID' || p.paymentStatus === 'VERIFIED');
    }
    return procedures.map((p) => {
      const patient = inMemoryState.patients.find((x) => x.id === p.patientId);
      return { ...p, patient: patient || null };
    });
  },

  async getProcedure(id) {
    const procedure = inMemoryState.procedures.find((p) => p.id === id);
    if (!procedure) return null;
    const patient = inMemoryState.patients.find((x) => x.id === procedure.patientId);
    return { ...procedure, patient: patient || null };
  },

  async createProcedure(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    const num = nextProcedureNumber();
    const procedure = {
      id: `PC-${num.slice(3)}`,
      procedureNumber: num,
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      patientId: visit.patientId,
      patientName: visit.patientName,
      requestingDoctor: user.name,
      procedureType: data.procedureType,
      notes: data.notes || '',
      date: now(),
      status: 'requested',
      paymentStatus: 'UNPAID',
      recording: null,
    };

    inMemoryState.procedures.push(procedure);

    if (isPostgresConnected) {
      try {
        await prisma.procedure.create({
          data: {
            ...procedure,
            date: new Date(procedure.date),
          },
        });
      } catch (e) {
        console.warn('PG create procedure fallback:', e.message);
      }
    }

    try {
      await this.syncVisitInvoice(visit.id, user);
    } catch (e) {
      console.warn('Sync invoice after procedure fallback:', e.message);
    }

    return procedure;
  },

  async updateProcedureStatus(id, status) {
    const procedure = inMemoryState.procedures.find((p) => p.id === id);
    if (!procedure) return null;
    procedure.status = status;

    if (isPostgresConnected) {
      try {
        await prisma.procedure.update({ where: { id }, data: { status } });
      } catch (e) {
        console.warn('PG update procedure fallback:', e.message);
      }
    }

    return procedure;
  },

  async recordProcedure(id, data, user) {
    const procedure = inMemoryState.procedures.find((p) => p.id === id);
    if (!procedure) return null;

    if (procedure.paymentStatus !== 'PAID' && procedure.paymentStatus !== 'VERIFIED') {
      const err = new Error('Payment must be verified at reception before administering procedure/injection.');
      err.statusCode = 402;
      throw err;
    }

    procedure.recording = {
      procedureType: procedure.procedureType,
      medicine: data.medicine || '',
      dosage: data.dosage || '',
      administrationDetails: data.administrationDetails || '',
      date: now(),
      time: data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      responsibleStaff: data.responsibleStaff || user.name,
      notes: data.notes || '',
    };
    procedure.status = 'completed';

    if (isPostgresConnected) {
      try {
        await prisma.procedure.update({
          where: { id },
          data: {
            status: 'completed',
            recording: procedure.recording,
          },
        });
      } catch (e) {
        console.warn('PG record procedure fallback:', e.message);
      }
    }

    const patient = inMemoryState.patients.find((x) => x.id === procedure.patientId);
    return { ...procedure, patient: patient || null };
  },

  // ---------------------------------------------------------------- PRESCRIPTIONS & PHARMACY DISPENSING
  async listPrescriptions(patientId, status = null, userRole = null) {
    inMemoryState.prescriptions = inMemoryState.prescriptions || [];
    let prescriptions = [...inMemoryState.prescriptions].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    if (patientId) prescriptions = prescriptions.filter((p) => p.patientId === patientId);
    if (status) {
      const s = status.toUpperCase();
      prescriptions = prescriptions.filter((p) => (p.status || '').toUpperCase() === s);
    }
    if (userRole === 'pharmacy') {
      prescriptions = prescriptions.filter((p) => p.paymentStatus === 'PAID' || p.paymentStatus === 'VERIFIED');
    }
    return prescriptions.map((p) => {
      const patient = inMemoryState.patients.find((x) => x.id === p.patientId);
      return { ...p, patient: patient || null };
    });
  },

  async getPrescription(id) {
    inMemoryState.prescriptions = inMemoryState.prescriptions || [];
    const prescription = inMemoryState.prescriptions.find((p) => p.id === id || p.prescriptionNumber === id);
    if (!prescription) return null;
    const patient = inMemoryState.patients.find((x) => x.id === prescription.patientId);
    return { ...prescription, patient: patient || null };
  },

  async createPrescription(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    const clean = data.medicines.map((m, idx) => {
      const cat = inMemoryState.medicines.find((x) => x.name === m.medicine);
      return {
        id: m.id || `RXI-${idx + 1}`,
        medicine: m.medicine || '',
        dosage: m.dosage || m.dose || cat?.defaultDosage || '',
        dose: m.dose || m.dosage || cat?.defaultDosage || '',
        frequency: m.frequency || 'TID',
        duration: m.duration || '5 days',
        route: (m.route || cat?.defaultRoute || 'ORAL').toUpperCase(),
        quantity: Number(m.quantity || m.qty || 1),
        dispensedQuantity: 0,
        instructions: m.instructions || '',
        notes: m.notes || '',
        status: 'PRESCRIBED',
      };
    });

    const num = nextPrescriptionNumber();
    const prescription = {
      id: `RX-${num.slice(3)}`,
      prescriptionNumber: num,
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      patientId: visit.patientId,
      patientName: visit.patientName,
      doctor: user.name,
      doctorId: user.id,
      date: now(),
      medicines: clean,
      status: 'PRESCRIBED', // PRESCRIBED, AWAITING_PAYMENT, AUTHORIZED, PARTIALLY_DISPENSED, DISPENSED, CANCELLED
      paymentStatus: 'UNPAID',
      dispensedBy: null,
      dispensedAt: null,
      dispensingNotes: '',
      createdAt: now(),
      updatedAt: now(),
    };

    inMemoryState.prescriptions = inMemoryState.prescriptions || [];
    inMemoryState.prescriptions.push(prescription);

    if (isPostgresConnected) {
      try {
        await prisma.prescription.create({
          data: {
            ...prescription,
            date: new Date(prescription.date),
            createdAt: new Date(prescription.createdAt),
            updatedAt: new Date(prescription.updatedAt),
          },
        });
      } catch (e) {
        console.warn('PG create prescription fallback:', e.message);
      }
    }

    try {
      await this.syncVisitInvoice(visit.id, user);
    } catch (e) {
      console.warn('Sync invoice after prescription fallback:', e.message);
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_PRESCRIPTION',
      entityType: 'PRESCRIPTION',
      entityId: prescription.id,
      details: {
        prescriptionNumber: prescription.prescriptionNumber,
        medicinesCount: clean.length,
        patientId: visit.patientId,
      },
    });

    return prescription;
  },

  async dispensePrescription(id, dispensingData = {}, user) {
    inMemoryState.prescriptions = inMemoryState.prescriptions || [];
    const prescription = inMemoryState.prescriptions.find((p) => p.id === id || p.prescriptionNumber === id);
    if (!prescription) throw new Error('Prescription not found.');

    if (prescription.paymentStatus !== 'PAID' && prescription.paymentStatus !== 'VERIFIED') {
      const err = new Error('Payment must be verified at reception before dispensing medication.');
      err.statusCode = 402;
      throw err;
    }

    const itemUpdates = dispensingData.items || [];
    let allDispensed = true;
    let anyDispensed = false;

    prescription.medicines = prescription.medicines.map((item, idx) => {
      const match = itemUpdates.find((u) => u.id === item.id || u.medicine === item.medicine || u.index === idx);
      const qtyToDispense = match?.dispensedQuantity !== undefined ? Number(match.dispensedQuantity) : item.quantity || 1;
      const isItemFull = qtyToDispense >= (item.quantity || 1);

      if (qtyToDispense > 0) anyDispensed = true;
      if (!isItemFull) allDispensed = false;

      return {
        ...item,
        dispensedQuantity: qtyToDispense,
        status: isItemFull ? 'DISPENSED' : qtyToDispense > 0 ? 'PARTIALLY_DISPENSED' : item.status,
      };
    });

    prescription.status = allDispensed ? 'DISPENSED' : anyDispensed ? 'PARTIALLY_DISPENSED' : 'PRESCRIBED';
    prescription.dispensedBy = user.name;
    prescription.dispensedById = user.id;
    prescription.dispensedAt = now();
    prescription.dispensingNotes = dispensingData.notes || 'Medication dispensed according to clinical prescription.';
    prescription.updatedAt = now();

    if (isPostgresConnected) {
      try {
        await prisma.prescription.update({
          where: { id: prescription.id },
          data: {
            medicines: prescription.medicines,
            status: prescription.status,
            dispensedBy: prescription.dispensedBy,
            dispensedById: prescription.dispensedById,
            dispensedAt: new Date(prescription.dispensedAt),
            dispensingNotes: prescription.dispensingNotes,
            updatedAt: new Date(prescription.updatedAt),
          },
        });
      } catch (e) {
        console.warn('PG dispense prescription fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'DISPENSE_PRESCRIPTION',
      entityType: 'PRESCRIPTION',
      entityId: prescription.id,
      details: {
        prescriptionNumber: prescription.prescriptionNumber,
        status: prescription.status,
        dispensedBy: user.name,
      },
    });

    const patient = inMemoryState.patients.find((x) => x.id === prescription.patientId);
    return { prescription: { ...prescription, patient: patient || null } };
  },

  // ---------------------------------------------------------------- INJECTION WORKFLOW & ADMINISTRATIONS
  async listInjectionOrders(patientId, status = null, userRole = null) {
    inMemoryState.injectionOrders = inMemoryState.injectionOrders || [];
    inMemoryState.injectionAdministrations = inMemoryState.injectionAdministrations || [];
    let orders = [...inMemoryState.injectionOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (patientId) orders = orders.filter((o) => o.patientId === patientId);
    if (status) {
      const s = status.toUpperCase();
      orders = orders.filter((o) => (o.status || '').toUpperCase() === s);
    }
    if (userRole === 'procedure' || userRole === 'nurse') {
      orders = orders.filter((o) => o.paymentStatus === 'PAID' || o.paymentStatus === 'VERIFIED');
    }
    return orders.map((o) => {
      const patient = inMemoryState.patients.find((x) => x.id === o.patientId);
      const administrations = inMemoryState.injectionAdministrations.filter((a) => a.injectionOrderId === o.id);
      return { ...o, patient: patient || null, administrations };
    });
  },

  async getInjectionOrder(id) {
    inMemoryState.injectionOrders = inMemoryState.injectionOrders || [];
    inMemoryState.injectionAdministrations = inMemoryState.injectionAdministrations || [];
    const order = inMemoryState.injectionOrders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return null;
    const patient = inMemoryState.patients.find((x) => x.id === order.patientId);
    const administrations = inMemoryState.injectionAdministrations.filter((a) => a.injectionOrderId === order.id);
    return { ...order, patient: patient || null, administrations };
  },

  async createInjectionOrder(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    const num = nextInjectionOrderNumber();
    const order = {
      id: `INJ-${num.slice(4)}`,
      orderNumber: num,
      patientId: visit.patientId,
      patientName: visit.patientName,
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      doctorId: user.id,
      doctorName: user.name,
      medication: data.medication,
      prescribedDose: data.prescribedDose || data.dose || '',
      route: (data.route || 'IM').toUpperCase(),
      frequency: data.frequency || 'STAT',
      instructions: data.instructions || '',
      status: 'ORDERED', // ORDERED, AWAITING_PAYMENT, AUTHORIZED, READY, ADMINISTERED, REFUSED, HELD, CANCELLED
      paymentStatus: 'UNPAID',
      createdAt: now(),
      updatedAt: now(),
    };

    inMemoryState.injectionOrders = inMemoryState.injectionOrders || [];
    inMemoryState.injectionOrders.push(order);

    if (isPostgresConnected) {
      try {
        await prisma.injectionOrder.create({
          data: {
            ...order,
            createdAt: new Date(order.createdAt),
            updatedAt: new Date(order.updatedAt),
          },
        });
      } catch (e) {
        console.warn('PG create injection order fallback:', e.message);
      }
    }

    try {
      await this.syncVisitInvoice(visit.id, user);
    } catch (e) {
      console.warn('Sync invoice after injection order fallback:', e.message);
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CREATE_INJECTION_ORDER',
      entityType: 'INJECTION_ORDER',
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        medication: order.medication,
        prescribedDose: order.prescribedDose,
        route: order.route,
      },
    });

    return order;
  },

  async administerInjection(orderId, adminData = {}, user) {
    inMemoryState.injectionOrders = inMemoryState.injectionOrders || [];
    inMemoryState.injectionAdministrations = inMemoryState.injectionAdministrations || [];
    const order = inMemoryState.injectionOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) throw new Error('Injection order not found.');

    if (order.paymentStatus !== 'PAID' && order.paymentStatus !== 'VERIFIED') {
      const err = new Error('Payment must be verified at reception before administering injection.');
      err.statusCode = 402;
      throw err;
    }

    const admNum = nextInjectionAdminNumber();
    const administration = {
      id: `ADM-${admNum.slice(4)}`,
      administrationNumber: admNum,
      injectionOrderId: order.id,
      actualMedication: adminData.actualMedication || order.medication,
      actualDose: adminData.actualDose || order.prescribedDose,
      route: (adminData.route || order.route || 'IM').toUpperCase(),
      administrationSite: adminData.administrationSite || 'Left Deltoid',
      administeredBy: user.name,
      administeredById: user.id,
      administeredAt: now(),
      notes: adminData.notes || 'Administered according to aseptic technique.',
      status: adminData.status || 'COMPLETED', // COMPLETED, REFUSED, HELD, ADVERSE_REACTION
      createdAt: now(),
    };

    inMemoryState.injectionAdministrations.push(administration);

    order.status = administration.status === 'COMPLETED' ? 'ADMINISTERED' : administration.status;
    order.updatedAt = now();

    if (isPostgresConnected) {
      try {
        await prisma.injectionAdministration.create({
          data: {
            ...administration,
            administeredAt: new Date(administration.administeredAt),
            createdAt: new Date(administration.createdAt),
          },
        });
        await prisma.injectionOrder.update({
          where: { id: order.id },
          data: { status: order.status, updatedAt: new Date(order.updatedAt) },
        });
      } catch (e) {
        console.warn('PG administer injection fallback:', e.message);
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'ADMINISTER_INJECTION',
      entityType: 'INJECTION_ADMINISTRATION',
      entityId: administration.id,
      details: {
        orderNumber: order.orderNumber,
        actualMedication: administration.actualMedication,
        actualDose: administration.actualDose,
        administrationSite: administration.administrationSite,
        administeredBy: user.name,
      },
    });

    const patient = inMemoryState.patients.find((x) => x.id === order.patientId);
    return {
      order: {
        ...order,
        patient: patient || null,
        administrations: inMemoryState.injectionAdministrations.filter((a) => a.injectionOrderId === order.id),
      },
      administration,
    };
  },

  // ---------------------------------------------------------------- DASHBOARD & REPORTS
  async getDashboard() {
    const today = toDateKey(new Date().toISOString());
    const patients = inMemoryState.patients;
    const visitsToday = inMemoryState.visits.filter((v) => toDateKey(v.date) === today);
    const visitsAll = inMemoryState.visits;
    const visitDates = new Set(visitsAll.map((v) => v.patientId));

    const newPatients = patients.filter((p) => toDateKey(p.registrationDate) === today);
    const returningPatients = patients.filter((p) => visitDates.has(p.id));

    const queueToday = inMemoryState.queue.filter((q) => q.date.startsWith(today));
    const waiting = queueToday.filter((q) => q.status === 'waiting' || q.status === 'called').length;
    const inConsultation = queueToday.filter((q) => q.status === 'in_consultation').length;

    const consultationsToday = inMemoryState.consultations.filter((c) => toDateKey(c.date) === today);
    const consultationsAll = inMemoryState.consultations;

    const labRequests = inMemoryState.labRequests;
    const pendingLab = labRequests.filter((r) => r.status === 'pending' || r.status === 'in_progress');
    const completedResults = inMemoryState.labResults.filter((r) => r.status === 'verified' || r.status === 'completed');

    const procedures = inMemoryState.procedures;
    const pendingProcedures = procedures.filter((p) => p.status !== 'completed');
    const completedProcedures = procedures.filter((p) => p.status === 'completed');

    const prescriptions = inMemoryState.prescriptions;

    const queueByStatus = {
      waiting,
      in_consultation: inConsultation,
      completed: queueToday.filter((q) => q.status === 'completed').length,
    };

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      last7Days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: key,
        patients: inMemoryState.visits.filter((v) => toDateKey(v.date) === key).length,
        consultations: inMemoryState.consultations.filter((c) => toDateKey(c.date) === key).length,
        laboratory: inMemoryState.labRequests.filter((r) => toDateKey(r.date) === key).length,
      });
    }

    return {
      stats: {
        totalPatients: patients.length,
        newPatientsToday: newPatients.length,
        returningPatients: returningPatients.length,
        waitingPatients: waiting,
        inConsultation,
        opdConsultations: consultationsToday.length,
        totalConsultations: consultationsAll.length,
        laboratoryRequests: labRequests.length,
        pendingLaboratoryTests: pendingLab.length,
        completedResults: completedResults.length,
        procedures: procedures.length,
        pendingProcedures: pendingProcedures.length,
        completedProcedures: completedProcedures.length,
        prescriptions: prescriptions.length,
        visitsToday: visitsToday.length,
      },
      queueByStatus,
      last7Days,
    };
  },

  async dailyPatientReport(date = toDateKey(new Date().toISOString())) {
    const visits = inMemoryState.visits.filter((x) => toDateKey(x.date) === date).sort((a, b) => a.date.localeCompare(b.date));
    const patientsSeen = visits.map((v) => {
      const p = inMemoryState.patients.find((x) => x.id === v.patientId);
      return { ...v, patient: p ? { ...p, age: computeAge(p.dateOfBirth) } : null };
    });
    const newPatients = inMemoryState.patients.filter((p) => toDateKey(p.registrationDate) === date);
    const returning = inMemoryState.patients.filter((p) => {
      const v = inMemoryState.visits.filter((x) => x.patientId === p.id && toDateKey(x.date) < date);
      return v.length > 0;
    });

    return {
      date,
      totalVisits: visits.length,
      newPatientsToday: newPatients.length,
      returningPatientsToday: returning.length,
      rows: patientsSeen,
    };
  },

  async opdReport(date = toDateKey(new Date().toISOString())) {
    const consultations = inMemoryState.consultations.filter((x) => toDateKey(x.date) === date).sort((a, b) => a.date.localeCompare(b.date));
    return {
      date,
      totalConsultations: consultations.length,
      completed: consultations.filter((c) => c.status === 'completed').length,
      inProgress: consultations.filter((c) => c.status === 'in_progress').length,
      rows: consultations.map((c) => {
        const p = inMemoryState.patients.find((x) => x.id === c.patientId);
        return { ...c, patient: p ? { ...p, age: computeAge(p.dateOfBirth) } : null };
      }),
    };
  },

  async laboratoryReport(date = toDateKey(new Date().toISOString())) {
    const requests = inMemoryState.labRequests.filter((x) => toDateKey(x.date) === date).sort((a, b) => a.date.localeCompare(b.date));
    return {
      date,
      totalRequests: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      inProgress: requests.filter((r) => r.status === 'in_progress').length,
      completed: requests.filter((r) => r.status === 'completed').length,
      rows: requests.map((r) => {
        const p = inMemoryState.patients.find((x) => x.id === r.patientId);
        const result = inMemoryState.labResults.find((x) => x.requestId === r.id);
        return { ...r, patient: p || null, result: result || null };
      }),
    };
  },

  async procedureReport(date = toDateKey(new Date().toISOString())) {
    const procedures = inMemoryState.procedures.filter((x) => toDateKey(x.date) === date).sort((a, b) => a.date.localeCompare(b.date));
    return {
      date,
      totalProcedures: procedures.length,
      pending: procedures.filter((p) => p.status !== 'completed').length,
      completed: procedures.filter((p) => p.status === 'completed').length,
      rows: procedures.map((p) => {
        const patient = inMemoryState.patients.find((x) => x.id === p.patientId);
        return { ...p, patient: patient || null };
      }),
    };
  },

  async prescriptionReport(date = toDateKey(new Date().toISOString())) {
    const prescriptions = inMemoryState.prescriptions.filter((x) => toDateKey(x.date) === date).sort((a, b) => a.date.localeCompare(b.date));
    return {
      date,
      totalPrescriptions: prescriptions.length,
      rows: prescriptions.map((p) => {
        const patient = inMemoryState.patients.find((x) => x.id === p.patientId);
        return { ...p, patient: patient || null };
      }),
    };
  },

  // ---------------------------------------------------------------- RESET
  async resetDatabase() {
    inMemoryState = buildSeed();
    resetCounters();

    if (isPostgresConnected) {
      try {
        await prisma.$executeRawUnsafe(`
          TRUNCATE TABLE 
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
            "medicines",
            "procedure_types",
            "departments",
            "lab_devices"
          CASCADE;
        `);
      } catch (e) {
        console.warn('PG truncate fallback:', e.message);
      }
    }
    return true;
  },

  // ---------------------------------------------------------------- RECYCLE BIN (30-DAY RETENTION)
  async moveToRecycleBin({ entityType, entityId, title, details = {}, data, user = null }) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days retention
    const id = 'RB-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const item = {
      id,
      entityType,
      entityId,
      title: title || `${entityType} #${entityId}`,
      details,
      data,
      deletedBy: user?.name || 'System Administrator',
      deletedById: user?.id || null,
      deletedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    if (isPostgresConnected) {
      try {
        await prisma.recycleBinItem.create({
          data: {
            id: item.id,
            entityType: item.entityType,
            entityId: item.entityId,
            title: item.title,
            details: item.details,
            data: item.data,
            deletedBy: item.deletedBy,
            deletedById: item.deletedById,
            deletedAt: new Date(item.deletedAt),
            expiresAt: new Date(item.expiresAt),
          },
        });
      } catch (e) {
        console.warn('PG recycle bin insert fallback:', e.message);
      }
    }

    inMemoryState.recycleBin = inMemoryState.recycleBin || [];
    inMemoryState.recycleBin.unshift(item);

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'System',
      action: 'MOVE_TO_RECYCLE_BIN',
      entityType,
      entityId,
      details: { title: item.title, expiresAt: item.expiresAt },
    });

    return item;
  },

  async listRecycleBin() {
    await this.purgeExpiredRecycleItems();

    if (isPostgresConnected) {
      try {
        const rows = await prisma.recycleBinItem.findMany({
          orderBy: { deletedAt: 'desc' },
        });
        const now = Date.now();
        return rows.map((r) => {
          const exp = new Date(r.expiresAt).getTime();
          const daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
          return {
            ...r,
            deletedAt: r.deletedAt.toISOString(),
            expiresAt: r.expiresAt.toISOString(),
            daysRemaining,
          };
        });
      } catch (e) {
        console.warn('PG list recycle bin fallback:', e.message);
      }
    }

    const now = Date.now();
    inMemoryState.recycleBin = inMemoryState.recycleBin || [];
    return inMemoryState.recycleBin.map((item) => {
      const exp = new Date(item.expiresAt).getTime();
      const daysRemaining = Math.max(0, Math.ceil((exp - now) / (1000 * 60 * 60 * 24)));
      return {
        ...item,
        daysRemaining,
      };
    });
  },

  async restoreFromRecycleBin(id, user = null) {
    let item = null;

    if (isPostgresConnected) {
      try {
        const row = await prisma.recycleBinItem.findUnique({ where: { id } });
        if (row) {
          item = {
            ...row,
            deletedAt: row.deletedAt.toISOString(),
            expiresAt: row.expiresAt.toISOString(),
          };
        }
      } catch (e) {
        console.warn('PG find recycle item fallback:', e.message);
      }
    }

    if (!item) {
      inMemoryState.recycleBin = inMemoryState.recycleBin || [];
      item = inMemoryState.recycleBin.find((r) => r.id === id);
    }

    if (!item) return null;

    const payload = item.data;

    // Restore based on entityType
    if (item.entityType === 'USER') {
      const exists = inMemoryState.users.some((u) => u.id === payload.id);
      if (!exists) inMemoryState.users.push(payload);
      if (isPostgresConnected) {
        try {
          await prisma.user.upsert({
            where: { id: payload.id },
            create: {
              id: payload.id,
              username: payload.username,
              passwordHash: payload.passwordHash || (await hashPassword(payload.password || 'password123')),
              fullName: payload.name || payload.fullName,
              role: payload.rawRole || payload.role?.toUpperCase(),
              title: payload.title || '',
              active: payload.active !== undefined ? payload.active : true,
            },
            update: {
              active: true,
            },
          });
        } catch (e) {
          console.warn('PG user restore fallback:', e.message);
        }
      }
    } else if (item.entityType === 'PATIENT') {
      const exists = inMemoryState.patients.some((p) => p.id === payload.id);
      if (!exists) inMemoryState.patients.push(payload);
      if (isPostgresConnected) {
        try {
          await prisma.patient.upsert({
            where: { id: payload.id },
            create: payload,
            update: payload,
          });
        } catch (e) {
          console.warn('PG patient restore fallback:', e.message);
        }
      }
    } else if (item.entityType === 'VISIT') {
      const exists = inMemoryState.visits.some((v) => v.id === payload.id);
      if (!exists) inMemoryState.visits.push(payload);
    } else if (item.entityType === 'PRESCRIPTION') {
      const exists = inMemoryState.prescriptions.some((p) => p.id === payload.id);
      if (!exists) inMemoryState.prescriptions.push(payload);
    }

    // Remove from Recycle Bin
    if (isPostgresConnected) {
      try {
        await prisma.recycleBinItem.delete({ where: { id } });
      } catch (e) {
        console.warn('PG recycle delete fallback:', e.message);
      }
    }
    inMemoryState.recycleBin = (inMemoryState.recycleBin || []).filter((r) => r.id !== id);

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'System',
      action: 'RESTORE_FROM_RECYCLE_BIN',
      entityType: item.entityType,
      entityId: item.entityId,
      details: { title: item.title },
    });

    return item;
  },

  async permanentlyDeleteRecycleItem(id, user = null) {
    if (isPostgresConnected) {
      try {
        await prisma.recycleBinItem.delete({ where: { id } });
      } catch (e) {
        console.warn('PG purge recycle item fallback:', e.message);
      }
    }
    const idx = (inMemoryState.recycleBin || []).findIndex((r) => r.id === id);
    let removed = null;
    if (idx !== -1) {
      removed = inMemoryState.recycleBin.splice(idx, 1)[0];
    }

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'System',
      action: 'PURGE_RECYCLE_ITEM',
      entityType: removed?.entityType || 'RECYCLE_ITEM',
      entityId: removed?.entityId || id,
      details: { title: removed?.title || id },
    });

    return true;
  },

  async emptyRecycleBin(user = null) {
    if (isPostgresConnected) {
      try {
        await prisma.recycleBinItem.deleteMany({});
      } catch (e) {
        console.warn('PG empty recycle bin fallback:', e.message);
      }
    }
    const count = (inMemoryState.recycleBin || []).length;
    inMemoryState.recycleBin = [];

    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'System',
      action: 'EMPTY_RECYCLE_BIN',
      entityType: 'SYSTEM',
      entityId: 'RECYCLE_BIN',
      details: { purgedCount: count },
    });

    return { purgedCount: count };
  },

  async purgeExpiredRecycleItems() {
    const now = new Date();
    if (isPostgresConnected) {
      try {
        await prisma.recycleBinItem.deleteMany({
          where: { expiresAt: { lt: now } },
        });
      } catch (e) {
        console.warn('PG purge expired fallback:', e.message);
      }
    }
    if (inMemoryState.recycleBin) {
      inMemoryState.recycleBin = inMemoryState.recycleBin.filter(
        (r) => new Date(r.expiresAt).getTime() > now.getTime()
      );
    }
  },

  // ---------------------------------------------------------------- BILLING & INVOICES (PHASE 3)
  async syncVisitInvoice(visitId, user = null) {
    const visit = inMemoryState.visits.find((v) => v.id === visitId);
    if (!visit) return null;

    const patient = inMemoryState.patients.find((p) => p.id === visit.patientId);
    inMemoryState.invoices = inMemoryState.invoices || [];
    inMemoryState.invoiceItems = inMemoryState.invoiceItems || [];
    inMemoryState.payments = inMemoryState.payments || [];
    inMemoryState.paymentVerifications = inMemoryState.paymentVerifications || [];

    let invoice = inMemoryState.invoices.find((i) => i.visitId === visit.id);
    if (!invoice) {
      const num = nextInvoiceNumber();
      invoice = {
        id: `I-${num.slice(4)}`,
        invoiceNumber: num,
        patientId: visit.patientId,
        patientName: patient?.fullName || visit.patientName,
        visitId: visit.id,
        visitNumber: visit.visitNumber,
        totalAmount: 0,
        paidAmount: 0,
        balance: 0,
        status: 'UNPAID', // UNPAID, PARTIALLY_PAID, PAID, VERIFIED, CANCELLED, REFUNDED
        createdAt: visit.date || visit.createdAt || now(),
        updatedAt: now(),
      };
      inMemoryState.invoices.push(invoice);
    }

    // Reconstruct line items
    const items = [];

    // 1. Consultation fee
    items.push({
      id: `ITM-${invoice.invoiceNumber}-01`,
      invoiceId: invoice.id,
      serviceType: 'CONSULTATION',
      serviceReferenceId: visit.id,
      description: `General OPD Consultation (${visit.service || 'General'})`,
      quantity: 1,
      unitPrice: 200,
      totalPrice: 200,
      status: invoice.status === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
      createdAt: visit.date || visit.createdAt || now(),
    });

    // 2. Laboratory tests
    const visitLabs = inMemoryState.labRequests.filter((l) => l.visitId === visit.id);
    visitLabs.forEach((l, lIdx) => {
      (l.tests || []).forEach((t, tIdx) => {
        const testCatalog = inMemoryState.labTests.find((c) => c.id === t.id);
        const price = testCatalog?.price || 150;
        items.push({
          id: `ITM-${invoice.invoiceNumber}-L${lIdx}-${tIdx}`,
          invoiceId: invoice.id,
          serviceType: 'LABORATORY',
          serviceReferenceId: l.id,
          description: `Laboratory: ${t.name}`,
          quantity: 1,
          unitPrice: price,
          totalPrice: price,
          status: l.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
          createdAt: l.date || l.createdAt || now(),
        });
      });
      if (invoice.status === 'VERIFIED') l.paymentStatus = 'VERIFIED';
    });

    // 3. Procedures & Injections
    const visitProcs = inMemoryState.procedures.filter((p) => p.visitId === visit.id);
    visitProcs.forEach((p, pIdx) => {
      const procCatalog = inMemoryState.procedureTypes.find((c) => c.name === p.procedureType);
      const price = procCatalog?.price || 120;
      const isInj = p.procedureType?.toLowerCase().includes('injection') || p.procedureType?.toLowerCase().includes('im') || p.procedureType?.toLowerCase().includes('iv');
      items.push({
        id: `ITM-${invoice.invoiceNumber}-P${pIdx}`,
        invoiceId: invoice.id,
        serviceType: isInj ? 'INJECTION' : 'PROCEDURE',
        serviceReferenceId: p.id,
        description: `${isInj ? 'Injection' : 'Procedure'}: ${p.procedureType}`,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
        status: p.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
        createdAt: p.date || p.createdAt || now(),
      });
      if (invoice.status === 'VERIFIED') p.paymentStatus = 'VERIFIED';
    });

    // 3b. Dedicated Injection Orders
    const visitInjs = (inMemoryState.injectionOrders || []).filter((inj) => inj.visitId === visit.id);
    visitInjs.forEach((inj, iIdx) => {
      const price = 60; // Standard clinic injection administration charge
      items.push({
        id: `ITM-${invoice.invoiceNumber}-INJ${iIdx}`,
        invoiceId: invoice.id,
        serviceType: 'INJECTION',
        serviceReferenceId: inj.id,
        description: `Injection: ${inj.medication} (${inj.prescribedDose} ${inj.route})`,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
        status: inj.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
        createdAt: inj.createdAt || now(),
      });
      if (invoice.status === 'VERIFIED') inj.paymentStatus = 'VERIFIED';
    });

    // 4. Prescriptions
    const visitRxs = inMemoryState.prescriptions.filter((rx) => rx.visitId === visit.id);
    visitRxs.forEach((rx, rIdx) => {
      (rx.medicines || []).forEach((m, mIdx) => {
        const medCatalog = inMemoryState.medicines.find((c) =>
          c.name.toLowerCase().includes(String(m.medicine || '').toLowerCase())
        );
        const price = medCatalog?.price || 80;
        const qty = Number(m.quantity || 1);
        items.push({
          id: `ITM-${invoice.invoiceNumber}-R${rIdx}-${mIdx}`,
          invoiceId: invoice.id,
          serviceType: 'PHARMACY',
          serviceReferenceId: rx.id,
          description: `Medication: ${m.medicine} (${m.dosage || m.dose || ''}) x${qty}`,
          quantity: qty,
          unitPrice: price,
          totalPrice: price * qty,
          status: rx.paymentStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING',
          createdAt: rx.date || rx.createdAt || now(),
        });
      });
      if (invoice.status === 'VERIFIED') rx.paymentStatus = 'VERIFIED';
    });

    // Remove existing invoice items for this invoice and replace
    inMemoryState.invoiceItems = inMemoryState.invoiceItems.filter((it) => it.invoiceId !== invoice.id);
    inMemoryState.invoiceItems.push(...items);

    const total = items.reduce((acc, it) => acc + it.totalPrice, 0);
    invoice.totalAmount = total;
    invoice.balance = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));

    if (invoice.status !== 'VERIFIED' && invoice.status !== 'CANCELLED' && invoice.status !== 'REFUNDED') {
      if (invoice.paidAmount >= invoice.totalAmount && invoice.totalAmount > 0) {
        invoice.status = 'PAID';
      } else if (invoice.paidAmount > 0) {
        invoice.status = 'PARTIALLY_PAID';
      } else {
        invoice.status = 'UNPAID';
      }
    }
    invoice.updatedAt = now();

    return this.getInvoice(invoice.id);
  },

  async listInvoices(status = null, q = '') {
    inMemoryState.invoices = inMemoryState.invoices || [];
    let list = [...inMemoryState.invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (status) {
      const s = status.toUpperCase();
      list = list.filter((i) => i.status === s);
    }
    if (q) {
      const query = q.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(query) ||
          i.patientName.toLowerCase().includes(query) ||
          i.visitNumber.toLowerCase().includes(query)
      );
    }

    return list.map((i) => {
      const patient = inMemoryState.patients.find((p) => p.id === i.patientId);
      const items = (inMemoryState.invoiceItems || []).filter((it) => it.invoiceId === i.id);
      const payments = (inMemoryState.payments || []).filter((p) => p.invoiceId === i.id && p.status !== 'CANCELLED');
      return {
        ...i,
        patient: patient || null,
        itemCount: items.length,
        paymentCount: payments.length,
      };
    });
  },

  async getInvoice(id) {
    inMemoryState.invoices = inMemoryState.invoices || [];
    const invoice = inMemoryState.invoices.find((i) => i.id === id || i.invoiceNumber === id);
    if (!invoice) return null;

    const patient = inMemoryState.patients.find((p) => p.id === invoice.patientId);
    const visit = inMemoryState.visits.find((v) => v.id === invoice.visitId);
    const items = (inMemoryState.invoiceItems || []).filter((it) => it.invoiceId === invoice.id);
    const payments = (inMemoryState.payments || []).filter((p) => p.invoiceId === invoice.id);
    const verifications = (inMemoryState.paymentVerifications || []).filter((pv) => pv.invoiceId === invoice.id);

    return {
      invoice,
      patient: patient || null,
      visit: visit || null,
      items,
      payments,
      verifications,
    };
  },

  async getVisitInvoice(visitId, user = null) {
    let invoice = (inMemoryState.invoices || []).find((i) => i.visitId === visitId);
    if (!invoice) {
      await this.syncVisitInvoice(visitId, user);
      invoice = (inMemoryState.invoices || []).find((i) => i.visitId === visitId);
    }
    return this.getInvoice(invoice?.id || visitId);
  },

  async receivePayment(invoiceId, { amount, paymentMethod = 'CASH', notes = '' }, user) {
    const invoice = (inMemoryState.invoices || []).find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be a positive number.');
    }

    if (invoice.balance <= 0 && invoice.paidAmount >= invoice.totalAmount) {
      throw new Error('This invoice is already fully paid.');
    }

    const payNum = nextPaymentNumber();
    const rcpNum = nextReceiptNumber();
    const payment = {
      id: `P-${payNum.slice(4)}`,
      paymentNumber: payNum,
      invoiceId: invoice.id,
      amount: paymentAmount,
      paymentMethod: paymentMethod.toUpperCase(),
      receiptNumber: rcpNum,
      receivedBy: user.name,
      receivedById: user.id,
      receivedAt: now(),
      status: 'COMPLETED',
      notes: notes || '',
    };

    inMemoryState.payments = inMemoryState.payments || [];
    inMemoryState.payments.push(payment);

    invoice.paidAmount = (invoice.paidAmount || 0) + paymentAmount;
    invoice.balance = Math.max(0, invoice.totalAmount - invoice.paidAmount);

    if (invoice.status !== 'VERIFIED') {
      if (invoice.balance === 0) {
        invoice.status = 'PAID';
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }
    }
    invoice.updatedAt = now();

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'RECEIVE_PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        receiptNumber: payment.receiptNumber,
        amount: paymentAmount,
        paymentMethod: payment.paymentMethod,
        remainingBalance: invoice.balance,
      },
    });

    return {
      invoice,
      payment,
    };
  },

  async verifyPayment(invoiceId, { notes = '' }, user) {
    const invoice = (inMemoryState.invoices || []).find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (invoice.balance > 0) {
      throw new Error(`Cannot verify payment with outstanding balance of ${invoice.balance} ETB. Full payment required.`);
    }

    const verification = {
      id: `PV-${Date.now().toString(36)}`,
      invoiceId: invoice.id,
      paymentId: null,
      verifiedBy: user.name,
      verifiedById: user.id,
      verifiedAt: now(),
      notes: notes || 'Verified at reception desk',
    };

    inMemoryState.paymentVerifications = inMemoryState.paymentVerifications || [];
    inMemoryState.paymentVerifications.push(verification);

    invoice.status = 'VERIFIED';
    invoice.updatedAt = now();

    // Mark all items verified
    (inMemoryState.invoiceItems || []).forEach((it) => {
      if (it.invoiceId === invoice.id) it.status = 'VERIFIED';
    });

    // Mark all related visit orders VERIFIED
    (inMemoryState.labRequests || []).forEach((l) => {
      if (l.visitId === invoice.visitId) l.paymentStatus = 'VERIFIED';
    });
    (inMemoryState.procedures || []).forEach((p) => {
      if (p.visitId === invoice.visitId) p.paymentStatus = 'VERIFIED';
    });
    (inMemoryState.injectionOrders || []).forEach((inj) => {
      if (inj.visitId === invoice.visitId) inj.paymentStatus = 'VERIFIED';
    });
    (inMemoryState.prescriptions || []).forEach((rx) => {
      if (rx.visitId === invoice.visitId) rx.paymentStatus = 'VERIFIED';
    });

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'VERIFY_PAYMENT',
      entityType: 'INVOICE',
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        verifiedBy: user.name,
      },
    });

    return {
      invoice,
      verification,
    };
  },

  async cancelPayment(paymentId, { reason = '' }, user) {
    const payment = (inMemoryState.payments || []).find((p) => p.id === paymentId || p.paymentNumber === paymentId);
    if (!payment) throw new Error('Payment record not found.');

    if (payment.status === 'CANCELLED') {
      throw new Error('This payment is already cancelled.');
    }

    payment.status = 'CANCELLED';
    payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `Cancelled: ${reason}`;

    const invoice = (inMemoryState.invoices || []).find((i) => i.id === payment.invoiceId);
    if (invoice) {
      invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - payment.amount);
      invoice.balance = Math.max(0, invoice.totalAmount - invoice.paidAmount);

      if (invoice.paidAmount === 0) {
        invoice.status = 'UNPAID';
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }
      invoice.updatedAt = now();

      // Revoke verification on related orders if not fully paid
      if (invoice.balance > 0) {
        (inMemoryState.labRequests || []).forEach((l) => {
          if (l.visitId === invoice.visitId) l.paymentStatus = 'UNPAID';
        });
        (inMemoryState.procedures || []).forEach((p) => {
          if (p.visitId === invoice.visitId) p.paymentStatus = 'UNPAID';
        });
        (inMemoryState.prescriptions || []).forEach((rx) => {
          if (rx.visitId === invoice.visitId) rx.paymentStatus = 'UNPAID';
        });
      }
    }

    await this.createAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CANCEL_PAYMENT',
      entityType: 'PAYMENT',
      entityId: payment.id,
      details: {
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        reason,
      },
    });

    return { payment, invoice };
  },

  // ==========================================
  // PHASE 6: VISIT CLOSURE & SUMMARY ENGINE
  // ==========================================

  async getVisitClosureCheck(visitId) {
    const visit = inMemoryState.visits.find((v) => v.id === visitId);
    if (!visit) throw new Error('Visit encounter not found.');

    const blockers = [];
    const warnings = [];

    // 1. Check Consultation
    const consultation = inMemoryState.consultations.find((c) => c.visitId === visit.id);
    if (!consultation || consultation.status !== 'completed') {
      blockers.push({
        type: 'CONSULTATION_INCOMPLETE',
        title: 'Incomplete OPD Doctor Consultation',
        description: 'Doctor consultation has not been finalized or completed.',
        status: consultation ? consultation.status : 'NOT_STARTED',
      });
    }

    // 2. Check Lab Requests & Results
    const labRequests = (inMemoryState.labRequests || []).filter((l) => l.visitId === visit.id);
    const pendingLabs = labRequests.filter(
      (l) => !['RELEASED_TO_DOCTOR', 'TECHNICIAN_VERIFIED', 'completed', 'CANCELLED'].includes(l.status)
    );
    if (pendingLabs.length > 0) {
      blockers.push({
        type: 'PENDING_LABORATORY',
        title: `${pendingLabs.length} Pending Laboratory Order(s)`,
        description: `Lab test requests (${pendingLabs.map((l) => l.requestNumber).join(', ')}) have not been verified and released.`,
        items: pendingLabs.map((l) => ({ id: l.id, requestNumber: l.requestNumber, status: l.status })),
      });
    }

    // 3. Check Injection Orders & Administrations
    const injectionOrders = (inMemoryState.injectionOrders || []).filter((i) => i.visitId === visit.id);
    const pendingInjections = injectionOrders.filter(
      (i) => !['ADMINISTERED', 'REFUSED', 'HELD', 'CANCELLED'].includes(i.status)
    );
    if (pendingInjections.length > 0) {
      blockers.push({
        type: 'PENDING_INJECTIONS',
        title: `${pendingInjections.length} Unadministered Injection Order(s)`,
        description: `Prescribed injections (${pendingInjections.map((i) => i.medication).join(', ')}) have not been recorded as administered or held.`,
        items: pendingInjections.map((i) => ({ id: i.id, orderNumber: i.orderNumber, medication: i.medication, status: i.status })),
      });
    }

    // 4. Check Procedures
    const procedures = (inMemoryState.procedures || []).filter((p) => p.visitId === visit.id);
    const pendingProcedures = procedures.filter(
      (p) => !['completed', 'CANCELLED'].includes(p.status)
    );
    if (pendingProcedures.length > 0) {
      blockers.push({
        type: 'PENDING_PROCEDURES',
        title: `${pendingProcedures.length} Uncompleted Clinical Procedure(s)`,
        description: `Procedures (${pendingProcedures.map((p) => p.procedureType).join(', ')}) have not been recorded as completed.`,
        items: pendingProcedures.map((p) => ({ id: p.id, procedureNumber: p.procedureNumber, procedureType: p.procedureType, status: p.status })),
      });
    }

    // 5. Check Prescriptions & Pharmacy Dispensing
    const prescriptions = (inMemoryState.prescriptions || []).filter((p) => p.visitId === visit.id);
    const undispensedRx = prescriptions.filter(
      (p) => !['DISPENSED', 'CANCELLED'].includes(p.status)
    );
    if (undispensedRx.length > 0) {
      warnings.push({
        type: 'PENDING_PHARMACY',
        title: `${undispensedRx.length} Prescription(s) Not Yet Dispensed`,
        description: `Prescriptions (${undispensedRx.map((p) => p.prescriptionNumber).join(', ')}) are pending patient pickup at the pharmacy.`,
      });
    }

    // 6. Check Billing & Outstanding Balance
    const invoice = (inMemoryState.invoices || []).find((i) => i.visitId === visit.id);
    if (invoice && invoice.balance > 0 && invoice.status !== 'PAID' && invoice.status !== 'VERIFIED') {
      blockers.push({
        type: 'OUTSTANDING_BALANCE',
        title: `Outstanding Invoice Balance (${invoice.balance} ETB)`,
        description: `Visit invoice #${invoice.invoiceNumber} has an unpaid balance of ${invoice.balance} ETB that must be paid or verified at reception.`,
        balance: invoice.balance,
        invoiceNumber: invoice.invoiceNumber,
      });
    }

    return {
      visit,
      canClose: blockers.length === 0,
      blockers,
      warnings,
      summaryCounts: {
        labCount: labRequests.length,
        injectionCount: injectionOrders.length,
        procedureCount: procedures.length,
        prescriptionCount: prescriptions.length,
        invoiceBalance: invoice?.balance || 0,
      },
    };
  },

  async closeVisit(visitId, { overrideReason = '', notes = '' } = {}, user) {
    const check = await this.getVisitClosureCheck(visitId);
    const visit = check.visit;

    if (visit.status === 'completed') {
      return { visit, message: 'Visit is already closed.' };
    }

    if (!check.canClose && !overrideReason?.trim()) {
      throw new Error(
        `Cannot close visit with ${check.blockers.length} pending clinical orders or unpaid balances without an authorized override reason.`
      );
    }

    visit.status = 'completed';
    visit.closedAt = now();
    visit.closedBy = user?.name || 'Authorized Staff';
    visit.closedById = user?.id || null;
    visit.closureNotes = notes || 'Visit successfully closed and discharged.';
    if (overrideReason?.trim()) {
      visit.overrideReason = overrideReason.trim();
      visit.overrideBy = user?.name;
      visit.overrideAt = now();
    }
    visit.updatedAt = now();

    // Mark Queue completed
    const queueEntry = (inMemoryState.queue || []).find((q) => q.visitId === visit.id && q.status !== 'completed');
    if (queueEntry) {
      queueEntry.status = 'completed';
    }

    // Mark Consultation completed if still in progress
    const consultation = (inMemoryState.consultations || []).find((c) => c.visitId === visit.id);
    if (consultation && consultation.status !== 'completed') {
      consultation.status = 'completed';
      consultation.updatedAt = now();
    }

    // Audit logging
    await this.createAuditLog({
      userId: user?.id || null,
      userName: user?.name || 'Staff',
      action: overrideReason?.trim() ? 'OVERRIDE_VISIT_CLOSURE' : 'CLOSE_VISIT',
      entityType: 'VISIT',
      entityId: visit.id,
      details: {
        visitNumber: visit.visitNumber,
        patientId: visit.patientId,
        patientName: visit.patientName,
        overrideReason: overrideReason || null,
        notes: visit.closureNotes,
        blockersCount: check.blockers.length,
      },
    });

    return {
      visit,
      check,
      message: overrideReason?.trim()
        ? 'Visit closed with authorized override.'
        : 'Visit successfully completed and closed.',
    };
  },

  async getVisitSummary(visitId) {
    const visit = inMemoryState.visits.find((v) => v.id === visitId);
    if (!visit) throw new Error('Visit encounter not found.');

    const patient = inMemoryState.patients.find((p) => p.id === visit.patientId);
    const consultation = inMemoryState.consultations.find((c) => c.visitId === visit.id);
    const labRequests = (inMemoryState.labRequests || []).filter((l) => l.visitId === visit.id);
    const labResults = (inMemoryState.labResults || []).filter((r) => r.visitId === visit.id);
    const injectionOrders = (inMemoryState.injectionOrders || []).filter((i) => i.visitId === visit.id);
    const procedures = (inMemoryState.procedures || []).filter((p) => p.visitId === visit.id);
    const prescriptions = (inMemoryState.prescriptions || []).filter((p) => p.visitId === visit.id);
    const invoice = (inMemoryState.invoices || []).find((i) => i.visitId === visit.id);
    const payments = invoice ? (inMemoryState.payments || []).filter((p) => p.invoiceId === invoice.id) : [];

    return {
      visit,
      patient: patient ? { ...patient, age: computeAge(patient.dateOfBirth) } : null,
      consultation: consultation || null,
      vitals: consultation?.vitals || null,
      labRequests,
      labResults,
      injectionOrders,
      procedures,
      prescriptions,
      invoice: invoice || null,
      payments,
      isClosed: visit.status === 'completed',
      closedAt: visit.closedAt || null,
      closedBy: visit.closedBy || null,
      closureNotes: visit.closureNotes || null,
      overrideReason: visit.overrideReason || null,
    };
  },

  // ==========================================
  // PHASE 6: MASTER CATALOG & ADMIN ENGINE
  // ==========================================

  async listDepartmentsCatalog() {
    return inMemoryState.departments || [];
  },

  async addDepartmentCatalog(name, user) {
    if (!name?.trim()) throw new Error('Department name is required.');
    const dept = name.trim();
    if (!inMemoryState.departments.includes(dept)) {
      inMemoryState.departments.push(dept);
      await this.createAuditLog({
        userId: user?.id,
        userName: user?.name,
        action: 'CREATE_DEPARTMENT',
        entityType: 'CATALOG',
        entityId: dept,
        details: { name: dept },
      });
    }
    return inMemoryState.departments;
  },

  async deleteDepartmentCatalog(name, user) {
    inMemoryState.departments = (inMemoryState.departments || []).filter((d) => d !== name);
    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'DELETE_DEPARTMENT',
      entityType: 'CATALOG',
      entityId: name,
      details: { name },
    });
    return inMemoryState.departments;
  },

  async listLabTestsCatalog() {
    return inMemoryState.labTests || [];
  },

  async createLabTestCatalog(data, user) {
    const id = `LT-${String((inMemoryState.labTests?.length || 0) + 1).padStart(2, '0')}`;
    const newTest = {
      id,
      code: data.code || `TEST_${id}`,
      name: data.name,
      group: data.group || 'General',
      unit: data.unit || '',
      referenceRange: data.referenceRange || '',
      specimenType: data.specimenType || 'Whole Blood',
      price: Number(data.price) || 100,
    };
    inMemoryState.labTests.push(newTest);
    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'CREATE_LAB_TEST_CATALOG',
      entityType: 'CATALOG',
      entityId: newTest.id,
      details: newTest,
    });
    return newTest;
  },

  async updateLabTestCatalog(id, data, user) {
    const test = (inMemoryState.labTests || []).find((t) => t.id === id);
    if (!test) throw new Error('Lab test not found.');
    if (data.name !== undefined) test.name = data.name;
    if (data.code !== undefined) test.code = data.code;
    if (data.group !== undefined) test.group = data.group;
    if (data.unit !== undefined) test.unit = data.unit;
    if (data.referenceRange !== undefined) test.referenceRange = data.referenceRange;
    if (data.specimenType !== undefined) test.specimenType = data.specimenType;
    if (data.price !== undefined) test.price = Number(data.price);

    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'UPDATE_LAB_TEST_CATALOG',
      entityType: 'CATALOG',
      entityId: test.id,
      details: test,
    });
    return test;
  },

  async deleteLabTestCatalog(id, user) {
    inMemoryState.labTests = (inMemoryState.labTests || []).filter((t) => t.id !== id);
    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'DELETE_LAB_TEST_CATALOG',
      entityType: 'CATALOG',
      entityId: id,
      details: { id },
    });
    return true;
  },

  async listMedicinesCatalog() {
    return inMemoryState.medicines || [];
  },

  async createMedicineCatalog(data, user) {
    const id = `MD-${String((inMemoryState.medicines?.length || 0) + 1).padStart(2, '0')}`;
    const newMed = {
      id,
      name: data.name,
      form: data.form || 'Tablet',
      defaultDosage: data.defaultDosage || '1 unit',
      defaultRoute: data.defaultRoute || 'Oral',
      price: Number(data.price) || 50,
    };
    inMemoryState.medicines.push(newMed);
    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'CREATE_MEDICINE_CATALOG',
      entityType: 'CATALOG',
      entityId: newMed.id,
      details: newMed,
    });
    return newMed;
  },

  async updateMedicineCatalog(id, data, user) {
    const med = (inMemoryState.medicines || []).find((m) => m.id === id);
    if (!med) throw new Error('Medicine item not found.');
    if (data.name !== undefined) med.name = data.name;
    if (data.form !== undefined) med.form = data.form;
    if (data.defaultDosage !== undefined) med.defaultDosage = data.defaultDosage;
    if (data.defaultRoute !== undefined) med.defaultRoute = data.defaultRoute;
    if (data.price !== undefined) med.price = Number(data.price);

    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'UPDATE_MEDICINE_CATALOG',
      entityType: 'CATALOG',
      entityId: med.id,
      details: med,
    });
    return med;
  },

  async deleteMedicineCatalog(id, user) {
    inMemoryState.medicines = (inMemoryState.medicines || []).filter((m) => m.id !== id);
    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'DELETE_MEDICINE_CATALOG',
      entityType: 'CATALOG',
      entityId: id,
      details: { id },
    });
    return true;
  },

  async listProcedureTypesCatalog() {
    return inMemoryState.procedureTypes || [];
  },

  async createProcedureTypeCatalog(data, user) {
    const id = `PR-${String((inMemoryState.procedureTypes?.length || 0) + 1).padStart(2, '0')}`;
    const newProc = {
      id,
      name: data.name,
      price: Number(data.price) || 100,
    };
    inMemoryState.procedureTypes.push(newProc);
    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'CREATE_PROCEDURE_CATALOG',
      entityType: 'CATALOG',
      entityId: newProc.id,
      details: newProc,
    });
    return newProc;
  },

  async updateProcedureTypeCatalog(id, data, user) {
    const proc = (inMemoryState.procedureTypes || []).find((p) => p.id === id);
    if (!proc) throw new Error('Procedure type not found.');
    if (data.name !== undefined) proc.name = data.name;
    if (data.price !== undefined) proc.price = Number(data.price);

    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'UPDATE_PROCEDURE_CATALOG',
      entityType: 'CATALOG',
      entityId: proc.id,
      details: proc,
    });
    return proc;
  },

  async deleteProcedureTypeCatalog(id, user) {
    inMemoryState.procedureTypes = (inMemoryState.procedureTypes || []).filter((p) => p.id !== id);
    await this.createAuditLog({
      userId: user?.id,
      userName: user?.name,
      action: 'DELETE_PROCEDURE_CATALOG',
      entityType: 'CATALOG',
      entityId: id,
      details: { id },
    });
    return true;
  },

  // ==========================================
  // PHASE 6: REPORTING & ANALYTICS QUERIES
  // ==========================================

  async dailyRevenueReport(date) {
    const targetDate = date || toDateKey(now());
    const payments = (inMemoryState.payments || []).filter(
      (p) => p.status !== 'CANCELLED' && toDateKey(p.createdAt || p.receivedAt) === targetDate
    );

    const invoices = (inMemoryState.invoices || []).filter(
      (i) => toDateKey(i.createdAt) === targetDate
    );

    const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const byMethod = { CASH: 0, TELEBIRR: 0, CBE_BIRR: 0, BANK_TRANSFER: 0, OTHER: 0 };
    payments.forEach((p) => {
      const m = p.paymentMethod || 'CASH';
      byMethod[m] = (byMethod[m] || 0) + p.amount;
    });

    const byCashier = {};
    payments.forEach((p) => {
      const c = p.receivedBy || 'Main Cashier';
      byCashier[c] = (byCashier[c] || 0) + p.amount;
    });

    // Breakdown by department services
    const byCategory = { Consultation: 0, Laboratory: 0, Procedures: 0, Injections: 0, Pharmacy: 0, Other: 0 };
    (inMemoryState.invoiceItems || []).forEach((item) => {
      const inv = invoices.find((i) => i.id === item.invoiceId);
      if (inv) {
        const cat = item.serviceType === 'CONSULTATION' ? 'Consultation'
          : item.serviceType === 'LABORATORY' ? 'Laboratory'
          : item.serviceType === 'PROCEDURE' ? 'Procedures'
          : item.serviceType === 'INJECTION' ? 'Injections'
          : item.serviceType === 'PHARMACY' ? 'Pharmacy'
          : 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + (item.totalPrice || 0);
      }
    });

    return {
      date: targetDate,
      totalCollected,
      totalInvoiced,
      paymentCount: payments.length,
      invoiceCount: invoices.length,
      byMethod,
      byCashier,
      byCategory,
      payments,
    };
  },

  async labWorkloadReport(date) {
    const targetDate = date || toDateKey(now());
    const samples = (inMemoryState.labSamples || []).filter(
      (s) => toDateKey(s.createdAt || s.collectedAt) === targetDate
    );
    const results = (inMemoryState.labResults || []).filter(
      (r) => toDateKey(r.verifiedAt || r.createdAt) === targetDate
    );

    const totalTestsRun = results.reduce((sum, r) => sum + (r.results?.length || 0), 0);
    const byAnalyzer = { MANUAL: 0 };
    (inMemoryState.labDevices || []).forEach((d) => {
      byAnalyzer[d.name] = 0;
    });

    results.forEach((r) => {
      const dev = r.analyzerName || 'Manual Entry / Standard Lab';
      byAnalyzer[dev] = (byAnalyzer[dev] || 0) + (r.results?.length || 1);
    });

    const byGroup = {};
    results.forEach((r) => {
      (r.results || []).forEach((res) => {
        const grp = res.group || 'Routine';
        byGroup[grp] = (byGroup[grp] || 0) + 1;
      });
    });

    return {
      date: targetDate,
      samplesCollected: samples.length,
      resultsVerified: results.length,
      totalTestsRun,
      byAnalyzer,
      byGroup,
      results,
    };
  },

  // Direct access getters for catalog routes
  get medicines() {
    return inMemoryState.medicines;
  },
  get procedureTypes() {
    return inMemoryState.procedureTypes;
  },
  get departments() {
    return inMemoryState.departments;
  },
  get labTests() {
    return inMemoryState.labTests;
  },
  get users() {
    return inMemoryState.users;
  },
  get patients() {
    return inMemoryState.patients;
  },
  get visits() {
    return inMemoryState.visits;
  },
  get queue() {
    return inMemoryState.queue;
  },
  get consultations() {
    return inMemoryState.consultations;
  },
  get labRequests() {
    return inMemoryState.labRequests;
  },
  get labResults() {
    return inMemoryState.labResults;
  },
  get procedures() {
    return inMemoryState.procedures;
  },
  get prescriptions() {
    return inMemoryState.prescriptions;
  },
  get invoices() {
    return inMemoryState.invoices || [];
  },
  get invoiceItems() {
    return inMemoryState.invoiceItems || [];
  },
  get payments() {
    return inMemoryState.payments || [];
  },
  get paymentVerifications() {
    return inMemoryState.paymentVerifications || [];
  },
  get labSamples() {
    return inMemoryState.labSamples || [];
  },
  get labDevices() {
    return inMemoryState.labDevices || [];
  },

  async resetDatabase() {
    inMemoryState = buildSeed();
    seedAllCounters();
    return true;
  },
};

export function resetDb() {
  return db.resetDatabase();
}

export { prisma };
export { isPostgresConnected, prisma };
export default db;
