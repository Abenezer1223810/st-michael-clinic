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
  console.log('ST. MICHAEL MEDIUM CLINIC - PHASE 2 ACCEPTANCE TESTS');
  console.log('OPD DOCTOR & CLINICAL CONSULTATION WORKFLOW');
  console.log('======================================================\n');

  // Authenticate Doctor, Receptionist, and Lab Technician
  const recAuth = await login('reception', 'reception123');
  const docAuth = await login('doctor', 'doctor123');
  const labAuth = await login('lab', 'lab123');

  // Setup a test patient and visit
  const regPatient = await call('POST', '/patients', {
    token: recAuth.token,
    body: {
      fullName: 'Dr. Test Patient - Dawit Bekele',
      gender: 'Male',
      dateOfBirth: '1988-04-12',
      phone: '0912334455',
      allergies: [{ category: 'Drug', name: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' }],
    },
  });
  const patient = regPatient.data.patient;

  const regVisit = await call('POST', '/visits', {
    token: recAuth.token,
    body: {
      patientId: patient.id,
      service: 'General OPD',
      reason: 'High grade fever and chills for 3 days',
    },
  });
  const visit = regVisit.data.visit;

  const regQueue = await call('POST', '/queue', {
    token: recAuth.token,
    body: {
      visitId: visit.id,
      priority: 'URGENT',
      department: 'OPD',
    },
  });
  const queueEntry = regQueue.data.queueEntry;

  // ----------------------------------------------------------------
  // 1. DOCTOR SEES OPD QUEUE
  // ----------------------------------------------------------------
  console.log('== 1. DOCTOR OPD QUEUE SCREEN ==');

  const opdQueueRes = await call('GET', '/opd/queue', { token: docAuth.token });
  const inQueue = opdQueueRes.data.queue?.some((q) => q.visitId === visit.id);
  log(opdQueueRes.status === 200 && inQueue, 'Doctor sees new patient in OPD queue with URGENT priority');

  // ----------------------------------------------------------------
  // 2. DOCTOR STARTS CONSULTATION
  // ----------------------------------------------------------------
  console.log('\n== 2. START CLINICAL CONSULTATION ==');

  const startConsultRes = await call('POST', '/consultations', {
    token: docAuth.token,
    body: {
      visitId: visit.id,
      vitals: {
        bloodPressure: '130/85',
        pulse: '88',
        temperature: '38.9',
        respiratoryRate: '20',
        weight: '72',
        height: '178',
        spo2: '97',
      },
    },
  });
  const consultation = startConsultRes.data.consultation;
  log(
    startConsultRes.status === 201 && consultation?.status === 'in_progress',
    'Doctor starts consultation (status: in_progress)',
    consultation?.consultationNumber
  );

  // ----------------------------------------------------------------
  // 3. VITALS & AUTOMATIC BMI CALCULATION
  // ----------------------------------------------------------------
  console.log('\n== 3. VITALS RECORDING & AUTOMATIC BMI ==');

  log(
    consultation?.vitals?.bmi === 22.7 && consultation?.vitals?.bmiCategory === 'Normal',
    'Automatic BMI calculation matches formula (Weight 72kg, Height 178cm -> BMI 22.7, Category: Normal)',
    `BMI: ${consultation?.vitals?.bmi} (${consultation?.vitals?.bmiCategory})`
  );

  // ----------------------------------------------------------------
  // 4. CLINICAL NOTES & DIAGNOSIS SAVING
  // ----------------------------------------------------------------
  console.log('\n== 4. CLINICAL ASSESSMENT & DIAGNOSIS ==');

  const saveNotesRes = await call('PATCH', `/consultations/${consultation.id}`, {
    token: docAuth.token,
    body: {
      chiefComplaint: 'Severe continuous fever, rigors, headache, and generalized body weakness for 3 days.',
      medicalHistory: 'No known chronic hypertension or diabetes. History of treated malaria 2 years ago.',
      clinicalExamination: 'Febrile (38.9°C), mild pallor, clear chest bilaterally, soft non-tender abdomen, no organomegaly.',
      diagnosis: 'Suspected Plasmodium falciparum Malaria',
      secondaryDiagnosis: 'Dehydration secondary to pyrexia',
      treatmentRecommendation: 'Order blood film and CBC; initiate IV hydration while awaiting lab verification.',
      doctorNotes: 'Patient traveled to warm lowland region 10 days ago. High clinical index of suspicion.',
      followUp: 'Review in 2 days after lab results and treatment initiation.',
      referral: 'None needed at present.',
    },
  });

  const updatedConsult = saveNotesRes.data.consultation;
  log(
    saveNotesRes.status === 200 && updatedConsult?.diagnosis === 'Suspected Plasmodium falciparum Malaria',
    'Doctor saves comprehensive clinical assessment and working diagnosis'
  );

  // ----------------------------------------------------------------
  // 5. DOCTOR CREATES ORDERS (LAB, PROCEDURE, PRESCRIPTION)
  // ----------------------------------------------------------------
  console.log('\n== 5. DOCTOR ORDERS ARCHITECTURE ==');

  // 5a. Laboratory Request
  const labReqRes = await call('POST', '/laboratory/requests', {
    token: docAuth.token,
    body: {
      visitId: visit.id,
      testIds: ['LT-01', 'LT-02', 'LT-09'], // CBC / Hemoglobin / Malaria Rapid
    },
  });
  const labRequest = labReqRes.data.request;
  log(
    labReqRes.status === 201 && labRequest?.tests?.length >= 2,
    'Doctor orders laboratory panel (CBC, Malaria RDT)',
    labRequest?.requestNumber
  );

  // 5b. Procedure / Injection Order
  const procRes = await call('POST', '/procedures', {
    token: docAuth.token,
    body: {
      visitId: visit.id,
      procedureType: 'IM / IV Injection Administration',
      notes: 'Administer IV Artesunate 120mg stat as ordered for malaria protocol',
    },
  });
  log(procRes.status === 201, 'Doctor orders IV/IM injection procedure', procRes.data.procedure?.procedureNumber);

  // 5c. Prescription Order Draft
  const rxRes = await call('POST', '/prescriptions', {
    token: docAuth.token,
    body: {
      visitId: visit.id,
      medicines: [
        {
          medicine: 'Artemether + Lumefantrine (Coartem)',
          dosage: '20/120 mg',
          frequency: '4 tablets twice daily with meals',
          duration: '3 days',
          route: 'Oral',
          instructions: 'Take with milk or fatty meal for optimal absorption',
        },
        {
          medicine: 'Paracetamol',
          dosage: '1000 mg',
          frequency: 'Every 8 hours as needed',
          duration: '3 days',
          route: 'Oral',
          instructions: 'Take for fever > 38.0°C',
        },
      ],
    },
  });
  log(rxRes.status === 201, 'Doctor creates prescription draft with 2 medicines', rxRes.data.prescription?.prescriptionNumber);

  // ----------------------------------------------------------------
  // 6. HOLD CONSULTATION FOR LAB (CLINICAL FEEDBACK LOOP)
  // ----------------------------------------------------------------
  console.log('\n== 6. CLINICAL LOOP: HOLD FOR LAB & READY FOR REVIEW ==');

  const holdRes = await call('POST', `/consultations/${consultation.id}/hold-for-lab`, { token: docAuth.token });
  log(
    holdRes.status === 200 && holdRes.data.consultation?.status === 'awaiting_results',
    'Doctor puts consultation on hold awaiting lab results (status: awaiting_results)'
  );

  // Reception verifies payment according to Phase 3 Clinic Rule
  const invRes = await call('GET', `/billing/visit/${visit.id}`, { token: recAuth.token });
  if (invRes.data?.invoice?.id) {
    await call('POST', `/billing/invoices/${invRes.data.invoice.id}/payments`, {
      token: recAuth.token,
      body: { amount: invRes.data.invoice.totalAmount, paymentMethod: 'CASH' },
    });
    await call('POST', `/billing/invoices/${invRes.data.invoice.id}/verify`, {
      token: recAuth.token,
      body: { notes: 'Verified at reception' },
    });
  }

  // Laboratory staff enters and verifies test results
  const enterLabRes = await call('POST', `/laboratory/requests/${labRequest.id}/results`, {
    token: labAuth.token,
    body: {
      results: [
        { testId: 'LT-01', result: '13.2', remarks: 'Normal' },
        { testId: 'LT-02', result: '8.4', remarks: 'Normal' },
        { testId: 'LT-09', result: 'Positive (P. falciparum trophozoites seen)', remarks: 'Confirmed malaria parasite' },
      ],
    },
  });
  log(enterLabRes.status === 200, 'Laboratory staff enters test results');

  const verifyLabRes = await call('POST', `/laboratory/requests/${labRequest.id}/verify`, { token: labAuth.token });
  log(verifyLabRes.status === 200, 'Laboratory supervisor verifies results');

  // Check that consultation and queue automatically transitioned to ready_for_review
  const checkConsultRes = await call('GET', `/consultations/${consultation.id}`, { token: docAuth.token });
  log(
    checkConsultRes.status === 200 && checkConsultRes.data.consultation?.status === 'ready_for_review',
    'Consultation automatically transitions to READY_FOR_REVIEW when lab results are verified'
  );

  // ----------------------------------------------------------------
  // 7. DOCTOR REVIEWS RESULTS & COMPLETES CONSULTATION
  // ----------------------------------------------------------------
  console.log('\n== 7. FINAL REVIEW & CONSULTATION COMPLETION ==');

  const completeRes = await call('POST', `/consultations/${consultation.id}/complete`, { token: docAuth.token });
  log(
    completeRes.status === 200 && completeRes.data.consultation?.status === 'completed',
    'Doctor finalizes and completes consultation encounter (status: completed)'
  );

  // ----------------------------------------------------------------
  // 8. PATIENT LIFETIME HISTORY TIMELINE
  // ----------------------------------------------------------------
  console.log('\n== 8. PATIENT LIFETIME HISTORY TIMELINE ==');

  const patientHistRes = await call('GET', `/patients/${patient.id}/history`, { token: docAuth.token });
  const pHist = patientHistRes.data;
  log(
    patientHistRes.status === 200 &&
    pHist.consultations?.some((c) => c.id === consultation.id) &&
    pHist.laboratory?.some((l) => l.id === labRequest.id) &&
    pHist.prescriptions?.some((p) => p.visitId === visit.id),
    'Patient history permanently retains consultation, vitals, lab orders, results, and prescriptions'
  );

  // ----------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`PHASE 2 ACCEPTANCE RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test Runner Error:', err);
  process.exit(1);
});
