const BASE = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function log(ok, label, extra = '') {
  if (ok) { passed++; console.log(`  PASS  ${label}${extra ? ' -> ' + extra : ''}`); }
  else { failed++; console.log(`  FAIL  ${label}${extra ? ' -> ' + extra : ''}`); }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(username, password) {
  const { status, data } = await call('POST', '/auth/login', { body: { username, password } });
  return { status, token: data.token, user: data.user };
}

async function main() {
  console.log('\n== 1. AUTH ==');
  const reception = await login('reception', 'reception123');
  log(reception.status === 200 && reception.token, 'reception login');
  const doc = await login('doctor', 'doctor123');
  log(doc.status === 200 && doc.token, 'doctor login');
  const lab = await login('lab', 'lab123');
  log(lab.status === 200 && lab.token, 'lab login');
  const proc = await login('procedure', 'procedure123');
  log(proc.status === 200 && proc.token, 'procedure login');
  const admin = await login('admin', 'admin123');
  log(admin.status === 200 && admin.token, 'admin login');
  const bad = await login('admin', 'wrong');
  log(bad.status === 401, 'wrong password rejected');

  console.log('\n== 2. RECEPTION: PATIENT REGISTRATION ==');
  const newPat = await call('POST', '/patients', {
    token: reception.token,
    body: {
      fullName: 'Selam Tesfaye',
      gender: 'Female',
      dateOfBirth: '2001-09-23',
      phone: '0914 567 890',
      address: 'Kazanchis, Addis Ababa',
    },
  });
  log(newPat.status === 201 && newPat.data.patient.id.startsWith('PT-'), 'create patient', newPat.data.patient?.id);

  const pid = newPat.data.patient.id;

  const search = await call('GET', `/patients?q=${encodeURIComponent('Tesfaye')}`, { token: reception.token });
  log(search.status === 200 && search.data.patients.some((p) => p.id === pid), 'search patient by name');

  const searchPhone = await call('GET', `/patients?q=0914%20567`, { token: reception.token });
  log(searchPhone.status === 200 && searchPhone.data.patients.some((p) => p.id === pid), 'search patient by phone');

  console.log('\n== 3. RECEPTION: VISIT + QUEUE ==');
  const visit = await call('POST', '/visits', {
    token: reception.token,
    body: { patientId: pid, service: 'OPD', reason: 'Fever and headache for 2 days' },
  });
  log(visit.status === 201 && visit.data.visit.visitNumber, 'create visit', visit.data.visit?.visitNumber);
  const vid = visit.data.visit.id;

  const queue = await call('POST', '/queue', { token: reception.token, body: { visitId: vid } });
  log(queue.status === 201 && queue.data.queueEntry.status === 'waiting', 'add to queue', `Q-${queue.data.queueEntry?.queueNumber}`);

  console.log('\n== 4. DOCTOR: OPD QUEUE + CONSULTATION ==');
  const opdQueue = await call('GET', '/opd/queue', { token: doc.token });
  const inQueue = opdQueue.data.queue.some((q) => q.visitId === vid);
  log(opdQueue.status === 200 && inQueue, 'patient visible in OPD queue');

  const cons = await call('POST', '/consultations', {
    token: doc.token,
    body: {
      visitId: vid,
      vitals: { bloodPressure: '118/76', pulse: 92, temperature: 38.4, respiratoryRate: 20, weight: 55, height: 161 },
    },
  });
  log(cons.status === 201 && cons.data.consultation.status === 'in_progress', 'start consultation', cons.data.consultation?.consultationNumber);
  const cid = cons.data.consultation.id;

  const saveCons = await call('PATCH', `/consultations/${cid}`, {
    token: doc.token,
    body: {
      chiefComplaint: 'Fever, headache and body ache for 2 days',
      medicalHistory: 'No chronic illness',
      clinicalExamination: 'Febrile, throat mildly red',
      diagnosis: 'Suspected typhoid fever',
      treatmentRecommendation: 'Start empirical antibiotics after lab results',
      doctorNotes: 'Counsel on hydration and rest',
      followUp: 'Review with lab results',
    },
  });
  log(saveCons.status === 200 && saveCons.data.consultation.diagnosis === 'Suspected typhoid fever', 'save consultation clinical info');

  console.log('\n== 5. DOCTOR: LAB REQUEST ==');
  const labReq = await call('POST', '/laboratory/requests', {
    token: doc.token,
    body: { visitId: vid, testIds: ['LT-09', 'LT-10', 'LT-01'] },
  });
  log(labReq.status === 201 && labReq.data.request.status === 'pending', 'create lab request', labReq.data.request?.requestNumber);
  const lrid = labReq.data.request.id;

  console.log('\n== 6. DOCTOR: PROCEDURE REQUEST ==');
  const procReq = await call('POST', '/procedures', {
    token: doc.token,
    body: { visitId: vid, procedureType: 'Intramuscular (IM) Injection', notes: 'Diclofenac 75mg IM for fever' },
  });
  log(procReq.status === 201 && procReq.data.procedure.status === 'requested', 'create procedure request', procReq.data.procedure?.procedureNumber);
  const pcid = procReq.data.procedure.id;

  console.log('\n== 7. DOCTOR: PRESCRIPTION ==');
  const rx = await call('POST', '/prescriptions', {
    token: doc.token,
    body: {
      visitId: vid,
      medicines: [
        { medicine: 'Paracetamol 500mg', dosage: '500 mg', frequency: '3 times daily', duration: '5 days', route: 'Oral', instructions: 'After meals' },
        { medicine: 'Amoxicillin 500mg', dosage: '500 mg', frequency: '3 times daily', duration: '5 days', route: 'Oral', instructions: 'Every 8 hours' },
      ],
    },
  });
  log(rx.status === 201 && rx.data.prescription.medicines.length === 2, 'create prescription', rx.data.prescription?.prescriptionNumber);

  console.log('\n== 8. LABORATORY STAFF: RESULT ENTRY + VERIFY ==');
  const labList = await call('GET', '/laboratory/requests?status=pending', { token: lab.token });
  log(labList.status === 200 && labList.data.requests.some((r) => r.id === lrid), 'request appears in lab worklist');

  const resultDoc = await call('GET', `/laboratory/requests/${lrid}/result`, { token: lab.token });
  log(resultDoc.status === 200 && resultDoc.data.result.status === 'pending', 'open result entry');

  const entered = await call('POST', `/laboratory/requests/${lrid}/results`, {
    token: lab.token,
    body: {
      results: [
        { testId: 'LT-09', result: 'Positive', remarks: 'P. falciparum detected' },
        { testId: 'LT-10', result: '1:160', remarks: 'Elevated titer' },
        { testId: 'LT-01', result: '12.8', remarks: 'Within normal limits' },
      ],
    },
  });
  log(entered.status === 200 && entered.data.result.status === 'entered', 'enter results');

  const verified = await call('POST', `/laboratory/requests/${lrid}/verify`, { token: lab.token });
  log(verified.status === 200 && verified.data.result.status === 'verified', 'verify result');

  console.log('\n== 9. PROCEDURE STAFF: COMPLETE PROCEDURE ==');
  const procList = await call('GET', '/procedures', { token: proc.token });
  log(procList.status === 200 && procList.data.procedures.some((p) => p.id === pcid), 'procedure appears in list');

  const rec = await call('POST', `/procedures/${pcid}/record`, {
    token: proc.token,
    body: {
      medicine: 'Diclofenac 75mg',
      dosage: '75 mg',
      administrationDetails: 'Upper outer quadrant, left gluteal',
      time: '11:15 AM',
      responsibleStaff: 'Kebede Worku',
      notes: 'Tolerated well',
    },
  });
  log(rec.status === 200 && rec.data.procedure.status === 'completed', 'record + complete procedure');

  console.log('\n== 10. DOCTOR: COMPLETE CONSULTATION ==');
  const complete = await call('POST', `/consultations/${cid}/complete`, { token: doc.token });
  log(complete.status === 200 && complete.data.consultation.status === 'completed', 'complete consultation');

  console.log('\n== 11. PATIENT HISTORY ==');
  const hist = await call('GET', `/patients/${pid}/history`, { token: reception.token });
  const h = hist.data;
  log(hist.status === 200, 'history endpoint');
  log(h.visits.length === 1, 'history has visit');
  log(h.consultations.length === 1 && h.consultations[0].diagnosis, 'history has consultation + diagnosis');
  log(h.laboratory.length === 1 && h.laboratory[0].result?.status === 'verified', 'history has lab request + verified result');
  log(h.procedures.length === 1 && h.procedures[0].status === 'completed', 'history has completed procedure');
  log(h.prescriptions.length === 1 && h.prescriptions[0].medicines.length === 2, 'history has prescription');

  console.log('\n== 12. DASHBOARD + REPORTS ==');
  const dash = await call('GET', '/dashboard', { token: admin.token });
  log(dash.status === 200 && typeof dash.data.stats.totalPatients === 'number', 'dashboard', JSON.stringify(dash.data.stats));
  const report = await call('GET', '/reports/daily-patients', { token: admin.token });
  log(report.status === 200 && Array.isArray(report.data.report.rows), 'daily patient report');

  console.log('\n== 13. DEMO RESET (admin) ==');
  const reset = await call('POST', '/dev/reset', { token: admin.token });
  log(reset.status === 200, 'reset demo data');
  const afterReset = await call('GET', `/patients/${pid}`, { token: admin.token });
  log(afterReset.status === 404, 'reset removed demo patient');

  console.log(`\n==== RESULT: ${passed} passed, ${failed} failed ====\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('SMOKE TEST ERROR', e); process.exit(1); });
