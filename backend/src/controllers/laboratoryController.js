import { db } from '../db/index.js';
import { formatDate } from '../utils/helpers.js';

export const getTestCatalog = async (_req, res) => {
  const tests = await db.getTestCatalog();
  res.json({ tests });
};

export const listRequests = async (req, res) => {
  const { status } = req.query;
  const requests = await db.listLabRequests(status, req.user?.role);
  res.json({ requests });
};

export const getRequest = async (req, res) => {
  const request = await db.getLabRequest(req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  res.json({ request });
};

export const createRequest = async (req, res) => {
  const { visitId, testIds } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  if (!Array.isArray(testIds) || testIds.length === 0) {
    return res.status(400).json({ message: 'Select at least one test.' });
  }

  const visit = await db.getVisit(visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });

  const request = await db.createLabRequest({ visitId, testIds }, req.user);
  res.status(201).json({ request, message: 'Laboratory request created.' });
};

export const collectSample = async (req, res) => {
  try {
    const data = await db.collectSample(req.params.id, req.body || {}, req.user);
    if (data.error) return res.status(data.status || 400).json({ message: data.error });
    res.status(201).json({
      sample: data.sample,
      request: data.request,
      message: `Specimen collected. Sample barcode ${data.sample.sampleNumber} assigned.`,
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

export const getSample = async (req, res) => {
  const sample = await db.getSample(req.params.id);
  if (!sample) return res.status(404).json({ message: 'Sample not found.' });
  res.json({ sample });
};

export const listSamples = async (req, res) => {
  const samples = await db.listSamples(req.query.requestId);
  res.json({ samples });
};

export const getResult = async (req, res) => {
  const data = await db.getLabResult(req.params.id);
  if (!data) return res.status(404).json({ message: 'Laboratory request not found.' });
  res.json(data);
};

export const enterResults = async (req, res) => {
  const { results } = req.body || {};
  if (!Array.isArray(results)) {
    return res.status(400).json({ message: 'Results payload is invalid.' });
  }

  try {
    const result = await db.enterLabResults(req.params.id, results, req.user);
    if (!result) return res.status(404).json({ message: 'Laboratory request not found.' });
    res.json({ result, message: 'Results saved. Awaiting verification.' });
  } catch (err) {
    res.status(err.statusCode || 400).json({ message: err.message });
  }
};

export const verifyResult = async (req, res) => {
  const data = await db.verifyLabResult(req.params.id, req.user);
  if (data.error) {
    return res.status(data.status || 400).json({ message: data.error });
  }
  res.json({ result: data.result, message: 'Laboratory result verified.' });
};

export const releaseResultToDoctor = async (req, res) => {
  const data = await db.releaseLabResultToDoctor(req.params.id, req.user);
  if (data.error) {
    return res.status(data.status || 400).json({ message: data.error });
  }
  res.json({ result: data.result, request: data.request, message: 'Laboratory result released to OPD doctor.' });
};

export const completeRequest = async (req, res) => {
  const request = await db.getLabRequest(req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  request.status = 'completed';
  res.json({ request, message: 'Laboratory request completed.' });
};

export const getLabRequestMessages = async (req, res) => {
  try {
    const messages = await db.getLabRequestMessages(req.params.id);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addLabRequestMessage = async (req, res) => {
  const { message } = req.body || {};
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Message content is required.' });
  }

  try {
    const newMsg = await db.addLabRequestMessage(req.params.id, message.trim(), req.user);
    if (!newMsg) return res.status(404).json({ message: 'Laboratory request not found.' });
    res.status(201).json({ message: newMsg, success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { formatDate };

