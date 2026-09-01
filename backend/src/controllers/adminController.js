import { db, normalizeRole } from '../db/index.js';

const ROLES = [
  'administrator',
  'receptionist',
  'doctor',
  'laboratory',
  'procedure',
  'pharmacy',
  'ADMINISTRATOR',
  'RECEPTIONIST',
  'DOCTOR',
  'LAB_TECHNICIAN',
  'PROCEDURE_NURSE',
  'PHARMACY',
];

function safeUser(u) {
  if (!u) return null;
  const { password: _pw, passwordHash: _ph, ...safe } = u;
  return safe;
}

export const listUsers = async (_req, res) => {
  const users = await db.listUsers();
  res.json({ users: users.map(safeUser) });
};

export const listAuditLogs = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const auditLogs = await db.listAuditLogs(limit);
  res.json({ auditLogs });
};

export const createUser = async (req, res) => {
  const { name, username, title, role, password } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Full name is required.' });
  }
  if (!username || !String(username).trim()) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: 'Please choose a valid role.' });
  }

  const existing = await db.findUserByUsername(username);
  if (existing) {
    return res.status(400).json({ message: 'That username is already taken. Choose another one.' });
  }

  const user = await db.createUser(
    {
      name: String(name).trim(),
      username: String(username).trim(),
      title: (title || '').trim() || normalizeRole(role),
      role: normalizeRole(role),
      password: String(password),
    },
    req.user
  );

  res.status(201).json({ user: safeUser(user), message: 'User account created successfully.' });
};

export const updateUser = async (req, res) => {
  const user = await db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }

  const { name, title, role, banned, active, password } = req.body || {};

  if (role !== undefined && !ROLES.includes(role)) {
    return res.status(400).json({ message: 'Please choose a valid role.' });
  }
  if (req.user.id === user.id) {
    if (role && normalizeRole(role) !== user.role) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }
    if (banned === true || active === false) {
      return res.status(400).json({ message: 'You cannot ban your own account.' });
    }
  }

  const allUsers = await db.listUsers();
  if (banned === true || active === false) {
    const admins = allUsers.filter((u) => u.role === 'administrator' && !u.banned && u.active !== false);
    if (admins.length <= 1 && admins[0]?.id === user.id) {
      return res.status(400).json({ message: 'You cannot ban the last active administrator.' });
    }
  }

  const updates = {};
  if (name !== undefined) updates.name = String(name).trim() || user.name;
  if (title !== undefined) updates.title = String(title).trim() || user.title;
  if (role !== undefined) updates.role = normalizeRole(role);
  if (banned !== undefined) updates.banned = banned === true;
  if (active !== undefined) updates.active = active === true;
  if (password) updates.password = password;

  const updated = await db.updateUser(req.params.id, updates, req.user);
  res.json({ user: safeUser(updated), message: 'User account updated.' });
};

export const deleteUser = async (req, res) => {
  const user = await db.findUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User account not found.' });
  }
  if (user.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }
  const allUsers = await db.listUsers();
  const admins = allUsers.filter((u) => u.role === 'administrator' && !u.banned && u.active !== false);
  if (user.role === 'administrator' && admins.length <= 1) {
    return res.status(400).json({ message: 'You cannot delete the last active administrator.' });
  }

  await db.deleteUser(req.params.id, req.user);
  res.json({ message: `User "${user.name}" has been moved to Recycle Bin (retained for 30 days).` });
};

export const listRecycleBin = async (_req, res) => {
  const items = await db.listRecycleBin();
  res.json({ items });
};

export const restoreRecycleItem = async (req, res) => {
  const restored = await db.restoreFromRecycleBin(req.params.id, req.user);
  if (!restored) {
    return res.status(404).json({ message: 'Recycle bin item not found.' });
  }
  res.json({ message: `"${restored.title}" restored successfully.`, item: restored });
};

export const purgeRecycleItem = async (req, res) => {
  await db.permanentlyDeleteRecycleItem(req.params.id, req.user);
  res.json({ message: 'Item permanently deleted.' });
};

export const emptyRecycleBin = async (req, res) => {
  const result = await db.emptyRecycleBin(req.user);
  res.json({ message: 'Recycle bin emptied successfully.', ...result });
};

// ==========================================
// MASTER CATALOG CONTROLLERS (Phase 6)
// ==========================================

export const listCatalog = async (_req, res) => {
  res.json({
    departments: await db.listDepartmentsCatalog(),
    labTests: await db.listLabTestsCatalog(),
    medicines: await db.listMedicinesCatalog(),
    procedureTypes: await db.listProcedureTypesCatalog(),
  });
};

// Lab Tests
export const listLabTests = async (_req, res) => {
  res.json({ labTests: await db.listLabTestsCatalog() });
};
export const createLabTest = async (req, res) => {
  const test = await db.createLabTestCatalog(req.body, req.user);
  res.status(201).json({ test, message: 'Lab test added to catalog.' });
};
export const updateLabTest = async (req, res) => {
  const test = await db.updateLabTestCatalog(req.params.id, req.body, req.user);
  res.json({ test, message: 'Lab test updated.' });
};
export const deleteLabTest = async (req, res) => {
  await db.deleteLabTestCatalog(req.params.id, req.user);
  res.json({ message: 'Lab test removed from catalog.' });
};

// Medicines
export const listMedicines = async (_req, res) => {
  res.json({ medicines: await db.listMedicinesCatalog() });
};
export const createMedicine = async (req, res) => {
  const medicine = await db.createMedicineCatalog(req.body, req.user);
  res.status(201).json({ medicine, message: 'Medicine added to catalog.' });
};
export const updateMedicine = async (req, res) => {
  const medicine = await db.updateMedicineCatalog(req.params.id, req.body, req.user);
  res.json({ medicine, message: 'Medicine updated.' });
};
export const deleteMedicine = async (req, res) => {
  await db.deleteMedicineCatalog(req.params.id, req.user);
  res.json({ message: 'Medicine removed from catalog.' });
};

// Procedure Types
export const listProcedureTypes = async (_req, res) => {
  res.json({ procedureTypes: await db.listProcedureTypesCatalog() });
};
export const createProcedureType = async (req, res) => {
  const procedure = await db.createProcedureTypeCatalog(req.body, req.user);
  res.status(201).json({ procedure, message: 'Procedure type added to catalog.' });
};
export const updateProcedureType = async (req, res) => {
  const procedure = await db.updateProcedureTypeCatalog(req.params.id, req.body, req.user);
  res.json({ procedure, message: 'Procedure type updated.' });
};
export const deleteProcedureType = async (req, res) => {
  await db.deleteProcedureTypeCatalog(req.params.id, req.user);
  res.json({ message: 'Procedure type removed from catalog.' });
};

// Departments
export const listDepartments = async (_req, res) => {
  res.json({ departments: await db.listDepartmentsCatalog() });
};
export const createDepartment = async (req, res) => {
  const departments = await db.addDepartmentCatalog(req.body.name, req.user);
  res.status(201).json({ departments, message: 'Department added.' });
};
export const deleteDepartment = async (req, res) => {
  const departments = await db.deleteDepartmentCatalog(req.params.name, req.user);
  res.json({ departments, message: 'Department removed.' });
};
