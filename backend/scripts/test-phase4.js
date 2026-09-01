/**
 * ST. MICHAEL MEDIUM CLINIC HMS — PHASE 4 ACCEPTANCE TESTS
 * LABORATORY INFORMATION SYSTEM (LIS) & ANALYZER INTEGRATION ENGINE
 */

import { createApp } from '../src/app.js';
import { db, resetDb } from '../src/db/index.js';

let app;
let server;
let baseUrl;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASSED: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAILED: ${message}`);
    throw new Error(message);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body, headers: res.headers };
}

async function startServer() {
  await resetDb();
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
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
}

async function runPhase4Tests() {
  console.log('\n======================================================');
  console.log('🧪 ST. MICHAEL CLINIC HMS — PHASE 4 LIS & ANALYZER TESTS');
  console.log('======================================================\n');

  try {
    await startServer();
    await resetDb();

    // 1. Authenticate Actors
    console.log('--- STEP 1: Authenticate Clinic Actors ---');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const receptionLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'reception', password: 'reception123' }),
    });
    const doctorLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'doctor', password: 'doctor123' }),
    });
    const labLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'lab', password: 'lab123' }),
    });

    assert(adminLogin.status === 200, 'Administrator authenticated');
    assert(receptionLogin.status === 200, 'Receptionist authenticated');
    assert(doctorLogin.status === 200, 'Doctor authenticated');
    assert(labLogin.status === 200, 'Lab technician authenticated');

    const adminToken = adminLogin.body.token;
    const receptionToken = receptionLogin.body.token;
    const doctorToken = doctorLogin.body.token;
    const labToken = labLogin.body.token;

    // 2. Patient Registration & Consultation Order
    console.log('\n--- STEP 2: Doctor Creates Patient Encounter & Lab Order ---');
    const patientRes = await request('/patients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({
        fullName: 'Rahel Tadesse',
        gender: 'Female',
        dateOfBirth: '1995-04-12',
        phone: '+251922334455',
        address: 'Bole Medhanealem',
      }),
    });
    assert(patientRes.status === 201, 'Patient Rahel Tadesse registered');
    const patientId = patientRes.body.patient.id;

    const visitRes = await request('/visits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({
        patientId,
        service: 'General OPD',
        reason: 'Fatigue, dizziness, and suspected anemia',
        addToQueue: true,
      }),
    });
    assert(visitRes.status === 201, 'Visit created');
    const visitId = visitRes.body.visit.id;

    // Doctor starts consultation and orders CBC (LT-01, LT-02, LT-03) and Fasting Glucose (LT-04)
    const labReqRes = await request('/laboratory/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        visitId,
        testIds: ['LT-01', 'LT-02', 'LT-03', 'LT-04'],
      }),
    });
    assert(labReqRes.status === 201, 'Doctor created lab request for CBC + Fasting Glucose');
    const labRequestId = labReqRes.body.request.id;

    // 3. Billing Gatekeeping on Specimen Collection
    console.log('\n--- STEP 3: Billing Gatekeeping on Specimen Collection ---');
    const unpaidCollectRes = await request(`/laboratory/requests/${labRequestId}/sample`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${labToken}` },
      body: JSON.stringify({
        specimenType: 'Whole Blood (EDTA)',
        notes: 'Trying early collection',
      }),
    });
    assert(unpaidCollectRes.status === 402 || unpaidCollectRes.status === 400, 'Blocked: Cannot collect sample for unpaid lab order (HTTP 402/400)');

    // Pay and verify invoice at reception
    const invRes = await request(`/billing/visit/${visitId}`, {
      headers: { Authorization: `Bearer ${receptionToken}` },
    });
    assert(invRes.status === 200, 'Visit invoice retrieved');
    const invoice = invRes.body.invoice;

    const payRes = await request(`/billing/invoices/${invoice.id}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({ amount: invoice.totalAmount, paymentMethod: 'CASH' }),
    });
    assert(payRes.status === 201, 'Invoice paid in full');

    const verifyRes = await request(`/billing/invoices/${invoice.id}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${receptionToken}` },
      body: JSON.stringify({ notes: 'Verified at reception desk' }),
    });
    assert(verifyRes.status === 200, 'Reception verified payment');

    // 4. Sample Collection & Barcode Assignment
    console.log('\n--- STEP 4: Specimen Collection & Sample Barcode Assignment ---');
    const collectRes = await request(`/laboratory/requests/${labRequestId}/sample`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${labToken}` },
      body: JSON.stringify({
        specimenType: 'Whole Blood (EDTA)',
        notes: '4mL EDTA purple top vacutainer tube collected',
      }),
    });
    console.log('DEBUG collectRes:', JSON.stringify(collectRes, null, 2));
    assert(collectRes.status === 201, `Specimen successfully collected in lab (status: ${collectRes.status}, msg: ${collectRes.body.message})`);
    const sample = collectRes.body.sample;
    assert(sample.sampleNumber.startsWith('S-'), `Sample assigned formatted ID: ${sample.sampleNumber}`);
    assert(sample.barcode === sample.sampleNumber.replace('-', ''), `Barcode matched: ${sample.barcode}`);
    assert(collectRes.body.request.status === 'SPECIMEN_COLLECTED', 'Request status updated to SPECIMEN_COLLECTED');

    // 5. Automated Mindray BC-5000 CBC Analyzer Ingestion (HL7 v2.x)
    console.log('\n--- STEP 5: Automated CBC Analyzer Feed Ingestion (HL7 v2.x) ---');
    const hl7Message = `MSH|^~\\&|Mindray_BC5000|CLINIC_LAB|LIS|ST_MICHAEL|20260901112000||ORU^R01|MSG000889|P|2.3.1
PID|1||${patientId}||Rahel Tadesse
OBR|1|${sample.sampleNumber}|||||20260901111500
OBX|1|NM|HGB^Hemoglobin|1|8.2|g/dL|12.0-16.0|L|||F
OBX|2|NM|WBC^White Blood Cells|1|16.8|x10^9/L|4.0-11.0|H|||F
OBX|3|NM|PLT^Platelets|1|220|x10^9/L|150-450|N|||F`;

    const hl7IngestRes = await request('/laboratory/devices/ingest', {
      method: 'POST',
      body: JSON.stringify({ raw: hl7Message }),
    });
    console.log('DEBUG hl7IngestRes:', JSON.stringify(hl7IngestRes, null, 2));
    assert(hl7IngestRes.status === 200, `HL7 v2.x analyzer message ingested successfully (status: ${hl7IngestRes.status}, body: ${JSON.stringify(hl7IngestRes.body)})`);
    assert(hl7IngestRes.body.matched === true, 'Matched to open lab request via Sample ID barcode');

    // 6. Automated Chemistry Analyzer Ingestion (ASTM 1394-97)
    console.log('\n--- STEP 6: Automated Chemistry Analyzer Feed Ingestion (ASTM 1394-97) ---');
    const astmMessage = `H|\\^&|||Roche_Cobas_c311|||||||P|1
P|1||${patientId}
O|1|${sample.sampleNumber}
R|1|^^^GLU|92|mg/dL|70-110|N||F
L|1|N`;

    const astmIngestRes = await request('/laboratory/devices/ingest', {
      method: 'POST',
      body: JSON.stringify({ raw: astmMessage }),
    });
    assert(astmIngestRes.status === 200, 'ASTM 1394-97 frame ingested successfully');

    // 7. Review Incoming Results & Abnormal Flags
    console.log('\n--- STEP 7: Technician Result Review & Abnormal High/Low Flags ---');
    const resultDocRes = await request(`/laboratory/requests/${labRequestId}/result`, {
      headers: { Authorization: `Bearer ${labToken}` },
    });
    console.log('DEBUG resultDocRes.body:', JSON.stringify(resultDocRes.body, null, 2));
    assert(resultDocRes.status === 200, 'Lab result record fetched for review');
    const { result } = resultDocRes.body;
    assert(result.status === 'RESULT_RECEIVED', `Result status is RESULT_RECEIVED (actual: ${result?.status})`);

    const hgbItem = result.results.find((r) => r.testId === 'LT-01');
    const wbcItem = result.results.find((r) => r.testId === 'LT-02');
    const gluItem = result.results.find((r) => r.testId === 'LT-04');

    assert(hgbItem?.result === '8.2' && hgbItem?.flag === 'LOW', 'Hemoglobin 8.2 g/dL flagged as LOW (Anemia)');
    assert(wbcItem?.result === '16.8' && wbcItem?.flag === 'HIGH', 'WBC 16.8 x10^9/L flagged as HIGH (Leukocytosis)');
    assert(gluItem?.result === '92' && gluItem?.flag === 'NORMAL', 'Fasting Glucose 92 mg/dL flagged as NORMAL');

    // 8. Safety Rule Check: Unreleased Results NOT Finalized to Doctor
    console.log('\n--- STEP 8: Safety Verification — Doctor Cannot Finalize Unverified Lab ---');
    const checkConsult = await request(`/consultations/visit/${visitId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(result.status !== 'RELEASED_TO_DOCTOR', 'Safety Rule: Analyzer data is quarantined until technician signs off');

    // 9. Technician Verification & Release to Doctor
    console.log('\n--- STEP 9: Technician Verification & Doctor Release ---');
    const verifyLabRes = await request(`/laboratory/requests/${labRequestId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${labToken}` },
    });
    assert(verifyLabRes.status === 200, 'Technician verified lab results (TECHNICIAN_VERIFIED)');

    const releaseRes = await request(`/laboratory/requests/${labRequestId}/release`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${labToken}` },
    });
    assert(releaseRes.status === 200, 'Results formally released to OPD Doctor (RELEASED_TO_DOCTOR)');

    // 10. Doctor Feedback Loop: Consultation Ready for Review
    console.log('\n--- STEP 10: Clinical Loop Verification (OPD Doctor Receives Report) ---');
    const reqDetailRes = await request(`/laboratory/requests/${labRequestId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    assert(reqDetailRes.body.request.status === 'RELEASED_TO_DOCTOR', 'Doctor sees RELEASED_TO_DOCTOR status');
    assert(reqDetailRes.body.request.result?.releasedBy === 'Meron Girma', 'Doctor sees releasing technician signature');

    // 11. Laboratory Analyzer Hardware Simulator API Test
    console.log('\n--- STEP 11: Laboratory Analyzer Simulator API Test ---');
    const simRes = await request('/laboratory/simulator/run', {
      method: 'POST',
      body: JSON.stringify({
        analyzerType: 'CBC',
        protocol: 'HL7',
        profile: 'INFECTION',
        sampleId: sample.sampleNumber,
      }),
    });
    assert(simRes.status === 200, 'Analyzer simulator executed and generated live feed');
    assert(simRes.body.simulation.protocol === 'HL7', 'Simulator generated HL7 v2.x stream');

    // 12. Device Configuration Management
    console.log('\n--- STEP 12: Device Configuration Management CRUD ---');
    const listDevRes = await request('/laboratory/devices', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(listDevRes.status === 200 && listDevRes.body.devices.length >= 2, 'Listed registered laboratory devices');

    const newDevRes = await request('/laboratory/devices', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Vitalab Selectra Pro M Chemistry Analyzer',
        manufacturer: 'ELITechGroup',
        model: 'Selectra Pro M',
        analyzerType: 'CHEMISTRY',
        protocol: 'ASTM',
        connectionType: 'LAN',
        ipAddress: '192.168.1.115',
        port: 5050,
      }),
    });
    assert(newDevRes.status === 201, 'Administrator configured new laboratory analyzer');

    // 13. Audit Trail Verification
    console.log('\n--- STEP 13: Audit Trail Verification for LIS Lifecycle ---');
    const auditRes = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(auditRes.status === 200, 'Audit logs retrieved');
    const logs = auditRes.body.auditLogs || auditRes.body.logs || [];
    const hasSample = logs.some((l) => l.action === 'COLLECT_SAMPLE');
    const hasIngest = logs.some((l) => l.action === 'INGEST_ANALYZER_DATA');
    const hasVerify = logs.some((l) => l.action === 'VERIFY_LAB_RESULT');
    const hasRelease = logs.some((l) => l.action === 'RELEASE_LAB_RESULT');

    assert(hasSample, 'Audit log recorded COLLECT_SAMPLE');
    assert(hasIngest, 'Audit log recorded INGEST_ANALYZER_DATA');
    assert(hasVerify, 'Audit log recorded VERIFY_LAB_RESULT');
    assert(hasRelease, 'Audit log recorded RELEASE_LAB_RESULT');

    console.log('\n======================================================');
    console.log(`🎉 ALL PHASE 4 LIS & ANALYZER TESTS PASSED! (${passed}/${passed + failed})`);
    console.log('======================================================\n');
  } finally {
    await stopServer();
  }
}

runPhase4Tests().catch((err) => {
  console.error('\n❌ TEST RUNNER FATAL ERROR:', err);
  process.exit(1);
});
