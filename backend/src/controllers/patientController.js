import { db } from '../data/store.js';
import { nextPatientId } from '../utils/idGenerator.js';
import { computeAge, now, formatDate } from '../utils/helpers.js';

const ALLERGY_CATEGORIES = ['Drug', 'Food', 'Environmental'];
const ALLERGY_SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];

const normalizeAllergies = (allergies) => {
  if (!Array.isArray(allergies)) return [];
  return allergies
    .filter((a) => a && (a.name || a.category))
    .map((a) => ({
      category: ALLERGY_CATEGORIES.includes(a.category) ? a.category : '',
      name: String(a.name || '').trim(),
      severity: ALLERGY_SEVERITIES.includes(a.severity) ? a.severity : 'Mild',
      reaction: String(a.reaction || '').trim(),
    }))
    .filter((a) => a.name);
};

export const listPatients = (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  let patients = [...db.patients].sort(
    (a, b) => new Date(b.registrationDate) - new Date(a.registrationDate)
  );
  if (q) {
    patients = patients.filter((p) =>
      [p.id, p.fullName, p.phone].some((f) => f.toLowerCase().includes(q))
    );
  }
  const enriched = patients.map((p) => {
    const pv = db.visits
      .filter((v) => v.patientId === p.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const pc = db.consultations
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
  res.json({ patients: enriched });
};

export const getPatient = (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });
  }
  res.json({ patient: { ...patient, age: computeAge(patient.dateOfBirth) } });
};

export const createPatient = (req, res) => {
  const { fullName, gender, dateOfBirth, age, phone, address, emergencyContactName, emergencyContactPhone, relationshipToPatient, allergies } = req.body || {};
  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (!gender) {
    return res.status(400).json({ message: 'Gender is required.' });
  }
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }
  let dob = dateOfBirth || null;
  if (!dob && age) {
    const year = new Date().getFullYear() - Number(age);
    dob = `${year}-01-01`;
  }
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return res.status(400).json({ message: 'Date of birth must be YYYY-MM-DD.' });
  }
  const id = nextPatientId();
  const patient = {
    id,
    fullName: String(fullName).trim(),
    gender,
    dateOfBirth: dob,
    phone: String(phone).trim(),
    address: address || '',
    emergencyContactName: String(emergencyContactName || '').trim(),
    emergencyContactPhone: String(emergencyContactPhone || '').trim(),
    relationshipToPatient: String(relationshipToPatient || '').trim(),
    allergies: normalizeAllergies(allergies),
    registrationDate: now(),
    createdAt: now(),
  };
  db.patients.push(patient);
  res.status(201).json({ patient: { ...patient, age: computeAge(dob) }, message: 'Patient registered successfully.' });
};

export const getPatientHistory = (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });
  }
  const visits = db.visits
    .filter((v) => v.patientId === patient.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const visitIds = visits.map((v) => v.id);

  const consultations = db.consultations
    .filter((c) => c.patientId === patient.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const laboratory = db.labRequests
    .filter((l) => l.patientId === patient.id)
    .map((l) => {
      const result = db.labResults.find((r) => r.requestId === l.id);
      return { ...l, result: result || null };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const procedures = db.procedures
    .filter((p) => p.patientId === patient.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const prescriptions = db.prescriptions
    .filter((p) => p.patientId === patient.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const activeVisit = visits.find((v) => v.status === 'active');
  const activeQueue = activeVisit
    ? db.queue.find((q) => q.visitId === activeVisit.id && q.status !== 'completed')
    : null;

  res.json({
    patient: { ...patient, age: computeAge(patient.dateOfBirth), registrationDate: formatDate(patient.registrationDate) },
    visits,
    consultations,
    laboratory,
    procedures,
    prescriptions,
    activeVisit: activeVisit || null,
    activeQueue: activeQueue || null,
    visitCount: visits.length,
  });
};
