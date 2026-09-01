import { createApp } from '../src/app.js';
import { db, resetDb } from '../src/db/index.js';

let app;
let server;
let baseUrl;

async function startServer() {
  resetDb();
  app = createApp();
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
}

async function stopServer() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
}

async function login(username, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Login failed for ${username}: ${res.body.message || res.status}`);
  }
  return res.body.token;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
    throw new Error(message);
  } else {
    console.log(`  ✅ PASSED: ${message}`);
    passed++;
  }
}

async function runPhase3Tests() {
  console.log('\n======================================================');
  console.log('🩺 ST. MICHAEL CLINIC HMS — PHASE 3 ACCEPTANCE TESTS');
  console.log('======================================================\n');

  await startServer();

  try {
    // 1. Authenticate roles
    console.log('--- STEP 1: Authenticate Clinic Actors ---');
    const doctorToken = await login('doctor', 'doctor123');
    const receptionToken = await login('reception', 'reception123');
    const labToken = await login('lab', 'lab123');
    const procedureToken = await login('procedure', 'procedure123');
    const adminToken = await login('admin', 'admin123');
    assert(doctorToken && receptionToken && labToken && procedureToken && adminToken, 'All clinic roles authenticated successfully');

    // 2. Reception registers a new patient and creates a visit
    console.log('\n--- STEP 2: Reception Enrolls Patient & Creates Visit Encounter ---');
    const createPtRes = await request('/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({
        fullName: 'Solomon Bekele',
        gender: 'Male',
        phone: '+251911998877',
        age: 36,
        kebele: '04',
        bloodGroup: 'B+',
        allergies: ['Penicillin'],
      }),
    });
    assert(createPtRes.status === 201, 'Patient Solomon Bekele enrolled');
    const patientId = createPtRes.body.patient.id;

    const createVisitRes = await request('/visits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({
        patientId,
        service: 'General OPD',
        reason: 'Severe fever, joint pain, and suspected malaria',
      }),
    });
    assert(createVisitRes.status === 201, 'Visit encounter created');
    const visitId = createVisitRes.body.visit.id;

    // 3. Doctor examines patient and creates service orders (Lab, Procedure, Prescription)
    console.log('\n--- STEP 3: Doctor Orders Laboratory, Procedure, and Prescription ---');
    const labRes = await request('/laboratory/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        visitId,
        testIds: ['LT-01', 'LT-09'], // Hemoglobin (150 ETB) + Malaria RDT (100 ETB)
      }),
    });
    assert(labRes.status === 201, 'Doctor created Lab Request for Hemoglobin & Malaria RDT');
    const labRequestId = labRes.body.request.id;

    const procRes = await request('/procedures', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        visitId,
        procedureType: 'Intramuscular (IM) Injection', // 50 ETB
        notes: 'Administer Diclofenac IM for acute pain relief',
      }),
    });
    assert(procRes.status === 201, 'Doctor created Procedure order for IM Injection');
    const procedureId = procRes.body.procedure.id;

    const rxRes = await request('/prescriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        visitId,
        medicines: [
          { medicine: 'Paracetamol 500mg', dosage: '500 mg', frequency: 'TID', duration: '5 days' }, // 40 ETB
        ],
      }),
    });
    assert(rxRes.status === 201, 'Doctor created Prescription');

    // 4. Verify System Auto-Generates Invoice with Correct Charges
    console.log('\n--- STEP 4: Verify System Invoice Generation & Charge Calculation ---');
    const invRes = await request(`/billing/visit/${visitId}`, {
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    assert(invRes.status === 200, 'Invoice retrieved for visit');
    const { invoice, items } = invRes.body;
    assert(invoice?.status === 'UNPAID', 'Invoice status is initially UNPAID');
    assert(items.length >= 4, `Invoice contains ${items.length} line items (Consultation + 2 Labs + Procedure + Rx)`);
    // Calculation: Consultation (200) + Hb (150) + Malaria (100) + IM Injection (50) + Paracetamol (40) = 540 ETB
    const expectedTotal = 200 + 150 + 100 + 50 + 40;
    assert(invoice.totalAmount === expectedTotal, `Total amount correctly calculated: ${invoice.totalAmount} ETB (expected ${expectedTotal} ETB)`);
    assert(invoice.balance === expectedTotal, `Remaining balance matches total: ${invoice.balance} ETB`);

    // 5. Department Gatekeeping: Lab Tech MUST NOT see unpaid requests & cannot enter results
    console.log('\n--- STEP 5: Department Worklist Gatekeeping (Lab Security) ---');
    const labWorklistRes = await request('/laboratory/requests', {
      headers: { Authorization: `Bearer ${labToken}` },
    });
    assert(labWorklistRes.status === 200, 'Lab technician fetched active worklist');
    const labFoundInQueue = labWorklistRes.body.requests.find((r) => r.id === labRequestId);
    assert(!labFoundInQueue, 'UNPAID laboratory request is HIDDEN from Laboratory Worklist');

    const enterUnpaidLabRes = await request(`/laboratory/requests/${labRequestId}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${labToken}` },
      body: JSON.stringify({
        results: [{ testId: 'LT-01', result: '14.5' }],
      }),
    });
    assert(enterUnpaidLabRes.status === 402 || enterUnpaidLabRes.status === 400, 'Blocked: Cannot enter results for unpaid lab order (HTTP 402/400)');

    // 6. Department Gatekeeping: Procedure Nurse MUST NOT see unpaid procedures & cannot administer
    console.log('\n--- STEP 6: Department Worklist Gatekeeping (Procedure Security) ---');
    const procWorklistRes = await request('/procedures', {
      headers: { Authorization: `Bearer ${procedureToken}` },
    });
    assert(procWorklistRes.status === 200, 'Procedure nurse fetched active worklist');
    const procFoundInQueue = procWorklistRes.body.procedures.find((p) => p.id === procedureId);
    assert(!procFoundInQueue, 'UNPAID procedure request is HIDDEN from Procedure Room Worklist');

    const recordUnpaidProcRes = await request(`/procedures/${procedureId}/record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${procedureToken}` },
      body: JSON.stringify({
        medicine: 'Diclofenac 75mg',
        dosage: '75 mg',
        administrationDetails: 'Left gluteal IM',
      }),
    });
    assert(recordUnpaidProcRes.status === 402 || recordUnpaidProcRes.status === 400, 'Blocked: Cannot perform unpaid procedure/injection (HTTP 402/400)');

    // 7. Partial Payment Handling
    console.log('\n--- STEP 7: Partial Payment Recording & Verification Prevention ---');
    const partialPayRes = await request(`/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({
        amount: 240,
        paymentMethod: 'CASH',
        notes: 'Partial advance payment by patient',
      }),
    });
    assert(partialPayRes.status === 201, 'Partial payment of 240 ETB recorded');
    assert(partialPayRes.body.invoice.status === 'PARTIALLY_PAID', 'Invoice status updated to PARTIALLY_PAID');
    assert(partialPayRes.body.invoice.balance === 300, 'Balance accurately reduced to 300 ETB');

    // Attempting to verify with unpaid balance must fail
    const verifyUnpaidRes = await request(`/billing/invoices/${invoice.id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({ notes: 'Trying early verification' }),
    });
    assert(verifyUnpaidRes.status === 400, 'Blocked: Cannot verify invoice with remaining unpaid balance');

    // 8. Unauthorized User Cannot Verify Payment
    console.log('\n--- STEP 8: Role-Based Authorization for Payment Verification ---');
    const docVerifyRes = await request(`/billing/invoices/${invoice.id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ notes: 'Doctor trying to verify' }),
    });
    assert(docVerifyRes.status === 403, 'Doctor role rejected from verifying payment (403 Forbidden)');

    const labVerifyRes = await request(`/billing/invoices/${invoice.id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${labToken}` },
      body: JSON.stringify({ notes: 'Lab trying to verify' }),
    });
    assert(labVerifyRes.status === 403, 'Laboratory role rejected from verifying payment (403 Forbidden)');

    // 9. Complete Payment & Verify
    console.log('\n--- STEP 9: Full Payment Settlement & Reception Verification ---');
    const fullPayRes = await request(`/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({
        amount: 300,
        paymentMethod: 'BANK', // CBE / Telebirr
        notes: 'Settlement of remaining 300 ETB via Telebirr transfer',
      }),
    });
    assert(fullPayRes.status === 201, 'Remaining payment of 300 ETB recorded');
    assert(fullPayRes.body.invoice.balance === 0, 'Balance is now 0.00 ETB');
    assert(fullPayRes.body.invoice.status === 'PAID', 'Invoice status is PAID');

    const verifyRes = await request(`/billing/invoices/${invoice.id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({ notes: 'Payment verified and receipts issued at counter' }),
    });
    assert(verifyRes.status === 200, 'Receptionist successfully verified payment');
    assert(verifyRes.body.invoice.status === 'VERIFIED', 'Invoice marked VERIFIED');

    // 10. Department Routing: Orders NOW UNLOCKED and Active in Worklists
    console.log('\n--- STEP 10: Department Worklist Routing Verification (Unlocked Orders) ---');
    const labWorklistAfterRes = await request('/laboratory/requests', {
      headers: { Authorization: `Bearer ${labToken}` },
    });
    const verifiedLab = labWorklistAfterRes.body.requests.find((r) => r.id === labRequestId);
    assert(Boolean(verifiedLab), 'VERIFIED laboratory request now APPEARS in Lab Worklist');

    const enterLabRes = await request(`/laboratory/requests/${labRequestId}/results`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${labToken}` },
      body: JSON.stringify({
        results: [
          { testId: 'LT-01', result: '13.8', remarks: 'Normal' },
          { testId: 'LT-09', result: 'Negative', remarks: 'No parasites seen' },
        ],
      }),
    });
    assert(enterLabRes.status === 200, 'Lab technician successfully submitted test results for verified request');

    const procWorklistAfterRes = await request('/procedures', {
      headers: { Authorization: `Bearer ${procedureToken}` },
    });
    const verifiedProc = procWorklistAfterRes.body.procedures.find((p) => p.id === procedureId);
    assert(Boolean(verifiedProc), 'VERIFIED procedure order now APPEARS in Procedure Worklist');

    const recordProcRes = await request(`/procedures/${procedureId}/record`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${procedureToken}` },
      body: JSON.stringify({
        medicine: 'Diclofenac 75mg',
        dosage: '75 mg',
        administrationDetails: 'Left gluteal IM injection administered smoothly',
      }),
    });
    assert(recordProcRes.status === 200, 'Procedure nurse successfully recorded procedure');

    // 11. Duplicate Payment Prevention
    console.log('\n--- STEP 11: Duplicate Over-Payment Prevention ---');
    const overPayRes = await request(`/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({
        amount: 100,
        paymentMethod: 'CASH',
      }),
    });
    assert(overPayRes.status === 400, 'Blocked: Duplicate/excess payment on fully settled invoice');

    // 12. Payment Cancellation / Refund Workflow
    console.log('\n--- STEP 12: Payment Cancellation & Refund Management ---');
    const cancelPayRes = await request(`/billing/payments/${fullPayRes.body.payment.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ reason: 'Accidental double charge entered by teller' }),
    });
    assert(cancelPayRes.status === 200, 'Administrator successfully cancelled payment');
    assert(cancelPayRes.body.payment.status === 'CANCELLED', 'Payment record status changed to CANCELLED');

    // 13. Audit Trail Verification
    console.log('\n--- STEP 13: Audit Trail Verification for Billing Lifecycle ---');
    const auditRes = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditRes.status === 200, 'Audit logs retrieved');
    const logs = auditRes.body.auditLogs || auditRes.body.logs || [];
    const hasReceive = logs.some((l) => l.action === 'RECEIVE_PAYMENT');
    const hasVerify = logs.some((l) => l.action === 'VERIFY_PAYMENT');
    const hasCancel = logs.some((l) => l.action === 'CANCEL_PAYMENT');
    assert(hasReceive, 'Audit log records RECEIVE_PAYMENT');
    assert(hasVerify, 'Audit log records VERIFY_PAYMENT');
    assert(hasCancel, 'Audit log records CANCEL_PAYMENT');

    console.log('\n======================================================');
    console.log(`🎉 ALL PHASE 3 BILLING TESTS PASSED! (${passed}/${passed + failed})`);
    console.log('======================================================\n');
  } finally {
    await stopServer();
  }
}

runPhase3Tests().catch((err) => {
  console.error('\n❌ TEST RUNNER FATAL ERROR:', err);
  process.exit(1);
});
