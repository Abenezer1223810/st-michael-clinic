import { db } from '../db/index.js';

export const getOpdQueue = async (_req, res) => {
  const queue = await db.getOpdQueue();
  res.json({ queue });
};

export const getConsultation = async (req, res) => {
  const data = await db.getConsultation(req.params.id);
  if (!data) return res.status(404).json({ message: 'Consultation not found.' });
  res.json(data);
};

export const listConsultationsByPatient = async (req, res) => {
  const consultations = await db.listConsultationsByPatient(req.params.patientId);
  res.json({ consultations });
};

export const createConsultation = async (req, res) => {
  const consultation = await db.createConsultation(req.body, req.user);
  if (!consultation) return res.status(404).json({ message: 'Visit not found.' });
  res.status(201).json({
    consultation,
    message: 'Consultation started.',
  });
};

export const updateConsultation = async (req, res) => {
  const consultation = await db.updateConsultation(req.params.id, req.body, req.user);
  if (!consultation) return res.status(404).json({ message: 'Consultation not found.' });
  res.json({ consultation, message: 'Consultation saved.' });
};

export const holdConsultationForLab = async (req, res) => {
  const consultation = await db.holdConsultationForLab(req.params.id, req.user);
  if (!consultation) return res.status(404).json({ message: 'Consultation not found.' });
  res.json({ consultation, message: 'Consultation paused awaiting laboratory results.' });
};

export const completeConsultation = async (req, res) => {
  const consultation = await db.completeConsultation(req.params.id, req.user);
  if (!consultation) return res.status(404).json({ message: 'Consultation not found.' });
  res.json({ consultation, message: 'Consultation completed.' });
};
