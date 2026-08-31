import { db } from '../db/index.js';

export const getDashboard = async (_req, res) => {
  const data = await db.getDashboard();
  res.json(data);
};
