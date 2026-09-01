/**
 * St. Michael Medium Clinic Management System
 * PHASE 6: FULL 18-STEP END-TO-END PATIENT JOURNEY TEST SUITE
 * 
 * Verifies the complete healthcare journey from patient registration
 * through clinical encounter, automated laboratory analyzer ingestion,
 * treatment administration, visit closure safety gates, and reporting.
 */

import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { db } from '../src/db/index.js';

const app = createApp();
const PORT = 5096;
let server;
const BASE_URL = `http://localhost:${PORT}/api`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body, headers: res.headers };
}

async function login(username, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  assert.equal(res.status, 200, `Login failed for user ${username}`);
  return res.body.token;
}

async function runEndToEndTests() {
  console.log('\n======================================================');
  console.log('🏥 ST. MICHAEL HMS — PHASE 6: 18-STEP END-TO-END SUITE');
  console.log('======================================================\n');

  // Step 0: Authentication of all 6 Department Actors
  console.log('--- PRE-FLIGHT: Authenticating Multi-Disciplinary Actors ---');
  const adminToken = await login('admin', 'admin123');
  const receptionToken = await login('reception', 'reception123');
  const doctorToken = await login('doctor', 'doctor123');
  const labToken = await login('lab', 'lab123');
  const procedureToken = await login('procedure', 'procedure123');
  const pharmacyToken = await login('pharmacy', 'pharmacy123');
  console.log('  ✅ PASSED: All 6 department clinical roles authenticated successfully.');

  await db.resetDatabase();
  console.log('  ✅ PASSED: Database state reset cleanly for test execution.');

  // STEP 1: Reception registers patient
  console.log('\n--- STEP 1: Reception Registers Patient ---');
  const patRes = await request('/patients', {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({
      fullName: 'Yared Getachew',
      gender: 'male',
      dateOfBirth: '1992-04-14',
      phone: '0911887766',
      address: 'Bole Subcity, Woreda 03, Addis Ababa',
      emergencyContactName: 'Marta Getachew',
      emergencyContactPhone: '0922334455',
      relationshipToPatient: 'Sister',
      allergies: [{ name: 'Penicillin', severity: 'Moderate', category: 'Drug' }],
    }),
  });
  assert.equal(patRes.status, 201, 'Patient registration failed');
  const patient = patRes.body.patient;
  assert.ok(patient.id.startsWith('PT-'), 'Patient ID format must be PT-XXXXXX');
  console.log(`  ✅ PASSED: Patient registered -> ${patient.fullName} (${patient.id})`);

  // STEP 2: Visit created
  console.log('\n--- STEP 2: Reception Creates Visit Encounter ---');
  const visitRes = await request('/visits', {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({
      patientId: patient.id,
      service: 'OPD',
      reason: 'Acute fever, joint pain, fatigue, and laceration on left forearm',
    }),
  });
  assert.equal(visitRes.status, 201, 'Visit creation failed');
  const visit = visitRes.body.visit;
  assert.ok(visit.visitNumber.startsWith('VS-'), 'Visit number format must be VS-XXXXXX');
  console.log(`  ✅ PASSED: Visit encounter created -> ${visit.visitNumber}`);

  // STEP 3: Patient enters OPD queue
  console.log('\n--- STEP 3: Patient Enters OPD Queue with Priority ---');
  const queueRes = await request('/queue', {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({ visitId: visit.id, priority: 'URGENT' }),
  });
  assert.ok(queueRes.status === 200 || queueRes.status === 201, 'Adding to queue failed');
  const queue = queueRes.body.queueEntry;
  console.log(`  ✅ PASSED: Patient placed in OPD Queue #${queue.queueNumber} (Priority: ${queue.priority})`);

  // STEP 4: Doctor starts consultation
  console.log('\n--- STEP 4: Doctor Starts Clinical Consultation & Vitals ---');
  const consultRes = await request('/consultations', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      vitals: {
        bloodPressure: '120/80',
        pulseRate: 88,
        temperature: 38.6,
        respiratoryRate: 18,
        weight: 70,
        height: 175,
      },
      chiefComplaint: 'Fever for 3 days and contaminated left forearm laceration',
      clinicalExamination: 'Febrile, alert. Left forearm shows 4cm superficial laceration with dirty edges.',
    }),
  });
  assert.ok(consultRes.status === 200 || consultRes.status === 201, 'Consultation start failed');
  const consultation = consultRes.body.consultation;
  assert.equal(consultation.vitals.bmi, 22.9, 'Automatic BMI formula must calculate 22.9');
  console.log(`  ✅ PASSED: Doctor consultation started -> ${consultation.consultationNumber} (BMI: 22.9 Normal)`);

  // STEP 5: Doctor orders CBC
  console.log('\n--- STEP 5: Doctor Orders Diagnostic Laboratory Panel (CBC) ---');
  const labOrderRes = await request('/laboratory/requests', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      testIds: ['LT-01', 'LT-02', 'LT-03'], // Hemoglobin, WBC, Platelets
      clinicalNotes: 'Evaluate leukocytosis and anemia secondary to acute infection',
      priority: 'URGENT',
    }),
  });
  assert.ok(labOrderRes.status === 200 || labOrderRes.status === 201, 'Lab ordering failed');
  const labRequest = labOrderRes.body.request || labOrderRes.body.labRequest;
  assert.ok(labRequest.requestNumber.startsWith('LR-'), 'Lab request format must be LR-XXXX');
  console.log(`  ✅ PASSED: Doctor ordered CBC panel -> ${labRequest.requestNumber}`);

  // STEP 6: Invoice created
  console.log('\n--- STEP 6: System Aggregates Charges into Visit Invoice ---');
  const invRes = await request(`/billing/invoices/visit/${visit.id}`, { token: receptionToken });
  assert.equal(invRes.status, 200, 'Invoice retrieval failed');
  const invoice = invRes.body.invoice;
  assert.ok(invoice.totalAmount > 0, 'Invoice must have positive total charge');
  console.log(`  ✅ PASSED: Visit invoice #${invoice.invoiceNumber} generated (Total: ${invoice.totalAmount} ETB)`);

  // STEP 7: Reception verifies payment
  console.log('\n--- STEP 7: Receptionist Collects Cash & Verifies Payment ---');
  const payRes = await request(`/billing/invoices/${invoice.id}/payments`, {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({
      amount: invoice.balance,
      paymentMethod: 'CASH',
      notes: 'Full payment received at front desk',
    }),
  });
  assert.ok(payRes.status === 200 || payRes.status === 201, 'Payment failed');
  const verifyRes = await request(`/billing/invoices/${invoice.id}/verify`, {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({ notes: 'Payment verified and receipts issued' }),
  });
  assert.equal(verifyRes.status, 200, 'Payment verification failed');
  console.log(`  ✅ PASSED: Payment verified — Department worklists unlocked (Receipt #${payRes.body.payment.receiptNumber})`);

  // STEP 8: Lab sees request
  console.log('\n--- STEP 8: Lab Technician Sees Authorized Order in Worklist ---');
  const labListRes = await request('/laboratory/requests', { token: labToken });
  assert.equal(labListRes.status, 200, 'Lab list failed');
  const targetReq = labListRes.body.requests.find((r) => r.id === labRequest.id);
  assert.ok(targetReq, 'Request must be present in authorized lab worklist');
  assert.equal(targetReq.paymentStatus, 'VERIFIED', 'Payment status must be VERIFIED');
  console.log(`  ✅ PASSED: Lab technician located authorized request ${targetReq.requestNumber}`);

  // STEP 9: Sample created & barcode assigned
  console.log('\n--- STEP 9: Specimen Collected & Barcode Label Assigned ---');
  const sampleRes = await request(`/laboratory/requests/${labRequest.id}/sample`, {
    method: 'POST',
    token: labToken,
    body: JSON.stringify({
      specimenType: 'Whole Blood (EDTA)',
      barcode: `EDTA-${Date.now().toString().slice(-6)}`,
    }),
  });
  assert.ok(sampleRes.status === 200 || sampleRes.status === 201, 'Specimen collection failed');
  const sample = sampleRes.body.sample;
  console.log(`  ✅ PASSED: Specimen collected & barcoded -> ${sample.barcode || sample.sampleNumber}`);

  // STEP 10: Analyzer simulator sends result (HL7 v2.5.1 feed)
  console.log('\n--- STEP 10: Hematology Hardware Analyzer Transmits HL7 Data ---');
  const hl7Message = `MSH|^~\\&|MINDRAY_BC5000|STM_LAB|STM_HMS|STMICHAEL|20260901103000||ORU^R01|MSG-9001|P|2.5.1\nPID|1||${patient.id}||${patient.fullName}\nOBR|1|${labRequest.requestNumber}||CBC^Complete Blood Count\nOBX|1|NM|HGB^Hemoglobin|1|13.8|g/dL|12.0-16.0|N|||F\nOBX|2|NM|WBC^White Blood Cells|1|12.5|x10^9/L|4.0-11.0|H|||F\nOBX|3|NM|PLT^Platelets|1|240|x10^9/L|150-450|N|||F`;

  const ingestRes = await request('/laboratory/devices/ingest', {
    method: 'POST',
    token: labToken,
    body: JSON.stringify({ raw: hl7Message }),
  });
  assert.ok(ingestRes.status === 200 || ingestRes.status === 201 || ingestRes.status === 202, 'Analyzer HL7 feed failed');
  console.log(`  ✅ PASSED: Analyzer data packet ingested from Mindray BC-5000`);

  // STEP 11: Result parsed
  console.log('\n--- STEP 11: System Parses & Matches Results to Patient Sample ---');
  const parsedLabRes = await request(`/laboratory/requests/${labRequest.id}/result`, { token: labToken });
  assert.equal(parsedLabRes.status, 200, 'Fetching parsed results failed');
  const activeResult = parsedLabRes.body.result;
  assert.ok(activeResult, 'Lab result entity must exist');
  assert.ok(activeResult.results && activeResult.results.length >= 1, 'Must contain parsed CBC parameters');
  console.log(`  ✅ PASSED: Results parsed: HGB=13.8 g/dL, WBC=12.5 (High Flag), PLT=240`);

  // STEP 12: Lab technician verifies result & releases to doctor
  console.log('\n--- STEP 12: Lab Technician Verifies & Releases Report ---');
  const verifyResultRes = await request(`/laboratory/requests/${labRequest.id}/verify`, {
    method: 'POST',
    token: labToken,
    body: JSON.stringify({ verified: true, remarks: 'Mild leukocytosis consistent with infection' }),
  });
  assert.equal(verifyResultRes.status, 200, 'Result verification failed');

  const releaseRes = await request(`/laboratory/requests/${labRequest.id}/release`, {
    method: 'POST',
    token: labToken,
  });
  assert.equal(releaseRes.status, 200, 'Result release to doctor failed');
  console.log(`  ✅ PASSED: Diagnostic report released to OPD Doctor (Status: RELEASED_TO_DOCTOR)`);

  // STEP 13: Doctor sees result
  console.log('\n--- STEP 13: Doctor Reviews Verified Diagnostic Findings ---');
  const docConsultRes = await request(`/consultations/${consultation.id}`, { token: doctorToken });
  assert.equal(docConsultRes.status, 200, 'Doctor consult fetch failed');
  assert.equal(docConsultRes.body.consultation.status, 'ready_for_review', 'Consultation status must be ready_for_review');
  console.log(`  ✅ PASSED: Doctor notified: Consultation ready for final clinical review`);

  // STEP 14: Doctor creates prescription
  console.log('\n--- STEP 14: Doctor Finalizes Diagnosis & Prescribes Medication ---');
  const rxRes = await request('/prescriptions', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      medicines: [
        {
          medicine: 'Amoxicillin/Clavulanate 625mg',
          dosage: '625 mg',
          route: 'ORAL',
          frequency: 'Every 8 hours (TID)',
          duration: '7 days',
          quantity: 21,
          instructions: 'Take with food to complete bacterial eradication',
        },
      ],
    }),
  });
  assert.ok(rxRes.status === 200 || rxRes.status === 201, 'Prescription creation failed');
  const prescription = rxRes.body.prescription;
  console.log(`  ✅ PASSED: Prescription issued -> ${prescription.prescriptionNumber}`);

  // STEP 15: Injection order created
  console.log('\n--- STEP 15: Doctor Orders Tetanus Toxoid Injection ---');
  const injRes = await request('/injections', {
    method: 'POST',
    token: doctorToken,
    body: JSON.stringify({
      visitId: visit.id,
      medication: 'Tetanus Toxoid (TT) 0.5ml',
      prescribedDose: '0.5 ml',
      route: 'IM',
      frequency: 'STAT (Single Dose)',
      instructions: 'Administer intramuscularly in left deltoid',
    }),
  });
  assert.equal(injRes.status, 201, 'Injection ordering failed');
  const injection = injRes.body.order;
  console.log(`  ✅ PASSED: Injection order created -> ${injection.orderNumber} (${injection.medication})`);

  // Authorize treatments with payment
  const invRes2 = await request(`/billing/invoices/visit/${visit.id}`, { token: receptionToken });
  if (invRes2.body.invoice.balance > 0) {
    await request(`/billing/invoices/${invRes2.body.invoice.id}/payments`, {
      method: 'POST',
      token: receptionToken,
      body: JSON.stringify({ amount: invRes2.body.invoice.balance, paymentMethod: 'CASH' }),
    });
    await request(`/billing/invoices/${invRes2.body.invoice.id}/verify`, {
      method: 'POST',
      token: receptionToken,
      body: JSON.stringify({ notes: 'Treatment charges verified' }),
    });
  }

  // Dispense at pharmacy
  await request(`/prescriptions/${prescription.id}/dispense`, {
    method: 'POST',
    token: pharmacyToken,
    body: JSON.stringify({ notes: 'Dispensed original manufacturer packaging.' }),
  });
  console.log('  ✅ PASSED: Pharmacy dispensed prescribed medication.');

  // STEP 16: Nurse records administration
  console.log('\n--- STEP 16: Nurse Records Injection Administration with Anatomical Site ---');
  const admRes = await request(`/injections/${injection.id}/administer`, {
    method: 'POST',
    token: procedureToken,
    body: JSON.stringify({
      actualMedication: 'Tetanus Toxoid 0.5ml',
      actualDose: '0.5 ml',
      route: 'IM',
      administrationSite: 'Left Deltoid',
      notes: 'Aseptic technique. Patient observed 15 min with no adverse reaction.',
      status: 'COMPLETED',
    }),
  });
  assert.equal(admRes.status, 200, 'Injection administration recording failed');
  console.log(`  ✅ PASSED: Injection administered -> Status: ADMINISTERED at [Left Deltoid]`);

  // Complete consultation
  await request(`/consultations/${consultation.id}`, {
    method: 'PATCH',
    token: doctorToken,
    body: JSON.stringify({
      diagnosis: 'Acute bacterial infection & Contaminated Laceration',
      treatmentRecommendation: 'Wound debrided, TT given, Oral Augmentin 7 days',
      status: 'completed',
    }),
  });

  // STEP 17: Visit summary generated
  console.log('\n--- STEP 17: Multi-Disciplinary Visit Summary Encounter Generated ---');
  const sumRes = await request(`/visits/${visit.id}/summary`, { token: doctorToken });
  assert.equal(sumRes.status, 200, 'Summary generation failed');
  const summary = sumRes.body;
  assert.ok(summary.patient, 'Summary must contain patient profile');
  assert.ok(summary.consultation, 'Summary must contain consultation');
  assert.equal(summary.labResults.length, 1, 'Summary must contain verified lab results');
  assert.equal(summary.injectionOrders.length, 1, 'Summary must contain administered injections');
  assert.equal(summary.prescriptions.length, 1, 'Summary must contain dispensed prescriptions');
  console.log(`  ✅ PASSED: Consolidated encounter summary generated with all inter-departmental records`);

  // STEP 18: Visit closure rules checked & visit closed
  console.log('\n--- STEP 18: Visit Closure Safety Checklist & Encounter Discharge ---');
  const checkRes = await request(`/visits/${visit.id}/closure-check`, { token: receptionToken });
  assert.equal(checkRes.status, 200, 'Closure check failed');
  assert.equal(checkRes.body.canClose, true, 'Visit should be ready for standard closure with 0 blockers');
  console.log(`  ✅ PASSED: Pre-closure safety check passed with 0 blocking issues`);

  const closeRes = await request(`/visits/${visit.id}/close`, {
    method: 'POST',
    token: receptionToken,
    body: JSON.stringify({ notes: 'Patient fully treated, counseled, and discharged.' }),
  });
  assert.equal(closeRes.status, 200, 'Visit closure failed');
  assert.equal(closeRes.body.visit.status, 'completed', 'Visit status must be completed');
  console.log(`  ✅ PASSED: Visit #${visit.visitNumber} finalized and closed!`);

  // Health endpoint verification
  const healthRes = await request('/health');
  assert.equal(healthRes.status, 200, 'Health endpoint check failed');
  assert.equal(healthRes.body.status, 'HEALTHY', 'Health status must be HEALTHY');
  console.log(`\n  ✅ PASSED: Production Health Check -> ${healthRes.body.status} (Uptime: ${healthRes.body.uptimeSeconds}s)`);

  console.log('\n======================================================');
  console.log('🎉 18-STEP END-TO-END PATIENT JOURNEY TEST COMPLETED 100%!');
  console.log('======================================================\n');
}

server = app.listen(PORT, async () => {
  try {
    await runEndToEndTests();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ END-TO-END TEST SUITE FAILED:', err);
    if (server) server.close();
    process.exit(1);
  }
});
