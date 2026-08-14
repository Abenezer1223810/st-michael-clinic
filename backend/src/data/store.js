import { buildSeed } from './seed.js';

let state = buildSeed();

export const db = {
  get users() {
    return state.users;
  },
  get patients() {
    return state.patients;
  },
  get visits() {
    return state.visits;
  },
  get consultations() {
    return state.consultations;
  },
  get labRequests() {
    return state.labRequests;
  },
  get labResults() {
    return state.labResults;
  },
  get procedures() {
    return state.procedures;
  },
  get prescriptions() {
    return state.prescriptions;
  },
  get queue() {
    return state.queue;
  },
  get labTests() {
    return state.labTests;
  },
  get medicines() {
    return state.medicines;
  },
  get procedureTypes() {
    return state.procedureTypes;
  },
  get departments() {
    return state.departments;
  },
};

export function resetDb() {
  state = buildSeed();
  return db;
}
