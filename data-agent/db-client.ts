import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Create the PostgreSQL driver adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Create a single instance of PrismaClient to be reused across the application
const prisma = new PrismaClient({ adapter });

export default prisma;
