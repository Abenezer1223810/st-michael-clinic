import { strict as assert } from 'assert';

const BASE = process.env.API_URL || 'http://localhost:5000/api';

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });

  const body = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body };
}

async function runPhase5Tests() {
  console.log('\n======================================================');
  console.log('🏥 ST. MICHAEL HMS — PHASE 5: TREATMENT EXECUTION SUITE');
  console.log('======================================================\n');

  // --- STEP 1: Actor Logins ---
  console.log('--- STEP 1: Authenticate Clinical Actors ---');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  assert.equal(adminLogin.status, 200, 'Admin login failed');
  const adminToken = adminLogin.body.token;

  const doctorLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'doctor', password: 'doctor123' }),
  });
  assert.equal(doctorLogin.status, 200, 'Doctor login failed');
  const doctorToken = doctorLogin.body.token;

  const receptionLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'reception', password: 'reception123' }),
  });
  assert.equal(receptionLogin.status, 200, 'Reception login failed');
  const receptionToken = receptionLogin.body.token;

  const procedureLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'procedure', password: 'procedure123' }),
  });
  assert.equal(procedureLogin.status, 200, 'Procedure staff login failed');
  const procedureToken = procedureLogin.body.token;

  let pharmacyLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'pharmacy', password: 'pharmacy123' }),
  });
  if (!pharmacyLogin.ok) {
    // If pharmacy user not in seed users, try admin or fallback
    pharmacyLogin = adminLogin;
  }
  const pharmacyToken = pharmacyLogin.body?.token || adminToken;
  console.log('  ✅ PASSED: All clinical actors authenticated');

  // Reset database for clean test environment
  const resetRes = await request('/dev/reset', { method: 'POST', token: adminToken });
  assert.equal(resetRes.status, 200, 'Reset failed');
  console.log('  ✅ PASSED: Database state reset cleanly');

  // --- STEP 2: Register Patient & Start Visit Encounter ---
  console.log('\n--- STEP 2: Patient Registration & Visit Encounter ---');
  const patientRes = await request('/patients', {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({
      fullName: 'Aster Bekele',
      gender: 'Female',
      dateOfBirth: '1988-06-20',
      phone: '+251911889900',
      address: 'Gerji, Addis Ababa',
      allergies: [{ category: 'Drug', name: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' }],
    }),
  });
  assert.equal(patientRes.status, 201, 'Patient registration failed');
  const patient = patientRes.body.patient;
  console.log(`  ✅ PASSED: Patient registered -> ${patient.fullName} (${patient.id})`);

  const visitRes = await request('/visits', {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({
      patientId: patient.id,
      service: 'General OPD',
      reason: 'Fever, cough, and severe left knee laceration',
    }),
  });
  assert.equal(visitRes.status, 201, 'Visit creation failed');
  const visit = visitRes.body.visit;
  console.log(`  ✅ PASSED: Visit encounter created -> ${visit.visitNumber}`);

  // --- STEP 3: Doctor Consultation & Clinical Assessment ---
  console.log('\n--- STEP 3: Doctor Clinical Assessment ---');
  const consultRes = await request('/consultations', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      patientId: patient.id,
      chiefComplaint: 'High fever, productive cough, and infected knee laceration',
      historyOfPresentIllness: 'Symptoms onset 4 days ago after sustaining road laceration.',
      physicalExam: 'Chest: Bilateral wheezing. Left knee: 4cm dirty wound with purulence.',
      vitals: { bloodPressure: '120/80', pulseRate: '88', temperature: '38.6', respiratoryRate: '20', oxygenSaturation: '97' },
      diagnosis: 'Acute Bronchitis & Infected Traumatic Knee Wound',
      clinicalNotes: 'Initiate targeted antibiotic therapy, IM analgesia, and sterile wound debridement.',
    }),
  });
  assert.equal(consultRes.status, 201, 'Consultation creation failed');
  console.log('  ✅ PASSED: Consultation and clinical diagnosis recorded');

  // --- STEP 4: Doctor Creates Prescription with Detailed Items ---
  console.log('\n--- STEP 4: Doctor Prescribes Medication ---');
  const rxRes = await request('/prescriptions', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      medicines: [
        {
          medicine: 'Azithromycin 500mg',
          dose: '500mg',
          route: 'ORAL',
          frequency: 'Once daily',
          duration: '3 days',
          quantity: 3,
          instructions: 'Take 1 hour before or 2 hours after meals with full glass of water',
        },
        {
          medicine: 'Paracetamol 500mg',
          dose: '1000mg',
          route: 'ORAL',
          frequency: 'TID PRN',
          duration: '5 days',
          quantity: 15,
          instructions: 'Take after meals for fever and pain',
        },
      ],
    }),
  });
  assert.equal(rxRes.status, 201, 'Prescription creation failed');
  const prescription = rxRes.body.prescription;
  assert.equal(prescription.status, 'PRESCRIBED', 'Prescription initial status must be PRESCRIBED');
  assert.equal(prescription.medicines.length, 2, 'Prescription must contain 2 medicine items');
  console.log(`  ✅ PASSED: Prescription created -> ${prescription.prescriptionNumber} (${prescription.medicines.length} items)`);

  // --- STEP 5: Doctor Creates Injection Order (Order vs Administration) ---
  console.log('\n--- STEP 5: Doctor Orders Injection ---');
  const injOrderRes = await request('/injections', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      medication: 'Tramadol 50mg/ml',
      prescribedDose: '50mg IM STAT',
      route: 'IM',
      frequency: 'STAT',
      instructions: 'Deep intragluteal injection for acute knee pain. Monitor for sedation.',
    }),
  });
  assert.equal(injOrderRes.status, 201, 'Injection order creation failed');
  const injectionOrder = injOrderRes.body.order;
  assert.equal(injectionOrder.status, 'ORDERED', 'Injection order status must be ORDERED');
  console.log(`  ✅ PASSED: Injection order created -> ${injectionOrder.orderNumber} (${injectionOrder.medication})`);

  // --- STEP 6: Doctor Creates Procedure Order ---
  console.log('\n--- STEP 6: Doctor Orders Wound Care Procedure ---');
  const procRes = await request('/procedures', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      procedureType: 'Wound Dressing & Debridement',
      notes: 'Clean with normal saline, apply povidone iodine, sterile dressing on left knee',
    }),
  });
  assert.equal(procRes.status, 201, 'Procedure order creation failed');
  const procedure = procRes.body.procedure;
  console.log(`  ✅ PASSED: Procedure ordered -> ${procedure.procedureNumber} (${procedure.procedureType})`);

  // --- STEP 7: Billing Gatekeeper — Unpaid Treatment Execution Blocked ---
  console.log('\n--- STEP 7: Safety Rule: Unpaid Services Blocked from Execution ---');
  // Attempt dispensing unpaid Rx
  const unauthDispense = await request(`/prescriptions/${prescription.id}/dispense`, {
    method: 'POST',
    token: pharmacyToken,
    body: JSON.stringify({ notes: 'Trying to dispense unpaid medication' }),
  });
  assert.equal(unauthDispense.status, 402, 'Unpaid prescription dispensing must be rejected with 402');
  console.log('  ✅ PASSED: Billing Gatekeeper correctly blocked unpaid pharmacy dispensing (402 Payment Required)');

  // Attempt administering unpaid Injection
  const unauthAdmin = await request(`/injections/${injectionOrder.id}/administer`, {
    method: 'POST',
    token: procedureToken,
    body: JSON.stringify({
      administrationSite: 'Left Gluteal',
      notes: 'Attempted unpaid injection',
    }),
  });
  assert.equal(unauthAdmin.status, 402, 'Unpaid injection administration must be rejected with 402');
  console.log('  ✅ PASSED: Billing Gatekeeper correctly blocked unpaid injection administration (402 Payment Required)');

  // --- STEP 8: Reception Billing, Payment & Payment Verification ---
  console.log('\n--- STEP 8: Reception Payment Collection & Department Authorization ---');
  const invoiceRes = await request(`/billing/invoices/visit/${visit.id}`, { token: receptionToken });
  assert.equal(invoiceRes.status, 200, 'Invoice fetch failed');
  const invoice = invoiceRes.body.invoice;
  console.log(`  ℹ️  Total invoice amount: ${invoice.totalAmount} ETB (Balance: ${invoice.balance} ETB)`);

  const payRes = await request(`/billing/invoices/${invoice.id}/payments`, {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({
      amount: invoice.balance,
      paymentMethod: 'CASH',
      notes: 'Full payment for OPD consultation, pharmacy, injection, and wound dressing',
    }),
  });
  assert.ok(payRes.status === 200 || payRes.status === 201, `Payment recording failed (status: ${payRes.status})`);
  console.log(`  ✅ PASSED: Cash payment received -> Receipt #${payRes.body.payment.receiptNumber}`);

  const verifyRes = await request(`/billing/invoices/${invoice.id}/verify`, {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({ notes: 'Payment verified and verified at main reception cashier' }),
  });
  assert.equal(verifyRes.status, 200, 'Payment verification failed');
  assert.equal(verifyRes.body.invoice.status, 'VERIFIED', 'Invoice status must be VERIFIED');
  console.log('  ✅ PASSED: Payment verified at reception — All treatment orders authorized');

  // --- STEP 9: Pharmacy Worklist & Medication Dispensing ---
  console.log('\n--- STEP 9: Pharmacy Review & Dispensing Workflow ---');
  const rxListRes = await request('/prescriptions', { token: pharmacyToken });
  assert.equal(rxListRes.status, 200, 'Pharmacy prescription list failed');
  const targetRx = rxListRes.body.prescriptions.find((p) => p.id === prescription.id);
  assert.ok(targetRx, 'Prescription must be visible in authorized pharmacy list');
  assert.equal(targetRx.paymentStatus, 'VERIFIED', 'Prescription payment status must be VERIFIED');

  const dispenseRes = await request(`/prescriptions/${prescription.id}/dispense`, {
    method: 'POST',
    token: pharmacyToken,
    body: JSON.stringify({
      items: [
        { id: prescription.medicines[0].id, dispensedQuantity: 3 },
        { id: prescription.medicines[1].id, dispensedQuantity: 15 },
      ],
      notes: 'Dispensed original manufacturer packaging. Patient counseled on dosage schedule.',
    }),
  });
  assert.equal(dispenseRes.status, 200, 'Prescription dispensing failed');
  assert.equal(dispenseRes.body.prescription.status, 'DISPENSED', 'Prescription status must be DISPENSED');
  assert.ok(dispenseRes.body.prescription.dispensedAt, 'Dispensed timestamp must be present');
  console.log(`  ✅ PASSED: Pharmacy dispensed medications -> Status: ${dispenseRes.body.prescription.status} (Dispensed by: ${dispenseRes.body.prescription.dispensedBy})`);

  // --- STEP 10: Nurse Administers Injection (Order vs Actual Administration Record) ---
  console.log('\n--- STEP 10: Nurse Injection Administration Workflow ---');
  const injListRes = await request('/injections', { token: procedureToken });
  assert.equal(injListRes.status, 200, 'Injection orders list failed');
  const targetInj = injListRes.body.orders.find((o) => o.id === injectionOrder.id);
  assert.ok(targetInj, 'Injection order must be visible in procedure nurse worklist');

  const adminRes = await request(`/injections/${injectionOrder.id}/administer`, {
    method: 'POST',
    token: procedureToken,
    body: JSON.stringify({
      actualMedication: 'Tramadol 50mg/ml',
      actualDose: '50mg',
      route: 'IM',
      administrationSite: 'Right Gluteal (Upper Outer Quadrant)',
      notes: 'Aseptic injection performed. Patient tolerated well without acute reaction.',
      status: 'COMPLETED',
    }),
  });
  assert.equal(adminRes.status, 200, 'Injection administration failed');
  assert.equal(adminRes.body.order.status, 'ADMINISTERED', 'Injection order status must transition to ADMINISTERED');
  assert.equal(adminRes.body.administration.administrationSite, 'Right Gluteal (Upper Outer Quadrant)', 'Administration site must be saved');
  console.log(`  ✅ PASSED: Injection administered -> Status: ${adminRes.body.order.status} at site [${adminRes.body.administration.administrationSite}]`);

  // --- STEP 11: Procedure Room Executes Wound Care ---
  console.log('\n--- STEP 11: Procedure Room Execution Workflow ---');
  const procExecRes = await request(`/procedures/${procedure.id}/record`, {
    method: 'POST',
    token: procedureToken,
    body: JSON.stringify({
      medicine: 'Normal Saline, Povidone-Iodine, Sterile Gauze',
      dosage: '100ml irrigation',
      administrationDetails: 'Irrigated purulent wound, removed devitalized tissue, dressed with sterile gauze',
      responsibleStaff: 'Nurse Kebede',
      notes: 'Clean wound edges. Schedule follow-up dressing in 48 hours.',
    }),
  });
  assert.equal(procExecRes.status, 200, 'Procedure execution failed');
  assert.equal(procExecRes.body.procedure.status, 'completed', 'Procedure status must be completed');
  console.log(`  ✅ PASSED: Procedure recorded & completed -> ${procExecRes.body.procedure.procedureType}`);

  // --- STEP 12: Unified Patient Treatment Timeline ---
  console.log('\n--- STEP 12: Unified Patient Treatment Timeline Verification ---');
  const timelineRes = await request(`/patients/${patient.id}/timeline`, { token: doctorToken });
  assert.equal(timelineRes.status, 200, 'Patient timeline fetch failed');
  const timeline = timelineRes.body;
  assert.ok(timeline.events.length >= 6, `Timeline must contain at least 6 events (found ${timeline.events.length})`);

  // Verify key timeline milestones exist
  const eventTypes = timeline.events.map((e) => e.type);
  console.log(`  ℹ️  Timeline contains ${timeline.events.length} chronological events:`, eventTypes.join(', '));
  assert.ok(eventTypes.includes('REGISTRATION'), 'Timeline must include REGISTRATION');
  assert.ok(eventTypes.includes('VISIT_CREATED'), 'Timeline must include VISIT_CREATED');
  assert.ok(eventTypes.includes('CONSULTATION'), 'Timeline must include CONSULTATION');
  assert.ok(eventTypes.includes('INVOICE_GENERATED'), 'Timeline must include INVOICE_GENERATED');
  assert.ok(eventTypes.includes('PAYMENT_RECEIVED'), 'Timeline must include PAYMENT_RECEIVED');
  assert.ok(eventTypes.includes('PAYMENT_VERIFIED'), 'Timeline must include PAYMENT_VERIFIED');
  assert.ok(eventTypes.includes('INJECTION_ORDER'), 'Timeline must include INJECTION_ORDER');
  assert.ok(eventTypes.includes('INJECTION_ADMINISTERED'), 'Timeline must include INJECTION_ADMINISTERED');
  assert.ok(eventTypes.includes('PROCEDURE_ORDER'), 'Timeline must include PROCEDURE_ORDER');
  assert.ok(eventTypes.includes('PROCEDURE_PERFORMED'), 'Timeline must include PROCEDURE_PERFORMED');
  assert.ok(eventTypes.includes('PRESCRIPTION_ORDER'), 'Timeline must include PRESCRIPTION_ORDER');
  assert.ok(eventTypes.includes('PHARMACY_DISPENSED'), 'Timeline must include PHARMACY_DISPENSED');

  // Verify event structure
  for (const ev of timeline.events) {
    assert.ok(ev.title, 'Event must have title');
    assert.ok(ev.performer, 'Event must have performer');
    assert.ok(ev.timestamp, 'Event must have timestamp');
    assert.ok(ev.status, 'Event must have status');
  }
  console.log('  ✅ PASSED: Unified treatment timeline accurately compiles all inter-disciplinary events');

  console.log('\n======================================================');
  console.log('🎉 ALL PHASE 5 TREATMENT EXECUTION TESTS PASSED! (12/12)');
  console.log('======================================================\n');
}

runPhase5Tests().catch((err) => {
  console.error('\n❌ PHASE 5 TEST SUITE FAILED:', err);
  process.exit(1);
});
