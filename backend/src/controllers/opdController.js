import { db } from '../data/store.js';
import { nextConsultationNumber } from '../utils/idGenerator.js';
import { now, waitingMinutes } from '../utils/helpers.js';

const enrichPatient = (patientId) => {
  const p = db.patients.find((pt) => pt.id === patientId);
  return p || null;
};

export const getOpdQueue = (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const queue = [...db.queue]
    .filter((q) => q.date.startsWith(today) && q.status !== 'completed')
    .sort((a, b) => Number(a.queueNumber) - Number(b.queueNumber))
    .map((q) => ({
      ...q,
      patient: enrichPatient(q.patientId),
      waitingMinutes: waitingMinutes(q.time),
    }));
  res.json({ queue });
};

export const getConsultation = (req, res) => {
  const consultation = db.consultations.find((c) => c.id === req.params.id);
  if (!consultation) return res.status(404).json({ message: 'Consultation not found.' });
  const visit = db.visits.find((v) => v.id === consultation.visitId);
  const patient = enrichPatient(consultation.patientId);
  res.json({
    consultation,
    visit: visit || null,
    patient,
  });
};

export const listConsultationsByPatient = (req, res) => {
  const consultations = db.consultations
    .filter((c) => c.patientId === req.params.patientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ consultations });
};

export const createConsultation = (req, res) => {
  const { visitId, vitals, chiefComplaint, medicalHistory, clinicalExamination, diagnosis, treatmentRecommendation, doctorNotes, followUp, referral } = req.body || {};
  const visit = db.visits.find((v) => v.id === visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });

  const num = nextConsultationNumber();
  const consultation = {
    id: `C-${num.slice(3)}`,
    consultationNumber: num,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: visit.patientId,
    patientName: visit.patientName,
    doctor: req.user.name,
    doctorId: req.user.id,
    date: now(),
    status: 'in_progress',
    vitals: vitals || {},
    chiefComplaint: chiefComplaint || '',
    medicalHistory: medicalHistory || '',
    clinicalExamination: clinicalExamination || '',
    diagnosis: diagnosis || '',
    treatmentRecommendation: treatmentRecommendation || '',
    doctorNotes: doctorNotes || '',
    followUp: followUp || '',
    referral: referral || null,
  };
  db.consultations.push(consultation);

  const queueEntry = db.queue.find((q) => q.visitId === visit.id && q.status !== 'completed');
  if (queueEntry) {
    queueEntry.status = 'in_consultation';
  }

  res.status(201).json({
    consultation,
    message: 'Consultation started.',
  });
};

export const updateConsultation = (req, res) => {
  const consultation = db.consultations.find((c) => c.id === req.params.id);
  if (!consultation) return res.status(404).json({ message: 'Consultation not found.' });
  const fields = [
    'vitals', 'chiefComplaint', 'medicalHistory', 'clinicalExamination',
    'diagnosis', 'treatmentRecommendation', 'doctorNotes', 'followUp', 'referral',
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) consultation[f] = req.body[f];
  }
  res.json({ consultation, message: 'Consultation saved.' });
};

export const completeConsultation = (req, res) => {
  const consultation = db.consultations.find((c) => c.id === req.params.id);
  if (!consultation) return res.status(404).json({ message: 'Consultation not found.' });
  consultation.status = 'completed';
  const visit = db.visits.find((v) => v.id === consultation.visitId);
  if (visit) visit.status = 'completed';
  const queueEntry = db.queue.find((q) => q.visitId === consultation.visitId && q.status !== 'completed');
  if (queueEntry) queueEntry.status = 'completed';
  res.json({ consultation, message: 'Consultation completed.' });
};
