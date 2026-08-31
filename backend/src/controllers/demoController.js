import { db, resetDb } from '../data/store.js';

const DEMO_PATIENT_ID = 'PT-0001';

export const startDemo = async (_req, res) => {
  await resetDb();
  const patient = await db.getPatient(DEMO_PATIENT_ID);
  res.json({
    message: 'Demo started. Fresh seed state loaded.',
    demo: {
      patientId: DEMO_PATIENT_ID,
      patient: patient || null,
    },
  });
};

export const resetDemo = async (_req, res) => {
  await resetDb();
  res.json({ message: 'Demo data has been reset to the original state.' });
};
