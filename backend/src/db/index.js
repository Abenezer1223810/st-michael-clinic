import pkg from '@prisma/client';
const PrismaClient = pkg?.PrismaClient || pkg?.default?.PrismaClient;
import { buildSeed } from '../data/seed.js';
import { computeAge, toDateKey, isToday, now, formatDate, waitingMinutes } from '../utils/helpers.js';
import { nextPatientId, nextVisitNumber, nextQueueNumber, nextConsultationNumber, nextLaboratoryRequestNumber, nextProcedureNumber, nextPrescriptionNumber, nextUserId, resetCounters } from '../utils/idGenerator.js';
import { parseAnalyzerPayload, DEFAULT_DEVICE_MAPPINGS } from '../services/analyzerParser.js';

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

export const db = {
  get isPostgres() {
    return isPostgresConnected;
  },

  // ---------------------------------------------------------------- AUTH & USERS
  async findUserByUsername(username) {
    const uname = String(username || '').toLowerCase().trim();
    if (isPostgresConnected) {
      try {
        const u = await prisma.user.findFirst({
          where: { username: { equals: uname, mode: 'insensitive' } },
        });
        if (u) return u;
      } catch (e) {
        console.warn('PG query fallback:', e.message);
      }
    }
    return inMemoryState.users.find((u) => u.username.toLowerCase() === uname) || null;
  },

  async findUserById(id) {
    if (isPostgresConnected) {
      try {
        const u = await prisma.user.findUnique({ where: { id } });
        if (u) return u;
      } catch (e) {
        console.warn('PG query fallback:', e.message);
      }
    }
    return inMemoryState.users.find((u) => u.id === id) || null;
  },

  async listUsers() {
    if (isPostgresConnected) {
      try {
        return await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
      } catch (e) {
        console.warn('PG query fallback:', e.message);
      }
    }
    return [...inMemoryState.users];
  },

  async createUser(data) {
    const id = data.id || nextUserId();
    const record = {
      id,
      username: data.username,
      password: data.password,
      name: data.name,
      title: data.title || '',
      role: data.role,
      banned: false,
      createdAt: new Date(),
    };
    if (isPostgresConnected) {
      try {
        await prisma.user.create({ data: record });
      } catch (e) {
        console.warn('PG create fallback:', e.message);
      }
    }
    inMemoryState.users.push(record);
    return record;
  },

  async updateUser(id, updates) {
    if (isPostgresConnected) {
      try {
        await prisma.user.update({ where: { id }, data: updates });
      } catch (e) {
        console.warn('PG update fallback:', e.message);
      }
    }
    const user = inMemoryState.users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  },

  async deleteUser(id) {
    if (isPostgresConnected) {
      try {
        await prisma.user.delete({ where: { id } });
      } catch (e) {
        console.warn('PG delete fallback:', e.message);
      }
    }
    const idx = inMemoryState.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      inMemoryState.users.splice(idx, 1);
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
        [p.id, p.fullName, p.phone].some((f) => (f || '').toLowerCase().includes(query))
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
    const patient = inMemoryState.patients.find((p) => p.id === id);
    if (!patient) return null;
    return { ...patient, age: computeAge(patient.dateOfBirth) };
  },

  async createPatient(data) {
    const id = nextPatientId();
    const record = {
      id,
      fullName: String(data.fullName).trim(),
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || null,
      phone: String(data.phone).trim(),
      address: data.address || '',
      emergencyContactName: String(data.emergencyContactName || '').trim(),
      emergencyContactPhone: String(data.emergencyContactPhone || '').trim(),
      relationshipToPatient: String(data.relationshipToPatient || '').trim(),
      allergies: data.allergies || [],
      registrationDate: now(),
      createdAt: now(),
    };

    if (isPostgresConnected) {
      try {
        await prisma.patient.create({
          data: {
            ...record,
            registrationDate: new Date(record.registrationDate),
            createdAt: new Date(record.createdAt),
          },
        });
      } catch (e) {
        console.warn('PG create patient fallback:', e.message);
      }
    }

    inMemoryState.patients.push(record);
    return { ...record, age: computeAge(record.dateOfBirth) };
  },

  async getPatientHistory(id) {
    const patient = inMemoryState.patients.find((p) => p.id === id);
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
      .sort((a, b) => new Date(b.date) - new Date(a.date));

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
      activeVisit: activeVisit || null,
      activeQueue: activeQueue || null,
      visitCount: visits.length,
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
    };
  },

  async createVisit(data) {
    const patient = inMemoryState.patients.find((p) => p.id === data.patientId);
    if (!patient) return null;

    const num = nextVisitNumber();
    const visit = {
      id: `V-${num.slice(3)}`,
      visitNumber: num,
      patientId: patient.id,
      patientName: patient.fullName,
      service: data.service,
      reason: data.reason || '',
      date: now(),
      createdAt: now(),
      status: 'active',
    };

    if (isPostgresConnected) {
      try {
        await prisma.visit.create({
          data: {
            ...visit,
            date: new Date(visit.date),
            createdAt: new Date(visit.createdAt),
          },
        });
      } catch (e) {
        console.warn('PG create visit fallback:', e.message);
      }
    }

    inMemoryState.visits.push(visit);
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

  async addToQueue(visitId) {
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
      time: now(),
      date: toDateKey(now()),
      status: 'waiting',
    };

    if (isPostgresConnected) {
      try {
        await prisma.queue.create({
          data: {
            ...entry,
            time: new Date(entry.time),
          },
        });
      } catch (e) {
        console.warn('PG create queue fallback:', e.message);
      }
    }

    inMemoryState.queue.push(entry);
    return { entry };
  },

  async updateQueueStatus(id, status) {
    const entry = inMemoryState.queue.find((q) => q.id === id);
    if (!entry) return null;

    entry.status = status;
    if (status === 'completed') {
      const visit = inMemoryState.visits.find((v) => v.id === entry.visitId);
      if (visit) visit.status = 'completed';
    }

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.queue.update({ where: { id }, data: { status } });
          if (status === 'completed') {
            await tx.visit.update({ where: { id: entry.visitId }, data: { status: 'completed' } });
          }
        });
      } catch (e) {
        console.warn('PG update queue fallback:', e.message);
      }
    }

    return entry;
  },

  // ---------------------------------------------------------------- OPD & CONSULTATION
  async getOpdQueue() {
    const today = new Date().toISOString().slice(0, 10);
    const queue = [...inMemoryState.queue]
      .filter((q) => q.date.startsWith(today) && q.status !== 'completed')
      .sort((a, b) => Number(a.queueNumber) - Number(b.queueNumber))
      .map((q) => ({
        ...q,
        patient: inMemoryState.patients.find((pt) => pt.id === q.patientId) || null,
        waitingMinutes: waitingMinutes(q.time),
      }));
    return queue;
  },

  async getConsultation(id) {
    const consultation = inMemoryState.consultations.find((c) => c.id === id);
    if (!consultation) return null;
    const visit = inMemoryState.visits.find((v) => v.id === consultation.visitId);
    const patient = inMemoryState.patients.find((pt) => pt.id === consultation.patientId) || null;
    return { consultation, visit: visit || null, patient };
  },

  async listConsultationsByPatient(patientId) {
    return inMemoryState.consultations
      .filter((c) => c.patientId === patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async createConsultation(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    const num = nextConsultationNumber();
    const consultation = {
      id: `C-${num.slice(3)}`,
      consultationNumber: num,
      visitId: visit.id,
      visitNumber: visit.visitNumber,
      patientId: visit.patientId,
      patientName: visit.patientName,
      doctor: user.name,
      doctorId: user.id,
      date: now(),
      status: 'in_progress',
      vitals: data.vitals || {},
      chiefComplaint: data.chiefComplaint || '',
      medicalHistory: data.medicalHistory || '',
      clinicalExamination: data.clinicalExamination || '',
      diagnosis: data.diagnosis || '',
      treatmentRecommendation: data.treatmentRecommendation || '',
      doctorNotes: data.doctorNotes || '',
      followUp: data.followUp || '',
      referral: data.referral || null,
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
            },
          });
          if (queueEntry) {
            await tx.queue.update({ where: { id: queueEntry.id }, data: { status: 'in_consultation' } });
          }
        });
      } catch (e) {
        console.warn('PG create consultation fallback:', e.message);
      }
    }

    return consultation;
  },

  async updateConsultation(id, updates) {
    const consultation = inMemoryState.consultations.find((c) => c.id === id);
    if (!consultation) return null;

    const fields = [
      'vitals', 'chiefComplaint', 'medicalHistory', 'clinicalExamination',
      'diagnosis', 'treatmentRecommendation', 'doctorNotes', 'followUp', 'referral',
    ];
    for (const f of fields) {
      if (updates[f] !== undefined) consultation[f] = updates[f];
    }

    if (isPostgresConnected) {
      try {
        const clean = {};
        for (const f of fields) {
          if (updates[f] !== undefined) clean[f] = updates[f];
        }
        await prisma.consultation.update({ where: { id }, data: clean });
      } catch (e) {
        console.warn('PG update consultation fallback:', e.message);
      }
    }

    return consultation;
  },

  async completeConsultation(id) {
    const consultation = inMemoryState.consultations.find((c) => c.id === id);
    if (!consultation) return null;

    consultation.status = 'completed';
    const visit = inMemoryState.visits.find((v) => v.id === consultation.visitId);
    if (visit) visit.status = 'completed';
    const queueEntry = inMemoryState.queue.find((q) => q.visitId === consultation.visitId && q.status !== 'completed');
    if (queueEntry) queueEntry.status = 'completed';

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.consultation.update({ where: { id }, data: { status: 'completed' } });
          if (visit) await tx.visit.update({ where: { id: visit.id }, data: { status: 'completed' } });
          if (queueEntry) await tx.queue.update({ where: { id: queueEntry.id }, data: { status: 'completed' } });
        });
      } catch (e) {
        console.warn('PG complete consultation fallback:', e.message);
      }
    }

    return consultation;
  },

  // ---------------------------------------------------------------- LABORATORY
  async getTestCatalog() {
    return inMemoryState.labTests;
  },

  async listLabRequests(status) {
    let requests = [...inMemoryState.labRequests].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (status) requests = requests.filter((r) => r.status === status);
    return requests.map((r) => {
      const patient = inMemoryState.patients.find((p) => p.id === r.patientId);
      const result = inMemoryState.labResults.find((x) => x.requestId === r.id);
      return { ...r, patient: patient || null, result: result || null };
    });
  },

  async getLabRequest(id) {
    const r = inMemoryState.labRequests.find((x) => x.id === id);
    if (!r) return null;
    const patient = inMemoryState.patients.find((p) => p.id === r.patientId);
    const result = inMemoryState.labResults.find((x) => x.requestId === r.id);
    return { ...r, patient: patient || null, result: result || null };
  },

  async createLabRequest(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    const tests = data.testIds
      .map((id) => inMemoryState.labTests.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({ id: t.id, name: t.name, unit: t.unit, referenceRange: t.referenceRange }));

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
      status: 'pending',
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

    return request;
  },

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
        status: 'pending',
        date: now(),
        enteredAt: null,
        verifiedAt: null,
        enteredBy: null,
        verifiedBy: null,
        results: request.tests.map((t) => ({
          testId: t.id,
          testName: t.name,
          unit: t.unit,
          referenceRange: t.referenceRange,
          result: '',
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
    return { result, request: { ...request, patient: patient || null, result } };
  },

  async enterLabResults(requestId, resultsArray, user) {
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
        date: now(),
        enteredAt: null,
        verifiedAt: null,
        enteredBy: null,
        verifiedBy: null,
        results: [],
      };
      inMemoryState.labResults.push(result);
    }

    result.results = request.tests.map((t) => {
      const incoming = resultsArray.find((x) => x.testId === t.id);
      return {
        testId: t.id,
        testName: t.name,
        unit: t.unit,
        referenceRange: t.referenceRange,
        result: incoming?.result ?? '',
        remarks: incoming?.remarks ?? '',
        status: 'entered',
      };
    });
    result.status = 'entered';
    result.enteredBy = user.name;
    result.enteredAt = now();
    if (request.status === 'pending') request.status = 'in_progress';

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.labResult.upsert({
            where: { requestId: request.id },
            update: {
              results: result.results,
              status: 'entered',
              enteredBy: user.name,
              enteredAt: new Date(result.enteredAt),
            },
            create: {
              ...result,
              date: new Date(result.date),
              enteredAt: new Date(result.enteredAt),
            },
          });
          if (request.status === 'in_progress') {
            await tx.labRequest.update({ where: { id: request.id }, data: { status: 'in_progress' } });
          }
        });
      } catch (e) {
        console.warn('PG enter lab results fallback:', e.message);
      }
    }

    return result;
  },

  async verifyLabResult(requestId, user) {
    const request = inMemoryState.labRequests.find((r) => r.id === requestId);
    if (!request) return { error: 'Laboratory request not found.', status: 404 };

    const result = inMemoryState.labResults.find((x) => x.requestId === request.id);
    if (!result) return { error: 'No results entered yet.', status: 400 };

    result.status = 'verified';
    result.verifiedBy = user.name;
    result.verifiedAt = now();
    result.results = result.results.map((r) => ({ ...r, status: 'verified' }));
    request.status = 'completed';

    if (isPostgresConnected) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.labResult.update({
            where: { requestId: request.id },
            data: {
              status: 'verified',
              verifiedBy: user.name,
              verifiedAt: new Date(result.verifiedAt),
              results: result.results,
            },
          });
          await tx.labRequest.update({
            where: { id: request.id },
            data: { status: 'completed' },
          });
        });
      } catch (e) {
        console.warn('PG verify lab result fallback:', e.message);
      }
    }

    return { result };
  },

  // ---------------------------------------------------------------- LAB INSTRUMENTS & ANALYZERS
  async listDevices() {
    if (isPostgresConnected) {
      try {
        return await prisma.labDevice.findMany();
      } catch (e) {
        console.warn('PG list devices fallback:', e.message);
      }
    }
    return [
      {
        id: 'DEV-CBC-01',
        name: 'Mindray BC-5000 / Sysmex XN-550 (Hematology / CBC Analyzer)',
        type: 'hematology_cbc',
        protocol: 'HL7_V2',
        status: 'online',
        mappings: { HGB: 'LT-01', HB: 'LT-01', WBC: 'LT-02', PLT: 'LT-03' },
      },
      {
        id: 'DEV-CHEM-01',
        name: 'Roche Cobas c311 / Mindray BS-240 (Clinical Chemistry Analyzer)',
        type: 'clinical_chemistry',
        protocol: 'ASTM_1394',
        status: 'online',
        mappings: { GLU: 'LT-04', FBS: 'LT-04', RBS: 'LT-05', CHOL: 'LT-06', CREA: 'LT-07', ALT: 'LT-08' },
      },
    ];
  },

  async ingestAnalyzerData(payload, user = { name: 'Automated Analyzer' }) {
    const parsed = parseAnalyzerPayload(payload);
    const { sampleId, patientId, instrumentId, instrumentName, observations } = parsed;

    // Find pending request by sample ID or request number or patient ID
    let request = inMemoryState.labRequests.find(
      (r) => (r.id === sampleId || r.requestNumber === sampleId || (patientId && r.patientId === patientId)) && r.status !== 'completed'
    );

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

    // Match tests
    const formattedResults = [];
    for (const test of request.tests) {
      const match = observations.find((o) => {
        const mappedId = DEFAULT_DEVICE_MAPPINGS[o.code] || o.code;
        return mappedId === test.id || o.name.toLowerCase().includes(test.name.toLowerCase());
      });

      if (match) {
        formattedResults.push({
          testId: test.id,
          testName: test.name,
          unit: match.units || test.unit,
          referenceRange: match.referenceRange || test.referenceRange,
          result: match.value,
          remarks: match.flag ? `Machine Flag: ${match.flag}` : 'Imported from analyzer',
          status: 'entered',
        });
      }
    }

    const updated = await this.enterLabResults(request.id, formattedResults, { name: instrumentName || user.name });

    return {
      matched: true,
      requestId: request.id,
      patientId: request.patientId,
      instrumentName,
      resultsCount: formattedResults.length,
      result: updated,
    };
  },

  // ---------------------------------------------------------------- PROCEDURES
  async listProcedures(status) {
    let procedures = [...inMemoryState.procedures].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (status) procedures = procedures.filter((p) => p.status === status);
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

  // ---------------------------------------------------------------- PRESCRIPTIONS
  async listPrescriptions(patientId) {
    let prescriptions = [...inMemoryState.prescriptions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (patientId) prescriptions = prescriptions.filter((p) => p.patientId === patientId);
    return prescriptions.map((p) => {
      const patient = inMemoryState.patients.find((x) => x.id === p.patientId);
      return { ...p, patient: patient || null };
    });
  },

  async getPrescription(id) {
    const prescription = inMemoryState.prescriptions.find((p) => p.id === id);
    if (!prescription) return null;
    const patient = inMemoryState.patients.find((x) => x.id === prescription.patientId);
    return { ...prescription, patient: patient || null };
  },

  async createPrescription(data, user) {
    const visit = inMemoryState.visits.find((v) => v.id === data.visitId);
    if (!visit) return null;

    const clean = data.medicines.map((m) => {
      const cat = inMemoryState.medicines.find((x) => x.name === m.medicine);
      return {
        medicine: m.medicine || '',
        dosage: m.dosage || cat?.defaultDosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        route: m.route || cat?.defaultRoute || 'Oral',
        instructions: m.instructions || '',
        notes: m.notes || '',
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
      date: now(),
      medicines: clean,
      status: 'completed',
    };

    inMemoryState.prescriptions.push(prescription);

    if (isPostgresConnected) {
      try {
        await prisma.prescription.create({
          data: {
            ...prescription,
            date: new Date(prescription.date),
          },
        });
      } catch (e) {
        console.warn('PG create prescription fallback:', e.message);
      }
    }

    return prescription;
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
};

export function resetDb() {
  return db.resetDatabase();
}

export { prisma };
export default db;
