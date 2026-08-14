import { resetDb } from '../data/store.js';

export const resetDemo = (_req, res) => {
  resetDb();
  res.json({ message: 'Demo data has been reset to the original state.' });
};
