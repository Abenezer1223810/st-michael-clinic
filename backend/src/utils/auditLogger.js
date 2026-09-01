import { db } from '../db/index.js';

export async function logAudit({
  userId = null,
  userName = 'System',
  action,
  entityType,
  entityId = null,
  details = {},
  ipAddress = null,
}) {
  try {
    return await db.createAuditLog({
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
    return null;
  }
}

