import { db } from '../db/index.js';

export const listQueue = async (req, res) => {
  const { status } = req.query;
  const queue = await db.listQueue(status);
  res.json({ queue });
};

export const addToQueue = async (req, res) => {
  const { visitId, priority, department } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });

  const result = await db.addToQueue(visitId, priority || 'NORMAL', department || 'OPD', req.user);
  if (result.error) {
    return res.status(result.status || 400).json({ message: result.error });
  }

  res.status(201).json({ queueEntry: result.entry, message: 'Patient added to OPD queue.' });
};

export const updateQueueStatus = async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['waiting', 'called', 'in_consultation', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid queue status.' });
  }

  const entry = await db.updateQueueStatus(req.params.id, status, req.user);
  if (!entry) return res.status(404).json({ message: 'Queue entry not found.' });

  res.json({ queueEntry: entry, message: 'Queue status updated.' });
};
