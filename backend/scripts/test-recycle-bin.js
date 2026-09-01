const BASE = 'http://localhost:5000/api';

let passed = 0;
let failed = 0;

function log(ok, label, extra = '') {
  if (ok) {
    passed++;
    console.log(`  PASS  ${label}${extra ? ' -> ' + extra : ''}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${extra ? ' -> ' + extra : ''}`);
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(username, password) {
  const { status, data } = await call('POST', '/auth/login', { body: { username, password } });
  return { status, token: data.token, user: data.user };
}

async function main() {
  console.log('\n======================================================');
  console.log('ST. MICHAEL MEDIUM CLINIC - RECYCLE BIN & 30-DAY RETENTION TESTS');
  console.log('======================================================\n');

  const adminAuth = await login('admin', 'admin123');
  log(adminAuth.status === 200, 'Admin login successfully');

  // 1. Create a temporary staff user
  const uniqueUser = 'nurse_test_' + Date.now();
  const createRes = await call('POST', '/admin/users', {
    token: adminAuth.token,
    body: {
      name: 'Sister Almaz Worku',
      username: uniqueUser,
      role: 'procedure',
      title: 'Senior Triage Nurse',
      password: 'password123',
    },
  });
  const createdUser = createRes.data.user;
  log(createRes.status === 201 && createdUser?.username === uniqueUser, 'Admin creates staff account', createdUser?.name);

  // 2. Delete user -> should move to Recycle Bin
  const deleteRes = await call('DELETE', `/admin/users/${createdUser.id}`, { token: adminAuth.token });
  log(deleteRes.status === 200, 'User deleted (moved to 30-day Recycle Bin)');

  // 3. User should no longer appear in active staff accounts
  const listUsersRes = await call('GET', '/admin/users', { token: adminAuth.token });
  const inActiveList = listUsersRes.data.users?.some((u) => u.id === createdUser.id);
  log(listUsersRes.status === 200 && !inActiveList, 'Deleted user is excluded from active staff list');

  // 4. User should appear in Recycle Bin with 30 days retention
  const recycleListRes = await call('GET', '/admin/recycle-bin', { token: adminAuth.token });
  const recycleItem = recycleListRes.data.items?.find((r) => r.entityId === createdUser.id);
  log(
    recycleListRes.status === 200 &&
    Boolean(recycleItem) &&
    recycleItem.daysRemaining >= 29,
    'Item appears in Recycle Bin with 30-day retention countdown',
    `${recycleItem?.title} (${recycleItem?.daysRemaining} days remaining)`
  );

  // 5. Restore item from Recycle Bin
  const restoreRes = await call('POST', `/admin/recycle-bin/${recycleItem.id}/restore`, { token: adminAuth.token });
  log(restoreRes.status === 200, 'Admin restores item from Recycle Bin');

  // 6. User should be active again in staff accounts
  const listAfterRestore = await call('GET', '/admin/users', { token: adminAuth.token });
  const restoredUser = listAfterRestore.data.users?.find((u) => u.id === createdUser.id);
  log(Boolean(restoredUser), 'Restored user is active in staff list again', restoredUser?.username);

  // 7. Recycle Bin should now be empty of this item
  const recycleAfterRestore = await call('GET', '/admin/recycle-bin', { token: adminAuth.token });
  const stillInRecycle = recycleAfterRestore.data.items?.some((r) => r.id === recycleItem.id);
  log(!stillInRecycle, 'Restored item was removed from Recycle Bin');

  // 8. Delete again and permanently purge
  await call('DELETE', `/admin/users/${createdUser.id}`, { token: adminAuth.token });
  const recycleSecondList = await call('GET', '/admin/recycle-bin', { token: adminAuth.token });
  const itemToPurge = recycleSecondList.data.items?.find((r) => r.entityId === createdUser.id);

  const purgeRes = await call('DELETE', `/admin/recycle-bin/${itemToPurge.id}`, { token: adminAuth.token });
  log(purgeRes.status === 200, 'Admin permanently purges item from Recycle Bin');

  const finalRecycleList = await call('GET', '/admin/recycle-bin', { token: adminAuth.token });
  const purgedExists = finalRecycleList.data.items?.some((r) => r.id === itemToPurge.id);
  log(!purgedExists, 'Purged item is permanently deleted');

  // 9. Verify Audit Logs recorded all operations
  const auditRes = await call('GET', '/admin/audit-logs?limit=20', { token: adminAuth.token });
  const hasMoveLog = auditRes.data.auditLogs?.some((a) => a.action === 'MOVE_TO_RECYCLE_BIN');
  const hasRestoreLog = auditRes.data.auditLogs?.some((a) => a.action === 'RESTORE_FROM_RECYCLE_BIN');
  const hasPurgeLog = auditRes.data.auditLogs?.some((a) => a.action === 'PURGE_RECYCLE_ITEM');
  log(hasMoveLog && hasRestoreLog && hasPurgeLog, 'Audit logs recorded MOVE, RESTORE, and PURGE lifecycle actions');

  console.log(`\n======================================================`);
  console.log(`RECYCLE BIN TESTS: ${passed} passed, ${failed} failed`);
  console.log(`======================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test Runner Error:', err);
  process.exit(1);
});

