import { db } from '../data/store.js';
import { nextQueueNumber } from '../utils/idGenerator.js';
import { now, toDateKey, isToday } from '../utils/helpers.js';

export const listQueue = (req, res) => {
  const { status } = req.query;
  let queue = [...db.queue]
    .filter((q) => isToday(q.date))
    .sort((a, b) => Number(a.queueNumber) - Number(b.queueNumber));
  if (status) queue = queue.filter((q) => q.status === status);
  res.json({ queue });
};

export const addToQueue = (req, res) => {
  const { visitId } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  const visit = db.visits.find((v) => v.id === visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });
  const existing = db.queue.find(
    (q) => q.visitId === visitId && q.status !== 'completed'
  );
  if (existing) {
    return res.status(400).json({ message: 'Patient is already in the queue.' });
  }
  const qnum = nextQueueNumber();
  const entry = {
    id: `Q-${qnum}`,
    queueNumber: qnum,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: visit.patientId,
    patientName: visit.patientName,
    service: visit.service,
    time: now(),
    date: toDateKey(now()),
    status: 'waiting',
  };
  db.queue.push(entry);
  res.status(201).json({ queueEntry: entry, message: 'Patient added to OPD queue.' });
};

export const updateQueueStatus = (req, res) => {
  const { status } = req.body || {};
  const allowed = ['waiting', 'called', 'in_consultation', 'completed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid queue status.' });
  }
  const entry = db.queue.find((q) => q.id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Queue entry not found.' });
  entry.status = status;
  if (status === 'completed') {
    const visit = db.visits.find((v) => v.id === entry.visitId);
    if (visit) visit.status = 'completed';
  }
  res.json({ queueEntry: entry, message: 'Queue status updated.' });
};
