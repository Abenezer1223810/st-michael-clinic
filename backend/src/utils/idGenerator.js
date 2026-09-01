const counters = {
  user: 0,
  patient: 0,
  visit: 0,
  queue: 0,
  consultation: 0,
  laboratoryRequest: 0,
  result: 0,
  procedure: 0,
  prescription: 0,
  invoice: 0,
  payment: 0,
  receipt: 0,
  sample: 0,
  device: 0,
  injectionOrder: 0,
  injectionAdmin: 0,
};

export function seedCounter(prefix, value) {
  counters[prefix] = Math.max(counters[prefix] || 0, value);
}

export function resetCounters() {
  for (const key of Object.keys(counters)) counters[key] = 0;
}

function nextWithPrefix(prefix, width = 6) {
  counters[prefix] = (counters[prefix] || 0) + 1;
  return String(counters[prefix]).padStart(width, '0');
}

export function nextPatientId() {
  return `PT-${nextWithPrefix('patient', 6)}`;
}

export function nextUserId() {
  return `U-${nextWithPrefix('user', 3)}`;
}

export function nextVisitNumber() {
  return `VS-${nextWithPrefix('visit', 6)}`;
}

export function nextQueueNumber() {
  return nextWithPrefix('queue', 3);
}

export function nextConsultationNumber() {
  return `CN-${nextWithPrefix('consultation', 4)}`;
}

export function nextLaboratoryRequestNumber() {
  return `LR-${nextWithPrefix('laboratoryRequest', 4)}`;
}

export function nextProcedureNumber() {
  return `PC-${nextWithPrefix('procedure', 4)}`;
}

export function nextPrescriptionNumber() {
  return `RX-${nextWithPrefix('prescription', 4)}`;
}

export function nextInvoiceNumber() {
  return `INV-${nextWithPrefix('invoice', 6)}`;
}

export function nextPaymentNumber() {
  return `PAY-${nextWithPrefix('payment', 6)}`;
}

export function nextReceiptNumber() {
  return `RCP-${nextWithPrefix('receipt', 6)}`;
}

export function nextSampleNumber() {
  return `S-${nextWithPrefix('sample', 6)}`;
}

export function nextDeviceCode() {
  return `DEV-${nextWithPrefix('device', 3)}`;
}

export function nextInjectionOrderNumber() {
  return `INJ-${nextWithPrefix('injectionOrder', 4)}`;
}

export function nextInjectionAdminNumber() {
  return `ADM-${nextWithPrefix('injectionAdmin', 4)}`;
}

