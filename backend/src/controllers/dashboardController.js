import { db } from '../data/store.js';
import { computeAge, toDateKey, isToday } from '../utils/helpers.js';

export const getDashboard = (_req, res) => {
  const today = toDateKey(new Date().toISOString());

  const patients = db.patients;
  const visitsToday = db.visits.filter((v) => toDateKey(v.date) === today);
  const visitsAll = db.visits;
  const visitDates = new Set(visitsAll.map((v) => v.patientId));

  const newPatients = patients.filter((p) => toDateKey(p.registrationDate) === today);
  const returningPatients = patients.filter((p) => visitDates.has(p.id));

  const queueToday = db.queue.filter((q) => q.date.startsWith(today));
  const waiting = queueToday.filter((q) => q.status === 'waiting' || q.status === 'called').length;
  const inConsultation = queueToday.filter((q) => q.status === 'in_consultation').length;

  const consultationsToday = db.consultations.filter((c) => toDateKey(c.date) === today);
  const consultationsAll = db.consultations;
  const completedConsultations = consultationsAll.filter((c) => c.status === 'completed');

  const labRequests = db.labRequests;
  const pendingLab = labRequests.filter((r) => r.status === 'pending' || r.status === 'in_progress');
  const completedResults = db.labResults.filter((r) => r.status === 'verified' || r.status === 'completed');

  const procedures = db.procedures;
  const pendingProcedures = procedures.filter((p) => p.status !== 'completed');
  const completedProcedures = procedures.filter((p) => p.status === 'completed');

  const prescriptions = db.prescriptions;

  const queueByStatus = {
    waiting,
    in_consultation: inConsultation,
    completed: queueToday.filter((q) => q.status === 'completed').length,
  };

  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7Days.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: key,
      patients: db.visits.filter((v) => toDateKey(v.date) === key).length,
      consultations: db.consultations.filter((c) => toDateKey(c.date) === key).length,
      laboratory: db.labRequests.filter((r) => toDateKey(r.date) === key).length,
    });
  }

  res.json({
    stats: {
      totalPatients: patients.length,
      newPatientsToday: newPatients.length,
      returningPatients: returningPatients.length,
      waitingPatients: waiting,
      inConsultation,
      opdConsultations: consultationsToday.length,
      totalConsultations: consultationsAll.length,
      laboratoryRequests: labRequests.length,
      pendingLaboratoryTests: pendingLab.length,
      completedResults: completedResults.length,
      procedures: procedures.length,
      pendingProcedures: pendingProcedures.length,
      completedProcedures: completedProcedures.length,
      prescriptions: prescriptions.length,
      visitsToday: visitsToday.length,
    },
    queueByStatus,
    last7Days,
  });
};
