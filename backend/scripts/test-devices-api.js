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

async function call(method, path, { token, body, rawText } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let requestBody;
  if (rawText !== undefined) {
    headers['Content-Type'] = 'text/plain';
    requestBody = rawText;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: requestBody,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(username, password) {
  const { data } = await call('POST', '/auth/login', { body: { username, password } });
  return data.token;
}

async function main() {
  console.log('\n== LABORATORY DEVICE & ANALYZER INTEGRATION TESTS ==');
  const labToken = await login('lab', 'lab123');

  // 1. List configured lab instruments
  const devRes = await call('GET', '/laboratory/devices', { token: labToken });
  log(devRes.status === 200 && devRes.data.devices.length >= 2, 'list registered laboratory analyzers', `Found ${devRes.data.devices?.length} devices`);

  // 2. Simulate CBC / Hematology Analyzer (e.g. Sysmex / Mindray) sending JSON feed for sample LR-0004
  const cbcFeed = await call('POST', '/laboratory/devices/ingest', {
    body: {
      instrumentId: 'DEV-CBC-01',
      instrumentName: 'Mindray BC-5000 CBC Analyzer',
      sampleId: 'LR-0004',
      observations: [
        { code: 'WBC', value: '8.6', units: '10^9/L', referenceRange: '4.0-11.0', flag: 'Normal' },
        { code: 'HGB', value: '14.2', units: 'g/dL', referenceRange: '12.0-16.0', flag: 'Normal' },
        { code: 'PLT', value: '240', units: '10^9/L', referenceRange: '150-450', flag: 'Normal' },
        { code: 'MALARIA', value: 'Negative', flag: 'Normal' },
        { code: 'WIDAL', value: '1:40', flag: 'Normal' },
      ],
    },
  });
  log(cbcFeed.status === 200 && cbcFeed.data.matched === true, 'ingest CBC analyzer results', `Matched ${cbcFeed.data.resultsCount} parameters`);

  // 3. Verify that the lab request now has the machine-entered results
  const resultDoc = await call('GET', '/laboratory/requests/LR-0004/result', { token: labToken });
  log(resultDoc.status === 200 && (resultDoc.data.result.status === 'RESULT_RECEIVED' || resultDoc.data.result.status === 'entered'), 'analyzer results automatically populated in worklist');

  // 4. Simulate HL7 v2 transmission from Chemistry Analyzer (via raw text stream)
  const hl7Message = `MSH|^~\\&|Cobas_c311|ROCHE|LIS|CLINIC|20260901110000||ORU^R01|MSG0001|P|2.3.1
PID|1||PT-0008||Berhanu Girma
OBR|1|LR-0001|||||20260901103000
OBX|1|NM|GLU^Blood Glucose|1|110|mg/dL|70-110|N|||F
OBX|2|NM|CREA^Creatinine|1|1.1|mg/dL|0.6-1.2|N|||F
OBX|3|NM|ALT^ALT SGPT|1|32|U/L|7-56|N|||F`;

  const hl7Feed = await call('POST', '/laboratory/devices/ingest', {
    rawText: hl7Message,
  });
  log(hl7Feed.status === 200 || hl7Feed.status === 202, 'ingest HL7 v2 Chemistry Analyzer feed', hl7Feed.data.message);

  // 5. Simulate ASTM 1394-97 serial frame transmission
  const astmMessage = `H|\\^&|||Mindray_BS240|||||||P|1
P|1||PT-0003
O|1|LR-0002
R|1|^^^GLU|105|mg/dL|70-110|N||F
R|2|^^^CHOL|180|mg/dL|<200|N||F
L|1|N`;

  const astmFeed = await call('POST', '/laboratory/devices/ingest', {
    body: { raw: astmMessage },
  });
  log(astmFeed.status === 200 || astmFeed.status === 202, 'ingest ASTM 1394 Analyzer frame', astmFeed.data.message);

  console.log(`\n==== DEVICE INTEGRATION RESULTS: ${passed} passed, ${failed} failed ====\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Device Test Error:', e);
  process.exit(1);
});

