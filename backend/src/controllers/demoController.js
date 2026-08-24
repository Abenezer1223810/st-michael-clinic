import { db, resetDb } from '../data/store.js';

const DEMO_PATIENT_ID = 'PT-0001';

export const startDemo = (_req, res) => {
  resetDb();
  const patient = db.patients.find((p) => p.id === DEMO_PATIENT_ID);
  res.json({
    message: 'Demo started. Fresh seed state loaded.',
    demo: {
      patientId: DEMO_PATIENT_ID,
      patient: patient || null,
    },
  });
};

export const resetDemo = (_req, res) => {
  resetDb();
  res.json({ message: 'Demo data has been reset to the original state.' });
};
