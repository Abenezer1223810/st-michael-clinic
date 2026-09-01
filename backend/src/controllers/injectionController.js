import { db } from '../db/index.js';

export const listInjectionOrders = async (req, res) => {
  const { patientId, status } = req.query;
  const orders = await db.listInjectionOrders(patientId, status, req.user?.role);
  res.json({ orders });
};

export const getInjectionOrder = async (req, res) => {
  const order = await db.getInjectionOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Injection order not found.' });
  res.json({ order });
};

export const createInjectionOrder = async (req, res) => {
  const { visitId, medication, prescribedDose, dose, route, frequency, instructions } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  if (!medication) return res.status(400).json({ message: 'Medication name is required.' });

  const visit = await db.getVisit(visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });

  const order = await db.createInjectionOrder(
    {
      visitId,
      medication,
      prescribedDose: prescribedDose || dose || '',
      route: route || 'IM',
      frequency: frequency || 'STAT',
      instructions: instructions || '',
    },
    req.user
  );

  res.status(201).json({ order, message: 'Injection order created.' });
};

export const administerInjection = async (req, res) => {
  try {
    const { actualMedication, actualDose, route, administrationSite, notes, status } = req.body || {};
    const result = await db.administerInjection(
      req.params.id,
      { actualMedication, actualDose, route, administrationSite, notes, status },
      req.user
    );
    res.json({ ...result, message: 'Injection administered successfully.' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

