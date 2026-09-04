import { db } from '../db/index.js';
import { computeAge, formatDate } from '../utils/helpers.js';

const ALLERGY_CATEGORIES = ['Drug', 'Food', 'Environmental'];
const ALLERGY_SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];

const normalizeAllergies = (allergies) => {
  if (!Array.isArray(allergies)) return [];
  return allergies
    .filter((a) => a && (a.name || a.category))
    .map((a) => ({
      category: ALLERGY_CATEGORIES.includes(a.category) ? a.category : '',
      name: String(a.name || '').trim(),
      severity: ALLERGY_SEVERITIES.includes(a.severity) ? a.severity : 'Mild',
      reaction: String(a.reaction || '').trim(),
    }))
    .filter((a) => a.name);
};

export const listPatients = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const enriched = await db.listPatients(q);
  res.json({ patients: enriched });
};

export const getPatient = async (req, res) => {
  const patient = await db.getPatient(req.params.id);
  if (!patient) {
    return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });
  }
  res.json({ patient });
};

export const createPatient = async (req, res) => {
  const { fullName, gender, dateOfBirth, age, phone, address, subCity, woreda, emergencyContactName, emergencyContactPhone, relationshipToPatient, allergies } = req.body || {};
  if (!fullName || !String(fullName).trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (!gender) {
    return res.status(400).json({ message: 'Gender is required.' });
  }
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required.' });
  }
  let dob = dateOfBirth || null;
  if (!dob && age) {
    const year = new Date().getFullYear() - Number(age);
    dob = `${year}-01-01`;
  }
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return res.status(400).json({ message: 'Date of birth must be YYYY-MM-DD.' });
  }

  const patient = await db.createPatient(
    {
      fullName,
      gender,
      dateOfBirth: dob,
      phone,
      address,
      subCity,
      woreda,
      emergencyContactName,
      emergencyContactPhone,
      relationshipToPatient,
      allergies: normalizeAllergies(allergies),
    },
    req.user
  );

  res.status(201).json({ patient, message: 'Patient registered successfully.' });
};

export const getPatientHistory = async (req, res) => {
  const history = await db.getPatientHistory(req.params.id);
  if (!history) {
    return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });
  }
  res.json(history);
};

export const getPatientTimeline = async (req, res) => {
  const timeline = await db.getPatientTimeline(req.params.id);
  if (!timeline) {
    return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });
  }
  res.json(timeline);
};

export const renewCard = async (req, res) => {
  const patient = await db.renewCard(req.params.id, req.user);
  if (!patient) {
    return res.status(404).json({ message: 'Patient ID not found. Please check the ID and try again.' });
  }
  res.json({ patient, message: 'Patient card renewed successfully.' });
};
