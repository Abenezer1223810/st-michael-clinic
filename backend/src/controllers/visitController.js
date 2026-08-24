import { db } from '../data/store.js';
import { nextVisitNumber } from '../utils/idGenerator.js';
import { computeAge, now, toDateKey } from '../utils/helpers.js';

export const listVisits = (req, res) => {
  const { patientId, date } = req.query;
  let visits = [...db.visits].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (patientId) visits = visits.filter((v) => v.patientId === patientId);
  if (date) visits = visits.filter((v) => toDateKey(v.date) === date);
  const enriched = visits.map((v) => {
    const p = db.patients.find((pt) => pt.id === v.patientId);
    return { ...v, patient: p ? { ...p, age: computeAge(p.dateOfBirth) } : null };
  });
  res.json({ visits: enriched });
};

export const getVisit = (req, res) => {
  const visit = db.visits.find((v) => v.id === req.params.id);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });
  const patient = db.patients.find((p) => p.id === visit.patientId);
  const queueEntry = db.queue.find((q) => q.visitId === visit.id);
  const consultation = db.consultations.find((c) => c.visitId === visit.id) || null;
  const labRequests = db.labRequests.filter((l) => l.visitId === visit.id);
  const procedures = db.procedures.filter((p) => p.visitId === visit.id);
  const prescriptions = db.prescriptions.filter((p) => p.visitId === visit.id);
  res.json({
    visit: {
      ...visit,
      patient: patient ? { ...patient, age: computeAge(patient.dateOfBirth) } : null,
    },
    queueEntry: queueEntry || null,
    consultation,
    labRequests,
    procedures,
    prescriptions,
  });
};

export const createVisit = (req, res) => {
  const { patientId, service, reason } = req.body || {};
  if (!patientId) return res.status(400).json({ message: 'Patient is required.' });
  if (!service) return res.status(400).json({ message: 'Department / service is required.' });

  const patient = db.patients.find((p) => p.id === patientId);
  if (!patient) return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });

  const num = nextVisitNumber();
  const visit = {
    id: `V-${num.slice(3)}`,
    visitNumber: num,
    patientId: patient.id,
    patientName: patient.fullName,
    service,
    reason: reason || '',
    date: now(),
    createdAt: now(),
    status: 'active',
  };
  db.visits.push(visit);
  res.status(201).json({
    visit,
    message: 'Visit created successfully.',
  });
};
