import { users, labTests, medicines, procedureTypes, departments } from './catalog.js';
import {
  nextPatientId,
  nextVisitNumber,
  nextQueueNumber,
  nextConsultationNumber,
  nextLaboratoryRequestNumber,
  nextPrescriptionNumber,
  nextProcedureNumber,
  resetCounters,
} from '../utils/idGenerator.js';
import { daysAgo, minutesAgo, now } from '../utils/helpers.js';

const testById = (id) => labTests.find((t) => t.id === id);
const medByName = (name) => medicines.find((m) => m.name === name);

const mkPatient = ({ fullName, gender, dateOfBirth, phone, address, regAgo }) => ({
  id: nextPatientId(),
  fullName,
  gender,
  dateOfBirth,
  phone,
  address,
  registrationDate: daysAgo(regAgo, 8, 15),
  createdAt: daysAgo(regAgo, 8, 15),
});

const mkVisit = ({ patient, service, reason, ago, status = 'completed', hour = 9, minute = 30 }) => {
  const num = nextVisitNumber();
  return {
    id: `V-${num.slice(3)}`,
    visitNumber: num,
    patientId: patient.id,
    patientName: patient.fullName,
    service,
    reason,
    date: daysAgo(ago, hour, minute),
    status,
    createdAt: daysAgo(ago, hour, minute),
  };
};

const mkConsultation = ({
  visit,
  patient,
  doctor = 'Dr. Dawit Alemu',
  ago,
  status,
  vitals,
  complaint,
  history,
  examination,
  diagnosis,
  treatment,
  notes,
  followUp,
  referral = null,
}) => {
  const num = nextConsultationNumber();
  return {
    id: `C-${num.slice(3)}`,
    consultationNumber: num,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: patient.id,
    patientName: patient.fullName,
    doctor,
    doctorId: 'U-DOCTOR',
    date: daysAgo(ago, 10, 0),
    status,
    vitals,
    chiefComplaint: complaint,
    medicalHistory: history,
    clinicalExamination: examination,
    diagnosis,
    treatmentRecommendation: treatment,
    doctorNotes: notes,
    followUp,
    referral,
  };
};

const mkLabRequest = ({ visit, patient, doctor = 'Dr. Dawit Alemu', ago, status, testIds }) => {
  const num = nextLaboratoryRequestNumber();
  return {
    id: `LR-${num.slice(3)}`,
    requestNumber: num,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: patient.id,
    patientName: patient.fullName,
    requestingDoctor: doctor,
    date: daysAgo(ago, 11, 20),
    tests: testIds.map((id) => {
      const t = testById(id);
      return { id: t.id, name: t.name, unit: t.unit, referenceRange: t.referenceRange };
    }),
    status,
  };
};

const mkLabResult = ({ request, ago, status, values, enteredBy = 'Meron Girma', verifiedBy = 'Dr. Dawit Alemu' }) => ({
  id: `R-${String(request.id.split('-')[1])}`,
  requestId: request.id,
  requestNumber: request.requestNumber,
  patientId: request.patientId,
  visitId: request.visitId,
  status,
  date: daysAgo(ago, 12, 30),
  enteredAt: status === 'pending' ? null : daysAgo(ago, 12, 30),
  verifiedAt: status === 'verified' || status === 'completed' ? daysAgo(ago, 13, 5) : null,
  enteredBy: status === 'pending' ? null : enteredBy,
  verifiedBy: status === 'verified' || status === 'completed' ? verifiedBy : null,
  results: request.tests.map((t) => {
    const v = values[t.id] || {};
    return {
      testId: t.id,
      testName: t.name,
      unit: t.unit,
      referenceRange: t.referenceRange,
      result: v.result ?? '',
      remarks: v.remarks ?? '',
      status: status === 'pending' ? 'pending' : status === 'entered' ? 'entered' : 'verified',
    };
  }),
});

const mkProcedure = ({ visit, patient, doctor = 'Dr. Dawit Alemu', ago, type, status, notes = '', recording = null }) => {
  const pt = procedureTypes.find((p) => p.id === type);
  const num = nextProcedureNumber();
  return {
    id: `PC-${num.slice(3)}`,
    procedureNumber: num,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: patient.id,
    patientName: patient.fullName,
    requestingDoctor: doctor,
    procedureType: pt.name,
    notes,
    date: daysAgo(ago, 11, 40),
    status,
    recording,
  };
};

