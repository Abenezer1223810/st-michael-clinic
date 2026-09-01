import { db } from '../db/index.js';
import { toDateKey } from '../utils/helpers.js';

export const dailyPatientReport = async (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const report = await db.dailyPatientReport(date);
  res.json({ report });
};

export const opdReport = async (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const report = await db.opdReport(date);
  res.json({ report });
};

export const laboratoryReport = async (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const report = await db.laboratoryReport(date);
  res.json({ report });
};

export const procedureReport = async (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const report = await db.procedureReport(date);
  res.json({ report });
};

export const prescriptionReport = async (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const report = await db.prescriptionReport(date);
  res.json({ report });
};

export const revenueReport = async (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const report = await db.dailyRevenueReport(date);
  res.json({ report });
};

export const labWorkloadReport = async (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const report = await db.labWorkloadReport(date);
  res.json({ report });
};

export const patientHistoryReport = async (req, res) => {
  try {
    const history = await db.getPatientHistory(req.params.patientId);
    if (!history) return res.status(404).json({ message: 'Patient history not found.' });
    res.json({ report: history });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const visitSummaryReport = async (req, res) => {
  try {
    const summary = await db.getVisitSummary(req.params.visitId);
    if (!summary) return res.status(404).json({ message: 'Visit summary not found.' });
    res.json({ report: summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
