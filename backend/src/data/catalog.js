export const departments = [
  'OPD',
  'Internal Medicine',
  'Pediatrics',
  'Gynecology',
  'Dermatology',
  'Laboratory',
  'Procedure Room',
];

export const labTests = [
  { id: 'LT-01', name: 'Hemoglobin (Hb)', group: 'Complete Blood Count', unit: 'g/dL', referenceRange: '12.0 – 16.0' },
  { id: 'LT-02', name: 'White Blood Cell (WBC)', group: 'Complete Blood Count', unit: 'x10^9/L', referenceRange: '4.0 – 11.0' },
  { id: 'LT-03', name: 'Platelet Count', group: 'Complete Blood Count', unit: 'x10^9/L', referenceRange: '150 – 450' },
  { id: 'LT-04', name: 'Blood Glucose (Fasting)', group: 'Biochemistry', unit: 'mg/dL', referenceRange: '70 – 110' },
  { id: 'LT-05', name: 'Blood Glucose (Random)', group: 'Biochemistry', unit: 'mg/dL', referenceRange: '80 – 140' },
  { id: 'LT-06', name: 'Total Cholesterol', group: 'Lipid Profile', unit: 'mg/dL', referenceRange: '< 200' },
  { id: 'LT-07', name: 'Creatinine', group: 'Kidney Function', unit: 'mg/dL', referenceRange: '0.6 – 1.2' },
  { id: 'LT-08', name: 'ALT (SGPT)', group: 'Liver Function', unit: 'U/L', referenceRange: '7 – 56' },
  { id: 'LT-09', name: 'Malaria Rapid Test (RDT)', group: 'Parasitology', unit: 'Positive / Negative', referenceRange: 'Negative' },
  { id: 'LT-10', name: 'Typhoid (Widal Test)', group: 'Serology', unit: 'Titer', referenceRange: '< 1:80' },
  { id: 'LT-11', name: 'Urinalysis - Protein', group: 'Urinalysis', unit: 'Positive / Negative', referenceRange: 'Negative' },
  { id: 'LT-12', name: 'HIV Rapid Test', group: 'Serology', unit: 'Positive / Negative', referenceRange: 'Negative' },
  { id: 'LT-13', name: 'HBsAg (Hepatitis B)', group: 'Serology', unit: 'Positive / Negative', referenceRange: 'Negative' },
  { id: 'LT-14', name: 'Urine Pregnancy Test', group: 'Urinalysis', unit: 'Positive / Negative', referenceRange: 'Negative' },
];

export const medicines = [
  { id: 'MD-01', name: 'Paracetamol 500mg', form: 'Tablet', defaultDosage: '500 mg', defaultRoute: 'Oral' },
  { id: 'MD-02', name: 'Amoxicillin 500mg', form: 'Capsule', defaultDosage: '500 mg', defaultRoute: 'Oral' },
  { id: 'MD-03', name: 'Ibuprofen 400mg', form: 'Tablet', defaultDosage: '400 mg', defaultRoute: 'Oral' },
  { id: 'MD-04', name: 'Metformin 500mg', form: 'Tablet', defaultDosage: '500 mg', defaultRoute: 'Oral' },
  { id: 'MD-05', name: 'Ciprofloxacin 500mg', form: 'Tablet', defaultDosage: '500 mg', defaultRoute: 'Oral' },
  { id: 'MD-06', name: 'Oral Rehydration Salts (ORS)', form: 'Sachet', defaultDosage: '1 sachet', defaultRoute: 'Oral' },
  { id: 'MD-07', name: 'Vitamin C 500mg', form: 'Tablet', defaultDosage: '500 mg', defaultRoute: 'Oral' },
  { id: 'MD-08', name: 'Multivitamin', form: 'Tablet', defaultDosage: '1 tablet', defaultRoute: 'Oral' },
  { id: 'MD-09', name: 'Ceftriaxone 1g', form: 'Injection', defaultDosage: '1 g', defaultRoute: 'IV / IM' },
  { id: 'MD-10', name: 'Artemether/Lumefantrine', form: 'Tablet', defaultDosage: '4 tablets', defaultRoute: 'Oral' },
  { id: 'MD-11', name: 'Omeprazole 20mg', form: 'Capsule', defaultDosage: '20 mg', defaultRoute: 'Oral' },
  { id: 'MD-12', name: 'Diclofenac 75mg', form: 'Injection', defaultDosage: '75 mg', defaultRoute: 'IM' },
  { id: 'MD-13', name: 'Salbutamol Nebule 2.5mg', form: 'Nebulization', defaultDosage: '2.5 mg', defaultRoute: 'Inhalation' },
  { id: 'MD-14', name: 'Amoxicillin/Clavulanate 625mg', form: 'Tablet', defaultDosage: '625 mg', defaultRoute: 'Oral' },
];

export const procedureTypes = [
  { id: 'PR-01', name: 'Intramuscular (IM) Injection' },
  { id: 'PR-02', name: 'Intravenous (IV) Infusion' },
  { id: 'PR-03', name: 'Wound Dressing' },
  { id: 'PR-04', name: 'Tetanus Toxoid Vaccination' },
  { id: 'PR-05', name: 'Nebulization' },
  { id: 'PR-06', name: 'Suture / Stitch Removal' },
  { id: 'PR-07', name: 'Minor Laceration Repair' },
  { id: 'PR-08', name: 'Intravenous (IV) Injection' },
];

export const users = [
  { id: 'U-ADMIN', username: 'admin', password: 'admin123', name: 'Amanuel Berhe', role: 'administrator', title: 'System Administrator' },
  { id: 'U-RECEPTION', username: 'reception', password: 'reception123', name: 'Hanna Tesfaye', role: 'receptionist', title: 'Receptionist' },
  { id: 'U-DOCTOR', username: 'doctor', password: 'doctor123', name: 'Dr. Dawit Alemu', role: 'doctor', title: 'General Practitioner' },
  { id: 'U-LAB', username: 'lab', password: 'lab123', name: 'Meron Girma', role: 'laboratory', title: 'Laboratory Technician' },
  { id: 'U-PROCEDURE', username: 'procedure', password: 'procedure123', name: 'Kebede Worku', role: 'procedure', title: 'Procedure Nurse' },
];
