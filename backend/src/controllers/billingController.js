import { db } from '../db/index.js';

export const listInvoices = async (req, res) => {
  const { status, q } = req.query;
  const invoices = await db.listInvoices(status, q);
  res.json({ invoices });
};

export const getInvoice = async (req, res) => {
  const data = await db.getInvoice(req.params.id);
  if (!data) return res.status(404).json({ message: 'Invoice not found.' });
  res.json(data);
};

export const getVisitInvoice = async (req, res) => {
  const data = await db.getVisitInvoice(req.params.visitId, req.user);
  if (!data) return res.status(404).json({ message: 'Visit invoice not found.' });
  res.json(data);
};

export const receivePayment = async (req, res) => {
  const { amount, paymentMethod, notes } = req.body || {};
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: 'Payment amount must be greater than zero.' });
  }

  try {
    const result = await db.receivePayment(req.params.id, { amount, paymentMethod, notes }, req.user);
    res.status(201).json({ ...result, message: 'Payment received successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const verifyPayment = async (req, res) => {
  const { notes } = req.body || {};
  try {
    const result = await db.verifyPayment(req.params.id, { notes }, req.user);
    res.json({ ...result, message: 'Payment verified and department worklists authorized.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const cancelPayment = async (req, res) => {
  const { reason } = req.body || {};
  if (!reason) {
    return res.status(400).json({ message: 'Cancellation reason is required.' });
  }

  try {
    const result = await db.cancelPayment(req.params.id, { reason }, req.user);
    res.json({ ...result, message: 'Payment cancelled successfully.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

