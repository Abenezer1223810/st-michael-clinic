import { db } from '../data/store.js';
import { computeAge, toDateKey } from '../utils/helpers.js';

const filterByDate = (list, date, field = 'date') =>
  date ? list.filter((x) => toDateKey(x[field]) === date) : list;

export const dailyPatientReport = (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const visits = filterByDate(db.visits, date).sort((a, b) => a.date.localeCompare(b.date));
  const patientsSeen = visits.map((v) => {
    const p = db.patients.find((x) => x.id === v.patientId);
    return { ...v, patient: p ? { ...p, age: computeAge(p.dateOfBirth) } : null };
  });
  const newPatients = db.patients.filter((p) => toDateKey(p.registrationDate) === date);
  const returning = db.patients.filter((p) => {
    const v = db.visits.filter((x) => x.patientId === p.id && toDateKey(x.date) < date);
    return v.length > 0;
  });
  res.json({
    report: {
      date,
      totalVisits: visits.length,
      newPatientsToday: newPatients.length,
      returningPatientsToday: returning.length,
      rows: patientsSeen,
    },
  });
};

export const opdReport = (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const consultations = filterByDate(db.consultations, date).sort((a, b) => a.date.localeCompare(b.date));
  res.json({
    report: {
      date,
      totalConsultations: consultations.length,
      completed: consultations.filter((c) => c.status === 'completed').length,
      inProgress: consultations.filter((c) => c.status === 'in_progress').length,
      rows: consultations.map((c) => {
        const p = db.patients.find((x) => x.id === c.patientId);
        return { ...c, patient: p ? { ...p, age: computeAge(p.dateOfBirth) } : null };
      }),
    },
  });
};

export const laboratoryReport = (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const requests = filterByDate(db.labRequests, date).sort((a, b) => a.date.localeCompare(b.date));
  res.json({
    report: {
      date,
      totalRequests: requests.length,
      pending: requests.filter((r) => r.status === 'pending').length,
      inProgress: requests.filter((r) => r.status === 'in_progress').length,
      completed: requests.filter((r) => r.status === 'completed').length,
      rows: requests.map((r) => {
        const p = db.patients.find((x) => x.id === r.patientId);
        const result = db.labResults.find((x) => x.requestId === r.id);
        return { ...r, patient: p || null, result: result || null };
      }),
    },
  });
};

export const procedureReport = (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const procedures = filterByDate(db.procedures, date).sort((a, b) => a.date.localeCompare(b.date));
  res.json({
    report: {
      date,
      totalProcedures: procedures.length,
      pending: procedures.filter((p) => p.status !== 'completed').length,
      completed: procedures.filter((p) => p.status === 'completed').length,
      rows: procedures.map((p) => {
        const patient = db.patients.find((x) => x.id === p.patientId);
        return { ...p, patient: patient || null };
      }),
    },
  });
};

export const prescriptionReport = (req, res) => {
  const date = req.query.date || toDateKey(new Date().toISOString());
  const prescriptions = filterByDate(db.prescriptions, date).sort((a, b) => a.date.localeCompare(b.date));
  res.json({
    report: {
      date,
      totalPrescriptions: prescriptions.length,
      rows: prescriptions.map((p) => {
        const patient = db.patients.find((x) => x.id === p.patientId);
        return { ...p, patient: patient || null };
      }),
    },
  });
};
