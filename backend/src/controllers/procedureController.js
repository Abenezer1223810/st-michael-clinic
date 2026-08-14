import { db } from '../data/store.js';
import { nextProcedureNumber } from '../utils/idGenerator.js';
import { now } from '../utils/helpers.js';

const enrich = (p) => {
  const patient = db.patients.find((x) => x.id === p.patientId);
  return { ...p, patient: patient || null };
};

export const listProcedures = (req, res) => {
  const { status } = req.query;
  let procedures = [...db.procedures].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (status) procedures = procedures.filter((p) => p.status === status);
  res.json({ procedures: procedures.map(enrich) });
};

export const getProcedure = (req, res) => {
  const procedure = db.procedures.find((p) => p.id === req.params.id);
  if (!procedure) return res.status(404).json({ message: 'Procedure not found.' });
  res.json({ procedure: enrich(procedure) });
};

export const createProcedure = (req, res) => {
  const { visitId, procedureType, notes } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  if (!procedureType) return res.status(400).json({ message: 'Procedure type is required.' });
  const visit = db.visits.find((v) => v.id === visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });
  const cat = db.procedureTypes.find((p) => p.name === procedureType);
  const num = nextProcedureNumber();
  const procedure = {
    id: `PC-${num.slice(3)}`,
    procedureNumber: num,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: visit.patientId,
    patientName: visit.patientName,
    requestingDoctor: req.user.name,
    procedureType,
    notes: notes || '',
    date: now(),
    status: 'requested',
    recording: null,
    _type: cat?.id || null,
  };
  db.procedures.push(procedure);
  res.status(201).json({ procedure, message: 'Procedure request created.' });
};

export const updateProcedureStatus = (req, res) => {
  const { status } = req.body || {};
  const allowed = ['requested', 'pending', 'in_progress', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid procedure status.' });
  }
  const procedure = db.procedures.find((p) => p.id === req.params.id);
  if (!procedure) return res.status(404).json({ message: 'Procedure not found.' });
  procedure.status = status;
  res.json({ procedure, message: 'Procedure status updated.' });
};

export const recordProcedure = (req, res) => {
  const { medicine, dosage, administrationDetails, time, responsibleStaff, notes } = req.body || {};
  const procedure = db.procedures.find((p) => p.id === req.params.id);
  if (!procedure) return res.status(404).json({ message: 'Procedure not found.' });
  procedure.recording = {
    procedureType: procedure.procedureType,
    medicine: medicine || '',
    dosage: dosage || '',
    administrationDetails: administrationDetails || '',
    date: now(),
    time: time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    responsibleStaff: responsibleStaff || req.user.name,
    notes: notes || '',
  };
  procedure.status = 'completed';
  res.json({ procedure: enrich(procedure), message: 'Procedure completed.' });
};
