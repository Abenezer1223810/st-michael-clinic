import { db } from '../data/store.js';
import { nextLaboratoryRequestNumber } from '../utils/idGenerator.js';
import { now, formatDate } from '../utils/helpers.js';

const enrich = (r) => {
  const patient = db.patients.find((p) => p.id === r.patientId);
  const result = db.labResults.find((x) => x.requestId === r.id);
  return {
    ...r,
    patient: patient || null,
    result: result || null,
  };
};

export const getTestCatalog = (_req, res) => {
  res.json({ tests: db.labTests });
};

export const listRequests = (req, res) => {
  const { status } = req.query;
  let requests = [...db.labRequests].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (status) requests = requests.filter((r) => r.status === status);
  res.json({ requests: requests.map(enrich) });
};

export const getRequest = (req, res) => {
  const request = db.labRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  res.json({ request: enrich(request) });
};

export const createRequest = (req, res) => {
  const { visitId, testIds } = req.body || {};
  if (!visitId) return res.status(400).json({ message: 'Visit is required.' });
  if (!Array.isArray(testIds) || testIds.length === 0) {
    return res.status(400).json({ message: 'Select at least one test.' });
  }
  const visit = db.visits.find((v) => v.id === visitId);
  if (!visit) return res.status(404).json({ message: 'Visit not found.' });
  const tests = testIds
    .map((id) => db.labTests.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({ id: t.id, name: t.name, unit: t.unit, referenceRange: t.referenceRange }));

  const num = nextLaboratoryRequestNumber();
  const request = {
    id: `LR-${num.slice(3)}`,
    requestNumber: num,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: visit.patientId,
    patientName: visit.patientName,
    requestingDoctor: req.user.name,
    date: now(),
    tests,
    status: 'pending',
  };
  db.labRequests.push(request);
  res.status(201).json({ request, message: 'Laboratory request created.' });
};

export const getResult = (req, res) => {
  const request = db.labRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  let result = db.labResults.find((x) => x.requestId === request.id);
  if (!result) {
    result = {
      id: `R-${request.id.slice(3)}`,
      requestId: request.id,
      requestNumber: request.requestNumber,
      patientId: request.patientId,
      visitId: request.visitId,
      status: 'pending',
      date: now(),
      enteredAt: null,
      verifiedAt: null,
      enteredBy: null,
      verifiedBy: null,
      results: request.tests.map((t) => ({
        testId: t.id,
        testName: t.name,
        unit: t.unit,
        referenceRange: t.referenceRange,
        result: '',
        remarks: '',
        status: 'pending',
      })),
    };
    db.labResults.push(result);
  }
  res.json({ result, request: enrich(request) });
};

export const enterResults = (req, res) => {
  const { results } = req.body || {};
  const request = db.labRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  if (!Array.isArray(results)) {
    return res.status(400).json({ message: 'Results payload is invalid.' });
  }
  let result = db.labResults.find((x) => x.requestId === request.id);
  if (!result) {
    result = {
      id: `R-${request.id.slice(3)}`,
      requestId: request.id,
      requestNumber: request.requestNumber,
      patientId: request.patientId,
      visitId: request.visitId,
      date: now(),
      enteredAt: null,
      verifiedAt: null,
      enteredBy: null,
      verifiedBy: null,
      results: [],
    };
    db.labResults.push(result);
  }
  result.results = request.tests.map((t) => {
    const incoming = results.find((x) => x.testId === t.id);
    return {
      testId: t.id,
      testName: t.name,
      unit: t.unit,
      referenceRange: t.referenceRange,
      result: incoming?.result ?? '',
      remarks: incoming?.remarks ?? '',
      status: 'entered',
    };
  });
  result.status = 'entered';
  result.enteredBy = req.user.name;
  result.enteredAt = now();
  if (request.status === 'pending') request.status = 'in_progress';
  res.json({ result, message: 'Results saved. Awaiting verification.' });
};

export const verifyResult = (req, res) => {
  const request = db.labRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  const result = db.labResults.find((x) => x.requestId === request.id);
  if (!result) return res.status(400).json({ message: 'No results entered yet.' });
  result.status = 'verified';
  result.verifiedBy = req.user.name;
  result.verifiedAt = now();
  result.results = result.results.map((r) => ({ ...r, status: 'verified' }));
  request.status = 'completed';
  res.json({ result, message: 'Laboratory result verified.' });
};

export const completeRequest = (req, res) => {
  const request = db.labRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Laboratory request not found.' });
  request.status = 'completed';
  res.json({ request, message: 'Laboratory request completed.' });
};

export { formatDate };
