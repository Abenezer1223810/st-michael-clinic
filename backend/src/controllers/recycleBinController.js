import { db } from '../db/index.js';

/**
 * Universal Recycle Bin Controller
 *
 * - Administrator → sees ALL deleted items system-wide, can filter, purge
 * - Any other role → sees only items they deleted, can restore their own
 */

export const listRecycleBin = async (req, res) => {
  const { entityType, user: userFilter, search } = req.query;
  const isAdmin = (req.user?.role || '').toLowerCase() === 'administrator';

  let items = await db.listRecycleBinForUser(req.user);

  // Admins can filter by entity type
  if (entityType && entityType !== 'ALL') {
    items = items.filter((i) => (i.entityType || '').toLowerCase() === entityType.toLowerCase());
  }

  // Admins can filter by the user who deleted
  if (isAdmin && userFilter) {
    items = items.filter(
      (i) =>
        (i.deletedBy || '').toLowerCase().includes(userFilter.toLowerCase()) ||
        (i.deletedById || '') === userFilter
    );
  }

  // Search across title
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (i) =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.entityType || '').toLowerCase().includes(q) ||
        (i.deletedBy || '').toLowerCase().includes(q)
    );
  }

  res.json({ items, isAdmin });
};

export const restoreItem = async (req, res) => {
  const isAdmin = (req.user?.role || '').toLowerCase() === 'administrator';

  // Non-admins can only restore their own items
  if (!isAdmin) {
    const mine = await db.listRecycleBinForUser(req.user);
    const item = mine.find((i) => i.id === req.params.id);
    if (!item) {
      return res.status(403).json({ message: 'You can only restore items you deleted.' });
    }
  }

  const restored = await db.restoreFromRecycleBin(req.params.id, req.user);
  if (!restored) {
    return res.status(404).json({ message: 'Recycle bin item not found.' });
  }
  res.json({ message: `"${restored.title}" restored successfully.`, item: restored });
};

export const purgeItem = async (req, res) => {
  const isAdmin = (req.user?.role || '').toLowerCase() === 'administrator';
  if (!isAdmin) {
    return res.status(403).json({ message: 'Only administrators can permanently delete items.' });
  }
  await db.permanentlyDeleteRecycleItem(req.params.id, req.user);
  res.json({ message: 'Item permanently deleted.' });
};

export const emptyBin = async (req, res) => {
  const isAdmin = (req.user?.role || '').toLowerCase() === 'administrator';
  if (!isAdmin) {
    return res.status(403).json({ message: 'Only administrators can empty the entire recycle bin.' });
  }
  const result = await db.emptyRecycleBin(req.user);
  res.json({ message: 'Recycle bin emptied successfully.', ...result });
};

