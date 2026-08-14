import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
  tokenSecret: process.env.DEMO_TOKEN_SECRET || 'st-michael-demo-secret',
  clinic: {
    name: 'St. Michael Medium Clinic',
    phone: '+251 11 111 1111',
    address: 'Bole Road, Addis Ababa, Ethiopia',
    email: 'info@stmichaelclinic.et',
  },
};
