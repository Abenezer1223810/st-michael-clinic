import { resetDb } from '../data/store.js';

export const resetDemo = async (_req, res) => {
  await resetDb();
  res.json({ message: 'Demo data has been reset to the original state.' });
};