const mkPrescription = ({ visit, patient, ago, doctor = 'Dr. Dawit Alemu', meds }) => {
  const num = nextPrescriptionNumber();
  return {
    id: `RX-${num.slice(3)}`,
    prescriptionNumber: num,
    visitId: visit.id,
    visitNumber: visit.visitNumber,
    patientId: patient.id,
    patientName: patient.fullName,
    doctor,
    date: daysAgo(ago, 11, 50),
    medicines: meds.map((m) => {
      const cat = medByName(m.medicine);
      return {
        medicine: m.medicine,
        dosage: m.dosage || cat?.defaultDosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        route: m.route || cat?.defaultRoute || 'Oral',
        instructions: m.instructions || '',
        notes: m.notes || '',
      };
    }),
    status: 'completed',
  };
};

export function buildSeed() {
  resetCounters();
  // ---------------------------------------------------------------- patients
  const P = {
    abebe: mkPatient({ fullName: 'Abebe Kebede', gender: 'Male', dateOfBirth: '1985-04-12', phone: '0911 234 567', address: 'Bole, Addis Ababa', regAgo: 200 }),
    mulu: mkPatient({ fullName: 'Mulu Alemayehu', gender: 'Female', dateOfBirth: '1978-11-03', phone: '0912 345 678', address: 'Piassa, Addis Ababa', regAgo: 90 }),
    girma: mkPatient({ fullName: 'Girma Bekele', gender: 'Male', dateOfBirth: '1992-07-19', phone: '0913 456 789', address: 'Merkato, Addis Ababa', regAgo: 60 }),
    yonas: mkPatient({ fullName: 'Yonas Haile', gender: 'Male', dateOfBirth: '1989-02-14', phone: '0915 678 901', address: 'CMC, Addis Ababa', regAgo: 120 }),
    tigist: mkPatient({ fullName: 'Tigist Worku', gender: 'Female', dateOfBirth: '1995-06-30', phone: '0916 789 012', address: 'Bole Medhanealem, Addis Ababa', regAgo: 75 }),
    dawit: mkPatient({ fullName: 'Dawit Lemma', gender: 'Male', dateOfBirth: '2012-05-08', phone: '0917 890 123', address: 'Nifas Silk, Addis Ababa', regAgo: 5 }),
    ruth: mkPatient({ fullName: 'Ruth Solomon', gender: 'Female', dateOfBirth: '1982-12-25', phone: '0918 901 234', address: 'Gergi, Addis Ababa', regAgo: 100 }),
    berhanu: mkPatient({ fullName: 'Berhanu Girma', gender: 'Male', dateOfBirth: '1969-03-01', phone: '0919 012 345', address: 'Kality, Addis Ababa', regAgo: 130 }),
    sara: mkPatient({ fullName: 'Sara Mohammed', gender: 'Female', dateOfBirth: '1998-08-17', phone: '0920 123 456', address: 'Megenagna, Addis Ababa', regAgo: 55 }),
    tesfaye: mkPatient({ fullName: 'Tesfaye Gizaw', gender: 'Male', dateOfBirth: '1975-10-05', phone: '0921 234 567', address: 'Yeka, Addis Ababa', regAgo: 160 }),
    hana: mkPatient({ fullName: 'Hana Bekele', gender: 'Female', dateOfBirth: '2005-04-22', phone: '0922 345 678', address: 'Bole Bulbula, Addis Ababa', regAgo: 3 }),
    kidane: mkPatient({ fullName: 'Kidane Asfaw', gender: 'Male', dateOfBirth: '1988-09-11', phone: '0923 456 789', address: 'Ayer Tena, Addis Ababa', regAgo: 80 }),
    bethlehem: mkPatient({ fullName: 'Bethlehem Desta', gender: 'Female', dateOfBirth: '1993-01-29', phone: '0924 567 890', address: 'Summit, Addis Ababa', regAgo: 40 }),
  };

  const patients = Object.values(P);

  // ---------------------------------------------------------------- visits
  const visits = [];
  visits.push(
    mkVisit({ patient: P.abebe, service: 'OPD', reason: 'Persistent headache and dizziness', ago: 12 }),
    mkVisit({ patient: P.abebe, service: 'OPD', reason: 'Routine blood pressure check', ago: 45 }),
    mkVisit({ patient: P.mulu, service: 'OPD', reason: 'Wound infection after injury', ago: 8 }),
    mkVisit({ patient: P.girma, service: 'OPD', reason: 'Fever and chills for 2 days', ago: 3 }),
    mkVisit({ patient: P.girma, service: 'OPD', reason: 'Recurrent fever with chills', ago: 0, status: 'active', hour: 10, minute: 5 }),
    mkVisit({ patient: P.yonas, service: 'OPD', reason: 'Cough and sore throat', ago: 20 }),
    mkVisit({ patient: P.tigist, service: 'OPD', reason: 'Abdominal pain and diarrhea', ago: 3 }),
    mkVisit({ patient: P.ruth, service: 'Internal Medicine', reason: 'Blood sugar follow-up', ago: 30 }),
    mkVisit({ patient: P.berhanu, service: 'OPD', reason: 'Chest discomfort and fatigue', ago: 0, hour: 8, minute: 45 }),
    mkVisit({ patient: P.sara, service: 'OPD', reason: 'Skin rash on arms', ago: 15 }),
    mkVisit({ patient: P.tesfaye, service: 'Internal Medicine', reason: 'Joint pain follow-up', ago: 40 }),
    mkVisit({ patient: P.tesfaye, service: 'OPD', reason: 'Knee pain and swelling', ago: 10 }),
    mkVisit({ patient: P.kidane, service: 'OPD', reason: 'Epigastric pain', ago: 25 }),
    mkVisit({ patient: P.bethlehem, service: 'OPD', reason: 'Body weakness and headache', ago: 0, status: 'active', hour: 9, minute: 10 }),
  );
  const V = Object.fromEntries(
    visits.map((v, i) => [`v${i + 1}`, v])
  );

  // ---------------------------------------------------------------- consultations
  const consultations = [];
  const vitalsGirma = { bloodPressure: '120/80', pulse: 98, temperature: 38.6, respiratoryRate: 20, weight: 68, height: 172 };
  consultations.push(
    mkConsultation({
      visit: V.v1, patient: P.abebe, ago: 12, status: 'completed',
      vitals: { bloodPressure: '150/95', pulse: 84, temperature: 36.9, respiratoryRate: 18, weight: 74, height: 175 },
      complaint: 'Persistent headache and dizziness for two weeks',
      history: 'Known hypertensive on irregular treatment',
      examination: 'BP elevated; otherwise unremarkable',
      diagnosis: 'Essential Hypertension (uncontrolled)',
      treatment: 'Start Amlodipine 5mg daily; sodium reduction',
      notes: 'Counseled on diet and lifestyle modification',
      followUp: 'Review in 2 weeks',
    }),
    mkConsultation({
      visit: V.v2, patient: P.abebe, ago: 45, status: 'completed',
      vitals: { bloodPressure: '140/90', pulse: 80, temperature: 36.7, respiratoryRate: 17, weight: 75, height: 175 },
      complaint: 'Routine blood pressure check',
      history: 'Hypertensive on treatment',
      examination: 'BP mildly elevated',
      diagnosis: 'Hypertension - follow-up',
      treatment: 'Continue current medication',
      notes: '',
      followUp: '3 months',
    }),
    mkConsultation({
      visit: V.v3, patient: P.mulu, ago: 8, status: 'completed',
      vitals: { bloodPressure: '125/80', pulse: 88, temperature: 37.8, respiratoryRate: 20, weight: 60, height: 158 },
      complaint: 'Infected wound on right lower leg',
      history: 'No chronic illness',
      examination: 'Cellulitis with discharge over right leg wound',
      diagnosis: 'Infected laceration - right lower leg',
      treatment: 'Dressing change; oral Amoxicillin',
      notes: 'Instructed on wound care at home',
      followUp: 'Return in 3 days',
    }),
    mkConsultation({
      visit: V.v4, patient: P.girma, ago: 3, status: 'completed',
      vitals: { bloodPressure: '118/76', pulse: 90, temperature: 38.2, respiratoryRate: 21, weight: 66, height: 171 },
      complaint: 'Fever, chills and body ache',
      history: 'No significant past illness',
      examination: 'Feverish, no localizing signs',
      diagnosis: 'Viral fever syndrome',
      treatment: 'Paracetamol and fluids; observe',
      notes: 'If fever persists >3 days, review with tests',
      followUp: 'Review if symptoms persist',
    }),
    mkConsultation({
      visit: V.v5, patient: P.girma, ago: 0, status: 'in_progress',
      vitals: vitalsGirma,
      complaint: '',
      history: 'Fever recurred after initial episode settled',
      examination: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      followUp: '',
    }),
    mkConsultation({
      visit: V.v6, patient: P.yonas, ago: 20, status: 'completed',
      vitals: { bloodPressure: '122/78', pulse: 76, temperature: 37.4, respiratoryRate: 18, weight: 70, height: 176 },
      complaint: 'Cough, sore throat and mild fever',
      history: 'Smoker 5 pack-years',
      examination: 'Inflamed pharynx; clear chest',
      diagnosis: 'Acute pharyngitis',
      treatment: 'Amoxicillin 500mg TID x5 days; lozenges',
      notes: 'Advise smoking cessation',
      followUp: 'PRN',
    }),
    mkConsultation({
      visit: V.v7, patient: P.tigist, ago: 3, status: 'completed',
      vitals: { bloodPressure: '115/75', pulse: 92, temperature: 38.0, respiratoryRate: 19, weight: 55, height: 160 },
      complaint: 'Watery diarrhea and abdominal cramps for 3 days',
      history: 'No chronic illness',
      examination: 'Mild dehydration; diffuse abdominal tenderness',
      diagnosis: 'Acute gastroenteritis',
      treatment: 'ORS, Ciprofloxacin 500mg BID x3 days; Zinc',
      notes: 'Rehydration advice given',
      followUp: 'Review if not improving in 48h',
    }),
    mkConsultation({
      visit: V.v8, patient: P.ruth, ago: 30, status: 'completed',
      vitals: { bloodPressure: '128/82', pulse: 78, temperature: 36.8, respiratoryRate: 17, weight: 64, height: 162 },
      complaint: 'Diabetes follow-up',
      history: 'Type 2 diabetes for 6 years on Metformin',
      examination: 'Unremarkable',
      diagnosis: 'Type 2 Diabetes Mellitus - follow-up',
      treatment: 'Continue Metformin; diet control',
      notes: 'Monitor fasting glucose weekly',
      followUp: '1 month',
    }),
    mkConsultation({
      visit: V.v9, patient: P.berhanu, ago: 0, status: 'completed',
      vitals: { bloodPressure: '160/100', pulse: 96, temperature: 36.9, respiratoryRate: 20, weight: 82, height: 170 },
      complaint: 'Chest discomfort and fatigue for 2 days',
      history: 'Hypertension; family history of heart disease',
      examination: 'BP elevated; chest clear; mild pedal edema',
      diagnosis: 'Hypertension with possible cardiac strain',
      treatment: 'Amlodipine 5mg; ECG recommended; reduced salt',
      notes: 'Advised to return immediately if chest pain worsens',
      followUp: 'Review in 1 week',
    }),
    mkConsultation({
      visit: V.v10, patient: P.sara, ago: 15, status: 'completed',
      vitals: { bloodPressure: '118/74', pulse: 82, temperature: 36.6, respiratoryRate: 16, weight: 58, height: 163 },
      complaint: 'Itchy skin rash on both arms',
      history: 'No known allergy',
      examination: 'Erythematous papular rash on extensor surfaces',
      diagnosis: 'Contact dermatitis',
      treatment: 'Topical hydrocortisone; oral Cetirizine',
      notes: 'Avoid possible irritants',
      followUp: 'Review in 1 week',
    }),
    mkConsultation({
      visit: V.v11, patient: P.tesfaye, ago: 40, status: 'completed',
      vitals: { bloodPressure: '132/85', pulse: 80, temperature: 36.7, respiratoryRate: 18, weight: 78, height: 172 },
      complaint: 'Bilateral knee joint pain',
      history: 'Osteoarthritis for 3 years',
      examination: 'Knee crepitus, no effusion',
      diagnosis: 'Osteoarthritis - knees',
      treatment: 'Ibuprofen PRN; physiotherapy',
      notes: 'Weight reduction advised',
      followUp: '2 months',
    }),
    mkConsultation({
      visit: V.v12, patient: P.tesfaye, ago: 10, status: 'completed',
      vitals: { bloodPressure: '130/82', pulse: 78, temperature: 36.8, respiratoryRate: 17, weight: 78, height: 172 },
      complaint: 'Knee pain follow-up',
      history: 'Osteoarthritis',
      examination: 'Improved range of motion',
      diagnosis: 'Osteoarthritis - knees (improving)',
      treatment: 'Continue physiotherapy',
      notes: '',
      followUp: '2 months',
    }),
    mkConsultation({
      visit: V.v13, patient: P.kidane, ago: 25, status: 'completed',
      vitals: { bloodPressure: '124/80', pulse: 86, temperature: 36.9, respiratoryRate: 18, weight: 72, height: 174 },
      complaint: 'Epigastric burning pain for 2 weeks',
      history: 'Occasional NSAID use',
      examination: 'Epigastric tenderness',
      diagnosis: 'Gastritis',
      treatment: 'Omeprazole 20mg daily x2 weeks',
      notes: 'Avoid NSAIDs and spicy food',
      followUp: 'Review if not improved',
    }),
  );

  // ---------------------------------------------------------------- laboratory
  const labRequests = [];
  labRequests.push(
    mkLabRequest({
      visit: V.v9, patient: P.berhanu, ago: 0, status: 'completed',
      testIds: ['LT-01', 'LT-02', 'LT-03', 'LT-05'],
    }),
    mkLabRequest({
      visit: V.v7, patient: P.tigist, ago: 3, status: 'in_progress',
      testIds: ['LT-09', 'LT-10'],
    }),
    mkLabRequest({
      visit: V.v1, patient: P.abebe, ago: 12, status: 'completed',
      testIds: ['LT-06', 'LT-07'],
    }),
    mkLabRequest({
      visit: V.v5, patient: P.girma, ago: 0, status: 'pending',
      testIds: ['LT-09', 'LT-10'],
    }),
  );
  const labResults = [
    mkLabResult({
      request: labRequests[0], ago: 0, status: 'completed',
      values: {
        'LT-01': { result: '13.2', remarks: 'Within normal limits' },
        'LT-02': { result: '7.4', remarks: 'Within normal limits' },
        'LT-03': { result: '268', remarks: 'Within normal limits' },
        'LT-05': { result: '142', remarks: 'Mildly elevated' },
      },
    }),
    mkLabResult({
      request: labRequests[1], ago: 3, status: 'entered',
      values: {
        'LT-09': { result: 'Negative', remarks: '' },
        'LT-10': { result: '1:80', remarks: 'Borderline' },
      },
    }),
    mkLabResult({
      request: labRequests[2], ago: 12, status: 'completed',
      values: {
        'LT-06': { result: '228', remarks: 'Elevated' },
        'LT-07': { result: '1.0', remarks: 'Within normal limits' },
      },
    }),
  ];

  // ---------------------------------------------------------------- procedures
  const procedures = [
    mkProcedure({
      visit: V.v5, patient: P.girma, ago: 0, type: 'PR-01', status: 'requested',
      notes: 'Diclofenac 75mg IM for fever',
    }),
    mkProcedure({
      visit: V.v1, patient: P.abebe, ago: 12, type: 'PR-01', status: 'completed',
      notes: 'Diclofenac IM for headache',
      recording: {
        procedureType: 'Intramuscular (IM) Injection',
        medicine: 'Diclofenac 75mg',
        dosage: '75 mg',
        administrationDetails: 'Upper outer quadrant, right gluteal',
        date: daysAgo(12, 12, 0),
        time: '12:00 PM',
        responsibleStaff: 'Kebede Worku',
        notes: 'Tolerated well',
      },
    }),
    mkProcedure({
      visit: V.v3, patient: P.mulu, ago: 8, type: 'PR-03', status: 'completed',
      notes: 'Dressing change for infected leg wound',
      recording: {
        procedureType: 'Wound Dressing',
        medicine: 'Normal saline, Betadine',
        dosage: '—',
        administrationDetails: 'Cleaned and dressed right leg wound',
        date: daysAgo(8, 11, 30),
        time: '11:30 AM',
        responsibleStaff: 'Kebede Worku',
        notes: 'Purulent discharge noted; scheduled review',
      },
    }),
  ];

  // ---------------------------------------------------------------- prescriptions
  const prescriptions = [
    mkPrescription({
      visit: V.v9, patient: P.berhanu, ago: 0,
      meds: [
        { medicine: 'Paracetamol 500mg', frequency: '3 times daily', duration: '5 days', instructions: 'After meals' },
        { medicine: 'Amoxicillin 500mg', frequency: '3 times daily', duration: '5 days', instructions: 'Every 8 hours' },
      ],
    }),
    mkPrescription({
      visit: V.v1, patient: P.abebe, ago: 12,
      meds: [
        { medicine: 'Paracetamol 500mg', frequency: '3 times daily', duration: '3 days', instructions: 'After meals' },
        { medicine: 'Vitamin C 500mg', frequency: 'Once daily', duration: '7 days', instructions: 'Morning' },
      ],
    }),
    mkPrescription({
      visit: V.v4, patient: P.girma, ago: 3,
      meds: [
        { medicine: 'Paracetamol 500mg', frequency: '3 times daily', duration: '3 days', instructions: 'After meals' },
      ],
    }),
    mkPrescription({
      visit: V.v3, patient: P.mulu, ago: 8,
      meds: [
        { medicine: 'Amoxicillin 500mg', frequency: '3 times daily', duration: '5 days', instructions: 'Every 8 hours' },
      ],
    }),
    mkPrescription({
      visit: V.v7, patient: P.tigist, ago: 3,
      meds: [
        { medicine: 'Oral Rehydration Salts (ORS)', frequency: 'After each loose stool', duration: 'Until diarrhea stops', instructions: 'Mix with 1L clean water' },
        { medicine: 'Ciprofloxacin 500mg', frequency: '2 times daily', duration: '3 days', instructions: 'After meals' },
      ],
    }),
    mkPrescription({
      visit: V.v6, patient: P.yonas, ago: 20,
      meds: [
        { medicine: 'Amoxicillin 500mg', frequency: '3 times daily', duration: '5 days', instructions: 'Every 8 hours' },
        { medicine: 'Vitamin C 500mg', frequency: 'Once daily', duration: '5 days', instructions: 'Morning' },
      ],
    }),
    mkPrescription({
      visit: V.v8, patient: P.ruth, ago: 30,
      meds: [
        { medicine: 'Metformin 500mg', frequency: '2 times daily', duration: '30 days', instructions: 'With meals' },
      ],
    }),
    mkPrescription({
      visit: V.v10, patient: P.sara, ago: 15,
      meds: [
        { medicine: 'Vitamin C 500mg', frequency: 'Once daily', duration: '7 days', instructions: 'Morning' },
        { medicine: 'Paracetamol 500mg', frequency: 'As needed', duration: '3 days', instructions: 'For itching' },
      ],
    }),
    mkPrescription({
      visit: V.v11, patient: P.tesfaye, ago: 40,
      meds: [
        { medicine: 'Ibuprofen 400mg', frequency: '2 times daily', duration: '7 days', instructions: 'After meals' },
      ],
    }),
    mkPrescription({
      visit: V.v12, patient: P.tesfaye, ago: 10,
      meds: [
        { medicine: 'Ibuprofen 400mg', frequency: 'As needed', duration: '7 days', instructions: 'For pain' },
      ],
    }),
    mkPrescription({
      visit: V.v13, patient: P.kidane, ago: 25,
      meds: [
        { medicine: 'Omeprazole 20mg', frequency: 'Once daily', duration: '14 days', instructions: 'Before breakfast' },
      ],
    }),
  ];

  // ---------------------------------------------------------------- queue (today)
  const queue = [];
  {
    const mkQueue = ({ visit, patient, minutesAgoN, status, service }) => {
      const qnum = nextQueueNumber();
      return {
        id: `Q-${qnum}`,
        queueNumber: qnum,
        visitId: visit.id,
        visitNumber: visit.visitNumber,
        patientId: patient.id,
        patientName: patient.fullName,
        service,
        time: minutesAgo(minutesAgoN),
        date: daysAgo(0),
        status,
      };
    };
    queue.push(
      mkQueue({ visit: V.v14, patient: P.bethlehem, minutesAgoN: 38, status: 'waiting', service: V.v14.service }),
      mkQueue({ visit: V.v5, patient: P.girma, minutesAgoN: 25, status: 'in_consultation', service: V.v5.service }),
      mkQueue({ visit: V.v9, patient: P.berhanu, minutesAgoN: 95, status: 'completed', service: V.v9.service }),
    );
  }

  return {
    users: users.map(({ password, ...u }) => ({ ...u, password })),
    patients,
    visits,
    consultations,
    labRequests,
    labResults,
    procedures,
    prescriptions,
    queue,
    labTests,
    medicines,
    procedureTypes,
    departments,
  };
}
