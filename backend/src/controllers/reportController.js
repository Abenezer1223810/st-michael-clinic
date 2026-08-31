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
