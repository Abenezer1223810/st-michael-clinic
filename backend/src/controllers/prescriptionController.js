import { db } from '../data/store.js';
import { nextPrescriptionNumber } from '../utils/idGenerator.js';
import { now } from '../utils/helpers.js';

const enrich = (p) => {
  const patient = db.patients.find((x) => x.id === p.patientId);
  return { ...p, patient: patient || null };
};

export const listPrescriptions = (req, res) => {
  const { patientId } = req.query;
  let prescriptions = [...db.prescriptions].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (patientId) prescriptions = prescriptions.filter((p) => p.patientId === patientId);
  res.json({ prescriptions: prescriptions.map(enrich) });
};

export const getPrescription = (req, res) => {
  const prescription = db.prescriptions.find((p) => p.id === req.params.id);
  if (!prescription) return res.status(404).json({ message: 'Prescription not found.' });
  res.json({ prescription: enrich(prescription) });
};

export const createPrescription = (req, res) => {
  const { visitId, medicines } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ message: 'Add at least one medicine.' });
  }
  const visit = db.visits.find((v) => v.id === visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });

  const clean = medicines.map((m) => {
    const cat = db.medicines.find((x) => x.name === m.medicine);
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
    doctor: req.user.name,
    date: now(),
    medicines: clean,
    status: 'completed',
  };
  db.prescriptions.push(prescription);
  res.status(201).json({ prescription, message: 'Prescription created.' });
};
