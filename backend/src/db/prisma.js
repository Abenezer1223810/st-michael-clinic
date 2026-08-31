import pkg from '@prisma/client';
const PrismaClient = pkg?.PrismaClient || pkg?.default?.PrismaClient;

let prisma;

if (PrismaClient) {
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    if (!global.__prisma) {
      global.__prisma = new PrismaClient({
        log: ['warn', 'error'],
      });
    }
    prisma = global.__prisma;
  }
}

export { prisma };
export default prisma;

