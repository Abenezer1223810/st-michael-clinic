import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { demoService } from '../services/demoService';
import { patientService } from '../services/patientService';

const DemoContext = createContext(null);

export const DEMO_PATIENT_ID = 'PT-0001';
export const DEMO_PATIENT_NAME = 'Abebe Kebede';

const ROLE_ACCOUNTS = {
  receptionist: { username: 'reception', password: 'reception123' },
  doctor: { username: 'doctor', password: 'doctor123' },
  laboratory: { username: 'lab', password: 'lab123' },
  procedure: { username: 'procedure', password: 'procedure123' },
  administrator: { username: 'admin', password: 'admin123' },
};

export const DEMO_STEPS = [
  {
    step: 1,
    key: 'reception-login',
    title: 'Receptionist Login',
    desc: 'Log in as Hanna Tesfaye (Receptionist).',
    role: 'receptionist',
    route: '/reception',
  },
  {
    step: 2,
    key: 'patient-registration',
    title: 'Patient Registration',
    desc: 'Abebe Kebede is already registered as PT-0001 — his record is ready.',
    role: 'receptionist',
    route: `/patients/${DEMO_PATIENT_ID}`,
  },
  {
    step: 3,
    key: 'create-visit',
    title: 'Create Visit',
    desc: 'Click "Create Visit", choose OPD, add reason "Fever and headache for 2 days", keep "Add to OPD queue" checked.',
    role: 'receptionist',
    route: `/patients/${DEMO_PATIENT_ID}?tab=visits`,
  },
  {
    step: 4,
    key: 'opd-queue',
    title: 'OPD Queue',
    desc: 'Abebe Kebede is now waiting in the OPD queue.',
    role: 'receptionist',
    route: '/queue',
  },
  {
    step: 5,
    key: 'doctor-login',
    title: 'Doctor Login',
    desc: 'Log in as Dr. Dawit Alemu (Doctor).',
    role: 'doctor',
    route: '/opd',
  },
  {
    step: 6,
    key: 'open-patient',
    title: 'Open Patient',
    desc: 'Open the consultation screen for Abebe Kebede.',
    role: 'doctor',
    route: (ctx) => `/opd/consultation/${ctx.visitId}`,
  },
  {
    step: 7,
    key: 'review-history',
    title: 'Review History',
    desc: 'Review past visits, allergies and previous laboratory results.',
    role: 'doctor',
    route: `/patients/${DEMO_PATIENT_ID}`,
  },
  {
    step: 8,
    key: 'lab-request',
    title: 'Laboratory Request',
    desc: 'Request a Complete Blood Count (Hemoglobin, WBC, Platelets).',
    role: 'doctor',
    route: (ctx) => `/opd/consultation/${ctx.visitId}`,
  },
  {
    step: 9,
    key: 'procedure-request',
    title: 'Procedure Request',
    desc: 'Request an Intramuscular (IM) Injection.',
    role: 'doctor',
    route: (ctx) => `/opd/consultation/${ctx.visitId}`,
  },
  {
    step: 10,
    key: 'prescription',
    title: 'Prescription',
    desc: 'Create a prescription for Paracetamol 500mg.',
    role: 'doctor',
    route: (ctx) => `/opd/consultation/${ctx.visitId}`,
  },
  {
    step: 11,
    key: 'consultation',
    title: 'Consultation',
    desc: 'Record vitals (BP 120/80, Pulse 72, Temp 36.8°C) and diagnosis, then Complete Consultation.',
    role: 'doctor',
    route: (ctx) => `/opd/consultation/${ctx.visitId}`,
  },
  {
    step: 12,
    key: 'print-prescription',
    title: 'Print Prescription',
    desc: 'Open the prescription and click Print Prescription.',
    role: 'doctor',
    route: (ctx) => `/prescriptions/${ctx.prescriptionId}`,
  },
  {
    step: 13,
    key: 'lab-login',
    title: 'Laboratory Login',
    desc: 'Log in as Meron Girma (Laboratory Technician).',
    role: 'laboratory',
    route: '/laboratory',
  },
  {
    step: 14,
    key: 'open-lab-request',
    title: 'Open Lab Request',
    desc: 'Open the pending CBC request.',
    role: 'laboratory',
    route: (ctx) => `/laboratory/requests/${ctx.labRequestId}`,
  },
  {
    step: 15,
    key: 'enter-result',
    title: 'Enter Result',
    desc: 'Enter results: Hb 14.2 g/dL, WBC 7.2, Platelets 250.',
    role: 'laboratory',
    route: (ctx) => `/laboratory/requests/${ctx.labRequestId}`,
  },
  {
    step: 16,
    key: 'verify-result',
    title: 'Verify Result',
    desc: 'Click Verify Result to finalize.',
    role: 'laboratory',
    route: (ctx) => `/laboratory/requests/${ctx.labRequestId}`,
  },
  {
    step: 17,
    key: 'print-lab-result',
    title: 'Print Lab Result',
    desc: 'Click Print Result.',
    role: 'laboratory',
    route: (ctx) => `/laboratory/requests/${ctx.labRequestId}`,
  },
  {
    step: 18,
    key: 'complete-procedure',
    title: 'Complete Procedure',
    desc: 'Record the IM injection (Diclofenac 75mg, Kebede Worku) and Complete Procedure.',
    role: 'procedure',
    route: (ctx) => `/procedures/${ctx.procedureId}`,
  },
  {
    step: 19,
    key: 'patient-profile',
    title: 'Patient Profile',
    desc: 'Open Abebe Kebede patient profile.',
    role: 'doctor',
    route: `/patients/${DEMO_PATIENT_ID}`,
  },
  {
    step: 20,
    key: 'patient-history',
    title: 'Complete History',
    desc: 'The timeline now shows registration, visits, consultation, lab, procedure and prescription connected to one patient.',
    role: 'doctor',
    route: `/patients/${DEMO_PATIENT_ID}`,
  },
  {
    step: 21,
    key: 'dashboard-reports',
    title: 'Dashboard & Reports',
    desc: 'Dashboard and Reports reflect the completed journey.',
    role: 'administrator',
    route: '/dashboard',
  },
];

