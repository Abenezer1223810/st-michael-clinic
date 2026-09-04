import { db } from '../db/index.js';

export const listSickLeaves = async (req, res) => {
  const { patientId } = req.query;
  const sickLeaves = await db.listSickLeaves(patientId);
  res.json({ sickLeaves });
};

export const getSickLeave = async (req, res) => {
  const sickLeave = await db.getSickLeave(req.params.id);
  if (!sickLeave) return res.status(404).json({ message: 'Sick leave certificate not found.' });
  res.json({ sickLeave });
};

export const createSickLeave = async (req, res) => {
  const { visitId, fromDate, toDate, numberOfDays, diagnosis, notes } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });

  const visit = await db.getVisit(visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });

  const sickLeave = await db.createSickLeave(
    { visitId, fromDate, toDate, numberOfDays, diagnosis, notes },
    req.user
  );
  if (!sickLeave) return res.status(400).json({ message: 'Could not create sick leave certificate.' });
  res.status(201).json({ sickLeave, message: 'Sick leave certificate created.' });
};
