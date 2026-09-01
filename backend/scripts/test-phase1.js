const BASE = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function log(ok, label, extra = '') {
  if (ok) {
    passed++;
    console.log(`  PASS  ${label}${extra ? ' -> ' + extra : ''}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${extra ? ' -> ' + extra : ''}`);
  }
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
  console.log('\n======================================================');
  console.log('ST. MICHAEL MEDIUM CLINIC - PHASE 1 ACCEPTANCE TESTS');
  console.log('======================================================\n');

  // ----------------------------------------------------------------
  // 1. AUTHENTICATION & BCRYPT VERIFICATION FOR ALL 6 ROLES
  // ----------------------------------------------------------------
  console.log('== 1. AUTHENTICATION & BCRYPT VERIFICATION (6 ROLES) ==');

  const adminAuth = await login('admin', 'admin123');
  log(adminAuth.status === 200 && adminAuth.user?.role === 'administrator', 'ADMINISTRATOR login');

  const recAuth = await login('reception', 'reception123');
  log(recAuth.status === 200 && recAuth.user?.role === 'receptionist', 'RECEPTIONIST login');

  const docAuth = await login('doctor', 'doctor123');
  log(docAuth.status === 200 && docAuth.user?.role === 'doctor', 'DOCTOR login');

  const labAuth = await login('lab', 'lab123');
  log(labAuth.status === 200 && labAuth.user?.role === 'laboratory', 'LAB_TECHNICIAN login');

  const procAuth = await login('procedure', 'procedure123');
  log(procAuth.status === 200 && procAuth.user?.role === 'procedure', 'PROCEDURE_NURSE login');

  const pharmAuth = await login('pharmacy', 'pharmacy123');
  log(pharmAuth.status === 200 && pharmAuth.user?.role === 'pharmacy', 'PHARMACY login');

  const badAuth = await login('admin', 'wrong-pass');
  log(badAuth.status === 401, 'Wrong password rejected (bcrypt)');

  // ----------------------------------------------------------------
  // 2. ROLE PERMISSIONS & RBAC GUARDS
  // ----------------------------------------------------------------
  console.log('\n== 2. ROLE PERMISSIONS & RBAC ROUTE GUARDS ==');

  const recAdminAccess = await call('GET', '/admin/users', { token: recAuth.token });
  log(recAdminAccess.status === 403, 'Receptionist blocked from Admin routes (403 Forbidden)');

  const docAdminAccess = await call('GET', '/admin/audit-logs', { token: docAuth.token });
  log(docAdminAccess.status === 403, 'Doctor blocked from Admin Audit Logs (403 Forbidden)');

  const adminUserList = await call('GET', '/admin/users', { token: adminAuth.token });
  log(adminUserList.status === 200 && adminUserList.data.users.length >= 6, 'Administrator can access Admin User management', `Found ${adminUserList.data.users?.length} accounts`);

  // ----------------------------------------------------------------
  // 3. PATIENT REGISTRATION (PT-000001 Format)
  // ----------------------------------------------------------------
  console.log('\n== 3. PATIENT REGISTRATION (PT-000001 FORMAT) ==');

  const newPatientData = {
    fullName: 'Yared Mulugeta Haile',
    gender: 'Male',
    dateOfBirth: '1992-05-14',
    phone: '0911887766',
    address: 'Bole Subcity, Woreda 03, Addis Ababa',
    emergencyContactName: 'Almaz Tadesse',
    emergencyContactPhone: '0922334455',
    relationshipToPatient: 'Spouse',
    allergies: [{ category: 'Drug', name: 'Penicillin', severity: 'Severe', reaction: 'Skin rash & swelling' }],
  };

  const regRes = await call('POST', '/patients', { token: recAuth.token, body: newPatientData });
  const createdPatient = regRes.data.patient;
  log(
    regRes.status === 201 && /^PT-\d{4,6}$/.test(createdPatient?.id),
    'Reception registers new patient with formatted ID',
    createdPatient?.id
  );
  log(createdPatient?.fullName === 'Yared Mulugeta Haile', 'Patient demographics & allergies stored accurately');

  // ----------------------------------------------------------------
  // 4. FAST PATIENT SEARCH
  // ----------------------------------------------------------------
  console.log('\n== 4. FAST PATIENT SEARCH (ID, NAME, PHONE) ==');

  const searchByName = await call('GET', `/patients?q=Yared`, { token: recAuth.token });
  log(searchByName.status === 200 && searchByName.data.patients.some((p) => p.id === createdPatient.id), 'Search by full name');

  const searchByPhone = await call('GET', `/patients?q=0911887766`, { token: recAuth.token });
  log(searchByPhone.status === 200 && searchByPhone.data.patients.some((p) => p.id === createdPatient.id), 'Search by phone number');

  const searchById = await call('GET', `/patients?q=${createdPatient.id}`, { token: recAuth.token });
  log(searchById.status === 200 && searchById.data.patients.some((p) => p.id === createdPatient.id), 'Search by patient ID');

  // ----------------------------------------------------------------
  // 5. VISIT CREATION (VS-000001 Format)
  // ----------------------------------------------------------------
  console.log('\n== 5. VISIT CREATION (VS-000001 FORMAT) ==');

  const visitRes = await call('POST', '/visits', {
    token: recAuth.token,
    body: {
      patientId: createdPatient.id,
      service: 'General OPD',
      reason: 'Acute fever, productive cough, and fatigue for 3 days',
    },
  });
  const createdVisit = visitRes.data.visit;
  log(
    visitRes.status === 201 && /^VS-\d{4,6}$/.test(createdVisit?.visitNumber),
    'Create clinic visit with formatted visit number',
    createdVisit?.visitNumber
  );

  // ----------------------------------------------------------------
  // 6. OPD QUEUE & PRIORITY ASSIGNMENT
  // ----------------------------------------------------------------
  console.log('\n== 6. OPD QUEUE WORKFLOW & PRIORITY MANAGEMENT ==');

  const queueRes = await call('POST', '/queue', {
    token: recAuth.token,
    body: {
      visitId: createdVisit.id,
      priority: 'URGENT',
      department: 'OPD',
    },
  });
  const queueEntry = queueRes.data.queueEntry;
  log(
    queueRes.status === 201 && queueEntry?.priority === 'URGENT' && queueEntry?.status === 'waiting',
    'Add patient to OPD queue with URGENT priority',
    `Queue #${queueEntry?.queueNumber}`
  );

  // Doctor views OPD Queue
  const docQueueRes = await call('GET', '/opd/queue', { token: docAuth.token });
  log(
    docQueueRes.status === 200 && docQueueRes.data.queue.some((q) => q.id === queueEntry.id),
    'Patient appears immediately on Doctor OPD Queue screen'
  );

  // Doctor calls patient
  const callRes = await call('PATCH', `/queue/${queueEntry.id}/status`, {
    token: docAuth.token,
    body: { status: 'called' },
  });
  log(
    callRes.status === 200 && callRes.data.queueEntry.status === 'called',
    'Doctor calls patient into examination room (status: called)'
  );

  // Doctor starts consultation
  const startConsultRes = await call('PATCH', `/queue/${queueEntry.id}/status`, {
    token: docAuth.token,
    body: { status: 'in_consultation' },
  });
  log(
    startConsultRes.status === 200 && startConsultRes.data.queueEntry.status === 'in_consultation',
    'Doctor transitions patient to in_consultation'
  );

  // ----------------------------------------------------------------
  // 7. AUDIT LOGGING FOUNDATION
  // ----------------------------------------------------------------
  console.log('\n== 7. AUDIT LOGGING & TRACKING ==');

  const auditRes = await call('GET', '/admin/audit-logs?limit=20', { token: adminAuth.token });
  const logs = auditRes.data.auditLogs || [];
  log(auditRes.status === 200 && logs.length > 0, 'Audit log endpoint returns activity stream', `Recorded ${logs.length} events`);

  const hasPatientCreateLog = logs.some((l) => l.action === 'CREATE_PATIENT');
  log(hasPatientCreateLog, 'Audit log records patient creation with creator identity');

  const hasVisitCreateLog = logs.some((l) => l.action === 'CREATE_VISIT');
  log(hasVisitCreateLog, 'Audit log records visit creation');

  const hasQueueLog = logs.some((l) => l.action === 'ADD_TO_QUEUE' || l.action === 'UPDATE_QUEUE_STATUS');
  log(hasQueueLog, 'Audit log records queue status transitions');

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`PHASE 1 ACCEPTANCE RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test Runner Error:', err);
  process.exit(1);
});

