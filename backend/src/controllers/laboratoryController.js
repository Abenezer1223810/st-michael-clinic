import { db } from '../db/index.js';
import { formatDate } from '../utils/helpers.js';

export const getTestCatalog = async (_req, res) => {
  const tests = await db.getTestCatalog();
  res.json({ tests });
};

export const listRequests = async (req, res) => {
  const { status } = req.query;
  const requests = await db.listLabRequests(status);
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

  const result = await db.enterLabResults(req.params.id, results, req.user);
  if (!result) return res.status(404).json({ message: 'Laboratory request not found.' });

  res.json({ result, message: 'Results saved. Awaiting verification.' });
};

export const verifyResult = async (req, res) => {
  const data = await db.verifyLabResult(req.params.id, req.user);
  if (data.error) {
    return res.status(data.status || 400).json({ message: data.error });
  }
  res.json({ result: data.result, message: 'Laboratory result verified.' });
};

export const completeRequest = async (req, res) => {
  const request = await db.getLabRequest(req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  request.status = 'completed';
  res.json({ request, message: 'Laboratory request completed.' });
};

export { formatDate };
