import { db } from '../db/index.js';

export const listDevices = async (_req, res) => {
  const devices = await db.listDevices();
  res.json({ devices });
};

export const ingestAnalyzerResults = async (req, res) => {
  try {
    const result = await db.ingestAnalyzerData(req.body, req.user || { name: 'Analyzer Machine' });
    res.status(result.matched ? 200 : 202).json({
      ...result,
      message: result.matched
        ? `Successfully imported results from ${result.instrumentName} for request ${result.requestId}.`
        : result.message,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to parse machine payload.' });
  }
};

