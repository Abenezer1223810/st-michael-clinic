import { db } from '../db/index.js';
import { simulateAnalyzerRun } from '../services/labSimulator.js';

export const listDevices = async (_req, res) => {
  const devices = await db.listDevices();
  res.json({ devices });
};

export const getDevice = async (req, res) => {
  const device = await db.getDevice(req.params.id);
  if (!device) return res.status(404).json({ message: 'Laboratory device not found.' });
  res.json({ device });
};

export const createDevice = async (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Device name is required.' });

  const device = await db.createDevice(req.body, req.user || { name: 'Admin' });
  res.status(201).json({ device, message: 'Laboratory device registered.' });
};

export const updateDevice = async (req, res) => {
  const device = await db.updateDevice(req.params.id, req.body, req.user || { name: 'Admin' });
  if (!device) return res.status(404).json({ message: 'Laboratory device not found.' });
  res.json({ device, message: 'Laboratory device updated.' });
};

export const deleteDevice = async (req, res) => {
  const ok = await db.deleteDevice(req.params.id, req.user || { name: 'Admin' });
  if (!ok) return res.status(404).json({ message: 'Laboratory device not found.' });
  res.json({ message: 'Laboratory device deleted.' });
};

export const ingestAnalyzerResults = async (req, res) => {
  try {
    const rawPayload = req.body && typeof req.body === 'object' && req.body.raw ? req.body.raw : req.body;
    const result = await db.ingestAnalyzerData(rawPayload, req.user || { name: 'Analyzer Machine' });
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

export const runSimulator = async (req, res) => {
  const { analyzerType, protocol, profile, sampleId, patientId, customResults } = req.body || {};

  if (!sampleId) {
    return res.status(400).json({ message: 'Sample ID / Request barcode is required for simulation.' });
  }

  const simulation = simulateAnalyzerRun({
    analyzerType: analyzerType || 'CBC',
    protocol: protocol || 'HL7',
    profile: profile || 'NORMAL',
    sampleId,
    patientId,
    customResults,
  });

  try {
    const ingestResult = await db.ingestAnalyzerData(
      simulation.rawText || simulation.payload,
      req.user || { name: 'Simulator' }
    );

    res.status(ingestResult.matched ? 200 : 202).json({
      simulation,
      ingestResult,
      message: ingestResult.matched
        ? `Simulation completed. Feed from ${simulation.instrumentName} (${simulation.protocol}) imported.`
        : `Simulation generated, but ${ingestResult.message}`,
    });
  } catch (err) {
    res.status(400).json({
      simulation,
      message: `Simulation error: ${err.message}`,
    });
  }
};
