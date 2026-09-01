import { db } from '../db/index.js';

export const getVisitClosureCheck = async (req, res) => {
  try {
    const check = await db.getVisitClosureCheck(req.params.id);
    res.json(check);
  } catch (err) {
    res.status(404).json({ message: err.message || 'Visit not found.' });
  }
};

export const closeVisit = async (req, res) => {
  const { overrideReason, notes } = req.body || {};
  try {
    const result = await db.closeVisit(req.params.id, { overrideReason, notes }, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getVisitSummary = async (req, res) => {
  try {
    const summary = await db.getVisitSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    res.status(404).json({ message: err.message || 'Visit summary not found.' });
  }
};

