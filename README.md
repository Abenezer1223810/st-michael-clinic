# St. Michael Medium Clinic — Clinic Management System (Demo)

A full-stack demonstration of a clinic management system built for **Gravity Technologies**. It covers the complete patient journey across five departments — Reception, OPD (Outpatient Department), Laboratory, Procedure Room, and Prescription — all sharing a single central patient record.

```
st-michael-clinic/
├── backend/                Express API (Node.js, in-memory demo data)
│   ├── src/
│   │   ├── data/           seed data, catalog, in-memory store
│   │   ├── controllers/    business logic per module
│   │   ├── middleware/     auth + error handling
│   │   ├── routes/         API routes
│   │   └── utils/          id generator, token signing, helpers
│   └── scripts/smoke-api.js   end-to-end API verification script
└── frontend/               React + Vite + Tailwind SPA
    └── src/
        ├── pages/          one page per route (reception/opd/laboratory/…)
        ├── components/     reusable UI kit, print templates, modals
        ├── services/       typed API client layer
        └── context/        auth + toast providers
```

## Running the demo

Two terminal windows:

```bash
# Terminal 1 — API (port 5000)
cd backend
npm install
npm run dev

# Terminal 2 — web app (port 5173)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

> Both folders ship an `.env` (copied from `.env.example`). The frontend talks to the API at `http://localhost:5000/api`.

## Demo accounts

| Role             | Username    | Password        | User                  |
| ---------------- | ----------- | --------------- | --------------------- |
| Administrator    | `admin`     | `admin123`      | Amanuel Berhe         |
| Receptionist     | `reception` | `reception123`  | Hanna Tesfaye         |
| Doctor           | `doctor`    | `doctor123`     | Dr. Dawit Alemu       |
| Laboratory       | `lab`       | `lab123`        | Meron Girma           |
| Procedure Room   | `procedure` | `procedure123`  | Kebede Worku          |

## Suggested demo flow (about 10 minutes)

The database is pre-seeded with 13 patients and a fully prepared "today" workflow.

1. **Login as reception** → Register a new patient (PT-0014) → open their profile.
2. **Create a visit** → Add the patient to the OPD queue (they appear as `#004`).
3. **Login as doctor** → OPD Queue shows the new patient → **Start Consultation**.
4. Enter vitals + chief complaint → **Request Laboratory Test** (e.g. Malaria RDT + Typhoid) → **Request Procedure** (e.g. Diclofenac 75mg IM) → **Create Prescription**.
5. **Login as lab** → open the request → enter results → **Verify**.
6. **Login as procedure** → record the injection → **Complete Procedure**.
7. **Login as doctor** → finish diagnosis/treatment → **Complete Consultation**.
8. **Login as reception** → open the patient profile → the timeline now shows the full journey (visit → consultation → lab result → procedure → prescription) with print-ready records.

**Pre-seeded "today" demo story** — Girma Bekele is already mid-flow:
- In consultation (`CN-0005`, vitals 120/80, T 38.6°C), queue `#002`
- Pending lab request (`LR-0004` — Malaria RDT, Widal) for result entry
- Requested IM injection (`PC-0001`) for the procedure room
- A previous completed consultation, lab result and prescription for comparison

## What's implemented

- **Central patient record** — profile with journey timeline, all visits, consultations, lab requests/results, procedures and prescriptions; full history endpoint.
- **Reception** — patient registration (with validation), search, visit creation, queue management with status progression.
- **OPD** — live queue with waiting times, consultation screen with vitals + clinical assessment, one-click ordering of lab tests, procedures and prescriptions, consultation completion, printable consultation record.
- **Laboratory** — worklist, per-test result entry, verification workflow, printable result report.
- **Procedure Room** — request list, administration record (medicine, dosage, staff), completion.
- **Prescriptions** — multi-medicine prescription builder with catalog defaults, printable prescription.
- **Reports** — daily patients, OPD, laboratory, procedures, prescriptions with date filter and print.
- **Dashboard** — role-aware overview with 7-day activity chart and queue pie.
- **Administration** — user list, system info, demo-data reset.

## Architecture notes

- **Demo-first**: data is in-memory on the backend (resets on restart) and authentication uses signed demo tokens (no password hashing) — appropriate for a presentation build.
- **Reset**: Admin → System → "Reset Demo Data" (or `POST /api/dev/reset`) restores the original seed deterministically, including record IDs.
- **ID scheme**: `PT-`/`VS-`/`CN-`/`LR-`/`PC-`/`RX-` prefixed sequential numbers, generated once per record so IDs always match display numbers.
- **Printing**: dedicated print layouts render as overlays and print only the record (CSS visibility technique).
- **Verification**: `backend/scripts/smoke-api.js` exercises the full API end-to-end (currently **34/34 passing**). Run it with the server up:
  ```bash
  cd backend && node scripts/smoke-api.js
  ```

## Main API endpoints

| Area | Endpoints |
| ---- | --------- |
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Patients | `GET/POST /api/patients`, `GET /api/patients/:id/history` |
| Visits | `GET/POST /api/visits`, `GET /api/visits/:id` |
| Queue | `POST /api/queue`, `PATCH /api/queue/:id/status` |
| OPD | `GET /api/opd/queue`, `POST /api/consultations`, `PATCH/complete` |
| Laboratory | `POST /api/laboratory/requests`, `POST …/:id/results`, `POST …/:id/verify` |
| Procedures | `POST /api/procedures`, `POST /api/procedures/:id/record` |
| Prescriptions | `POST /api/prescriptions` |
| Reports | `GET /api/reports/daily-patients|opd|laboratory|procedures|prescriptions` |
| Dashboard | `GET /api/dashboard` |
| Admin | `GET /api/users`, `POST /api/dev/reset` |
