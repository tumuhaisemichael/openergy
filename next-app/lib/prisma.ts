import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  // Parse DATABASE_URL: mysql://user:password@host:port/database
  const url = new URL(dbUrl);
  const host = url.hostname || "localhost";
  const port = parseInt(url.port) || 3306;
  const user = decodeURIComponent(url.username || "root");
  const password = decodeURIComponent(url.password || "");
  const database = decodeURIComponent(url.pathname.replace("/", ""));

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit: 10
  });

  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
