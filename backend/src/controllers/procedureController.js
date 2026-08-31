import { db } from '../db/index.js';

export const listProcedures = async (req, res) => {
  const { status } = req.query;
  const procedures = await db.listProcedures(status);
  res.json({ procedures });
};

export const getProcedure = async (req, res) => {
  const procedure = await db.getProcedure(req.params.id);
  if (!procedure) return res.status(404).json({ message: 'Procedure not found.' });
  res.json({ procedure });
};

export const createProcedure = async (req, res) => {
  const { visitId, procedureType, notes } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  if (!procedureType) return res.status(400).json({ message: 'Procedure type is required.' });

  const visit = await db.getVisit(visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });

  const procedure = await db.createProcedure({ visitId, procedureType, notes }, req.user);
  res.status(201).json({ procedure, message: 'Procedure request created.' });
};

export const updateProcedureStatus = async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['requested', 'pending', 'in_progress', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid procedure status.' });
  }

  const procedure = await db.updateProcedureStatus(req.params.id, status);
  if (!procedure) return res.status(404).json({ message: 'Procedure not found.' });

  res.json({ procedure, message: 'Procedure status updated.' });
};

export const recordProcedure = async (req, res) => {
  const procedure = await db.recordProcedure(req.params.id, req.body || {}, req.user);
  if (!procedure) return res.status(404).json({ message: 'Procedure not found.' });

  res.json({ procedure, message: 'Procedure completed.' });
};
