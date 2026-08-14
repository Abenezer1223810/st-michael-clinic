import { db } from '../data/store.js';
import { nextPatientId } from '../utils/idGenerator.js';
import { computeAge, now, formatDate } from '../utils/helpers.js';

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
  res.json({
    patients: patients.map((p) => ({
      ...p,
      age: computeAge(p.dateOfBirth),
    })),
  });
};

export const getPatient = (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found.' });
  }
  res.json({ patient: { ...patient, age: computeAge(patient.dateOfBirth) } });
};

export const createPatient = (req, res) => {
  const { fullName, gender, dateOfBirth, age, phone, address } = req.body || {};
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
    registrationDate: now(),
    createdAt: now(),
  };
  db.patients.push(patient);
  res.status(201).json({ patient: { ...patient, age: computeAge(dob) }, message: 'Patient registered successfully.' });
};

export const getPatientHistory = (req, res) => {
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found.' });
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