export function DemoProvider({ children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const toast = useToast();

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ids, setIds] = useState({
    visitId: null,
    visitNumber: null,
    labRequestId: null,
    labRequestNumber: null,
    procedureId: null,
    procedureNumber: null,
    prescriptionId: null,
    prescriptionNumber: null,
  });
  const idsRef = useRef(ids);
  const applyIds = useCallback((next) => {
    idsRef.current = next;
    setIds(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await patientService.history(DEMO_PATIENT_ID);
      const visit = data.activeVisit || data.visits?.[0] || null;
      const lab = data.laboratory?.[0] || null;
      const proc = data.procedures?.[0] || null;
      const rx = data.prescriptions?.[0] || null;
      applyIds({
        visitId: visit?.id || null,
        visitNumber: visit?.visitNumber || null,
        labRequestId: lab?.id || null,
        labRequestNumber: lab?.requestNumber || null,
        procedureId: proc?.id || null,
        procedureNumber: proc?.procedureNumber || null,
        prescriptionId: rx?.id || null,
        prescriptionNumber: rx?.prescriptionNumber || null,
      });
    } catch {
      // Keep the previous ids if the history call fails mid-reset.
    }
  }, [applyIds]);

  const ensureRole = useCallback(
    async (role) => {
      const acct = ROLE_ACCOUNTS[role];
      if (!acct) return;
      if (user?.role !== role) {
        await login(acct.username, acct.password);
      }
    },
    [user, login]
  );

  const resolveRoute = useCallback(
    (step) => (typeof step.route === 'function' ? step.route(idsRef.current) : step.route),
    []
  );

  const goTo = useCallback(
    async (index) => {
      if (index < 0 || index >= DEMO_STEPS.length || index === stepIndex || index > stepIndex) return;
      const step = DEMO_STEPS[index];
      setBusy(true);
      try {
        await ensureRole(step.role);
        await refresh();
        setStepIndex(index);
        navigate(resolveRoute(step));
        toast.success(t('Step {{n}} of {{total}} completed.', { n: index + 1, total: DEMO_STEPS.length }));
      } catch (e) {
        toast.error(e.message);
      } finally {
        setBusy(false);
      }
    },
    [stepIndex, ensureRole, refresh, resolveRoute, navigate, toast]
  );

  const next = useCallback(async () => {
    if (stepIndex >= DEMO_STEPS.length - 1) {
      setActive(false);
      setStepIndex(0);
      toast.success(t('Demo finished.'));
      navigate('/dashboard');
      return;
    }
    const index = stepIndex + 1;
    const step = DEMO_STEPS[index];
    setBusy(true);
      try {
        await ensureRole(step.role);
        await refresh();
        setStepIndex(index);
        navigate(resolveRoute(step));
        toast.success(t('Step {{n}} of {{total}} completed.', { n: index + 1, total: DEMO_STEPS.length }));
      } catch (e) {
        toast.error(e.message);
      } finally {
        setBusy(false);
      }
    },
    [stepIndex, ensureRole, refresh, resolveRoute, navigate, toast, t]
  );

  const start = useCallback(async () => {
    setBusy(true);
    try {
      await demoService.start();
      await login('reception', 'reception123');
      await refresh();
      setStepIndex(0);
      setActive(true);
      setPanelOpen(true);
      navigate('/reception');
      toast.success(t('Demo Mode started.'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }, [login, refresh, navigate, toast, t]);

  const exit = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    setPanelOpen(false);
  }, []);

  const reset = useCallback(async () => {
    setBusy(true);
    try {
      await demoService.reset();
      setActive(false);
      setStepIndex(0);
      setPanelOpen(false);
      navigate('/dashboard');
      toast.success(t('Demo data has been reset to the original state.'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }, [navigate, toast, t]);

  const currentStep = DEMO_STEPS[stepIndex] || null;

  const value = {
    active,
    busy,
    stepIndex,
    panelOpen,
    setPanelOpen,
    currentStep,
    steps: DEMO_STEPS,
    demoPatientId: DEMO_PATIENT_ID,
    demoPatientName: DEMO_PATIENT_NAME,
    ...ids,
    start,
    next,
    back: () => goTo(stepIndex - 1),
    goTo,
    exit,
    reset,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
