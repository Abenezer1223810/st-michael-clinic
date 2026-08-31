import pg from 'pg';

const { Client } = pg;

async function check(user, password, port = 5494, db = 'postgres') {
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@localhost:${port}/${db}`;
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 1500 });
  try {
    await client.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log(`FOUND WORKING CREDENTIALS! ${url}`, res.rows[0]);
    await client.end();
    return url;
  } catch (e) {
    return null;
  }
}

async function main() {
  const users = ['postgres', 'droid'];
  const passwords = [
    'postgres', 'admin', 'root', 'password', '123456', '1234', '12345', 'admin123',
    'droid', 'system', 'master', 'pass', '123', 'p@ssword', 'P@ssword1', 'st-michael', ''
  ];
  const ports = [5494, 5432];

  for (const port of ports) {
    for (const user of users) {
      for (const pwd of passwords) {
        const res = await check(user, pwd, port);
        if (res) {
          console.log('\n>>> SUCCESSFUL URL:', res);
          process.exit(0);
        }
      }
    }
  }
  console.log('No password matched standard list.');
}

main();

