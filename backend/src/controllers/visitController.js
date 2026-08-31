import { db } from '../db/index.js';

export const listVisits = async (req, res) => {
  const { patientId, date } = req.query;
  const visits = await db.listVisits(patientId, date);
  res.json({ visits });
};

export const getVisit = async (req, res) => {
  const data = await db.getVisit(req.params.id);
  if (!data) return res.status(404).json({ message: 'Visit not found.' });
  res.json(data);
};

export const createVisit = async (req, res) => {
  const { patientId, service, reason } = req.body || {};
  if (!patientId) return res.status(400).json({ message: 'Patient is required.' });
  if (!service) return res.status(400).json({ message: 'Department / service is required.' });

  const patient = await db.getPatient(patientId);
  if (!patient) return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });

  const visit = await db.createVisit({ patientId, service, reason });
  res.status(201).json({
    visit,
    message: 'Visit created successfully.',
  });
};
