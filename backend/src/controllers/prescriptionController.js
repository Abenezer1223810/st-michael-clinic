import { db } from '../db/index.js';

export const listPrescriptions = async (req, res) => {
  const { patientId } = req.query;
  const prescriptions = await db.listPrescriptions(patientId);
  res.json({ prescriptions });
};

export const getPrescription = async (req, res) => {
  const prescription = await db.getPrescription(req.params.id);
  if (!prescription) return res.status(404).json({ message: 'Prescription not found.' });
  res.json({ prescription });
};

export const createPrescription = async (req, res) => {
  const { visitId, medicines } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ message: 'Add at least one medicine.' });
  }

  const visit = await db.getVisit(visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });

  const prescription = await db.createPrescription({ visitId, medicines }, req.user);
  res.status(201).json({ prescription, message: 'Prescription created.' });
};
