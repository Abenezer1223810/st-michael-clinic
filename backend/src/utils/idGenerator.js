const counters = {
  patient: 0,
  visit: 0,
  queue: 0,
  consultation: 0,
  laboratoryRequest: 0,
  result: 0,
  procedure: 0,
  prescription: 0,
};

export function seedCounter(prefix, value) {
  counters[prefix] = Math.max(counters[prefix] || 0, value);
}

export function resetCounters() {
  for (const key of Object.keys(counters)) counters[key] = 0;
}

function nextWithPrefix(prefix, width = 4) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return String(counters[prefix]).padStart(width, '0');
}

export function nextPatientId() {
  return `PT-${nextWithPrefix('patient')}`;
}

export function nextVisitNumber() {
  return `VS-${nextWithPrefix('visit')}`;
}

export function nextQueueNumber() {
  return nextWithPrefix('queue', 3);
}

export function nextConsultationNumber() {
  return `CN-${nextWithPrefix('consultation')}`;
}

export function nextLaboratoryRequestNumber() {
  return `LR-${nextWithPrefix('laboratoryRequest')}`;
}

export function nextProcedureNumber() {
  return `PC-${nextWithPrefix('procedure')}`;
}

export function nextPrescriptionNumber() {
  return `RX-${nextWithPrefix('prescription')}`;
}
